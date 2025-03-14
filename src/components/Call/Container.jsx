/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/prop-types */
import { reducerCases } from "@/context/constants";
import { useStateProvider } from "@/context/StateContext";
import { GET_CALL_TOKEN } from "@/utils/ApiRoutes";
import axios from "axios";
import Image from "next/image";
import React, { useEffect, useState, useRef } from "react";
import { MdOutlineCallEnd } from "react-icons/md";

function Container({ data }) {
  console.log("📞 Video call data received:", data);
  const [{ socket, userInfo }, dispatch] = useStateProvider();
  const [callAccepted, setCallAccepted] = useState(false);
  const [token, setToken] = useState(undefined);
  const [zegoEngine, setZegoEngine] = useState(undefined);
  const [localStream, setLocalStream] = useState(undefined);
  const [publishStreamID, setPublishStreamID] = useState(undefined);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [callState, setCallState] = useState("initializing"); // "initializing", "connecting", "connected", "failed"

  // Debug purpose - will log state changes
  useEffect(() => {
    console.log("Call state changed:", callState);
  }, [callState]);

  useEffect(() => {
    console.log("Remote streams updated:", remoteStreams);
  }, [remoteStreams]);

  useEffect(() => {
    const setupCallListeners = () => {
      if (data.type === "out-going") {
        console.log("Setting up outgoing call listeners");
        socket.current.on("accept-call", () => {
          console.log("Call accepted by remote user");
          setCallAccepted(true);
          setCallState("connecting");
        });
      } else {
        console.log("Setting up incoming call auto-accept");
        setTimeout(() => {
          console.log("Automatically accepting incoming call");
          setCallAccepted(true);
          setCallState("connecting");
        }, 1000);
      }
    };

    setupCallListeners();

    // Cleanup listeners on unmount
    return () => {
      if (socket.current) {
        socket.current.off("accept-call");
      }
    };
  }, [data, socket]);

  useEffect(() => {
    const getToken = async () => {
      try {
        setCallState("connecting");
        console.log(`Requesting token from: ${GET_CALL_TOKEN}/${userInfo.id}`);
        const {
          data: { token: returnedToken },
        } = await axios.get(`${GET_CALL_TOKEN}/${userInfo.id}`);
        console.log("Token received successfully");
        setToken(returnedToken);
      } catch (error) {
        console.error("Error getting token:", error);
        setCallState("failed");
      }
    };

    if (callAccepted) {
      getToken();
    }
  }, [callAccepted, userInfo.id]);

  // Initialize ZegoCloud after we have a token
  useEffect(() => {
    if (!token) return;

    let engineInstance = null;

    const initializeZegoCloud = async () => {
      try {
        console.log("Initializing ZegoCloud with token");

        // Import ZegoExpressEngine - using dynamic import for better compatibility
        const { ZegoExpressEngine } = await import(
          "zego-express-engine-webrtc"
        ).then((module) => module.default || module);

        // Create engine instance with your app credentials
        const appID = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID);
        const serverID = process.env.NEXT_PUBLIC_ZEGO_SERVER_ID;
        console.log(`Creating ZegoEngine with appID: ${appID}`);

        engineInstance = new ZegoExpressEngine(appID, serverID);
        setZegoEngine(engineInstance);
        console.log("ZegoEngine instance created successfully");

        // Set debug verbosity if needed
        engineInstance.setLogConfig({
          logLevel: "debug",
        });

        // Set event handlers BEFORE logging into room
        setupEventHandlers(engineInstance);

        // Log into room with the token
        console.log(`Joining room: ${data.roomId}`);
        await engineInstance.loginRoom(
          data.roomId.toString(),
          token,
          {
            userID: userInfo.id.toString(),
            userName: userInfo.name,
          },
          {
            userUpdate: true,
          }
        );
        console.log("Successfully joined room");

        // Create and publish local stream
        await createAndPublishLocalStream(engineInstance);
      } catch (error) {
        console.error("Failed to initialize ZegoCloud:", error);
        setCallState("failed");
      }
    };

    const setupEventHandlers = (engine) => {
      // Monitor room connection state
      engine.on("roomStateUpdate", (roomID, state, errorCode, extendedData) => {
        console.log(`Room ${roomID} state: ${state}, error: ${errorCode}`);
        if (state === "CONNECTED") {
          setCallState("connected");
        } else if (state === "DISCONNECTED") {
          setCallState("failed");
        }
      });

      // Critical: Handle stream updates (when remote user publishes/unpublishes streams)
      engine.on("roomStreamUpdate", async (roomID, updateType, streamList) => {
        console.log(`Room ${roomID} stream ${updateType}:`, streamList);

        if (updateType === "ADD") {
          handleNewStreams(engine, streamList);
        } else if (updateType === "DELETE") {
          handleRemovedStreams(engine, streamList);
        }
      });

      // Handle stream state changes
      engine.on("publishQualityUpdate", (streamID, stats) => {
        console.log(`Local stream ${streamID} quality:`, stats);
      });

      engine.on("playQualityUpdate", (streamID, stats) => {
        console.log(`Remote stream ${streamID} quality:`, stats);
      });

      // Handle errors
      engine.on("roomError", (roomID, errorCode, errorMessage) => {
        console.error(`Room error: ${errorCode} - ${errorMessage}`);
        setCallState("failed");
      });
    };

    const handleNewStreams = async (engine, streamList) => {
      if (!streamList || streamList.length === 0) return;

      try {
        // Process each new stream
        for (const streamInfo of streamList) {
          console.log("Processing new stream:", streamInfo.streamID);

          // Start playing the stream
          const remoteStream = await engine.startPlayingStream(
            streamInfo.streamID
          );

          // Add to our state to keep track
          setRemoteStreams((prev) => [
            ...prev,
            {
              streamID: streamInfo.streamID,
              stream: remoteStream,
              userID: streamInfo.user.userID,
            },
          ]);

          // Create and set up video element for this stream
          createVideoElement(streamInfo.streamID, remoteStream, false);
        }
      } catch (error) {
        console.error("Error handling new streams:", error);
      }
    };

    const handleRemovedStreams = (engine, streamList) => {
      if (!streamList || streamList.length === 0) return;

      try {
        // Process each removed stream
        for (const streamInfo of streamList) {
          console.log("Processing removed stream:", streamInfo.streamID);

          // Stop playing the stream
          engine.stopPlayingStream(streamInfo.streamID);

          // Remove from our state
          setRemoteStreams((prev) =>
            prev.filter((s) => s.streamID !== streamInfo.streamID)
          );

          // Remove the video element
          const videoElement = document.getElementById(
            `video-${streamInfo.streamID}`
          );
          if (videoElement) {
            videoElement.parentNode.removeChild(videoElement);
          }
        }
      } catch (error) {
        console.error("Error handling removed streams:", error);
      }
    };

    const createAndPublishLocalStream = async (engine) => {
      try {
        console.log(`Creating local ${data.callType} stream`);

        // Create local stream
        const stream = await engine.createStream({
          camera: {
            audio: true,
            video: data.callType === "video",
          },
        });

        setLocalStream(stream);
        console.log("Local stream created successfully");

        // Create video element for local stream
        createVideoElement("local", stream, true);

        // Generate unique stream ID and publish
        const streamId = `u${userInfo.id}_${Date.now()}`;
        console.log(`Publishing local stream with ID: ${streamId}`);

        await engine.startPublishingStream(streamId, stream);
        setPublishStreamID(streamId);
        console.log("Local stream published successfully");
      } catch (error) {
        console.error("Failed to create or publish local stream:", error);
      }
    };

    const createVideoElement = (streamID, stream, isLocal) => {
      try {
        // Get the appropriate container based on whether this is local or remote
        const containerId = isLocal
          ? "local-video-container"
          : "remote-video-container";
        const container = document.getElementById(containerId);

        if (!container) {
          console.error(`Video container ${containerId} not found`);
          return;
        }

        // Create element based on call type
        const mediaElement = document.createElement(
          data.callType === "video" ? "video" : "audio"
        );
        const elementId = `video-${streamID}`;

        // Set attributes
        mediaElement.id = elementId;
        mediaElement.srcObject = stream;
        mediaElement.autoplay = true;
        mediaElement.playsInline = true;
        mediaElement.muted = isLocal; // Mute local audio to prevent feedback

        // Set styling
        if (isLocal) {
          mediaElement.className =
            "h-28 w-28 object-cover rounded-lg shadow-lg";
        } else {
          mediaElement.className = "w-full h-full object-cover rounded-lg";
        }

        // Clear container before adding (for single-stream containers)
        if (
          (isLocal && streamID === "local") ||
          (!isLocal && container.childElementCount === 0)
        ) {
          container.innerHTML = "";
        }

        // Add to DOM
        container.appendChild(mediaElement);
        console.log(
          `Created ${
            isLocal ? "local" : "remote"
          } media element with ID: ${elementId}`
        );

        // Force play (helpful for mobile browsers with autoplay restrictions)
        mediaElement.play().catch((error) => {
          console.warn(`Autoplay prevented for ${elementId}:`, error);
        });
      } catch (error) {
        console.error(
          `Error creating video element for stream ${streamID}:`,
          error
        );
      }
    };

    // Start initialization
    initializeZegoCloud();

    // Cleanup function
    return () => {
      if (engineInstance) {
        try {
          console.log("Cleaning up ZegoCloud resources");

          // Stop all remote streams
          remoteStreams.forEach(({ streamID }) => {
            try {
              engineInstance.stopPlayingStream(streamID);
            } catch (e) {
              console.warn(`Error stopping remote stream ${streamID}:`, e);
            }
          });

          // Stop local stream
          if (localStream) {
            try {
              if (publishStreamID) {
                engineInstance.stopPublishingStream(publishStreamID);
              }
              engineInstance.destroyStream(localStream);
            } catch (e) {
              console.warn("Error cleaning up local stream:", e);
            }
          }

          // Leave room
          try {
            engineInstance.logoutRoom(data.roomId.toString());
          } catch (e) {
            console.warn("Error logging out of room:", e);
          }

          setZegoEngine(null);
          setLocalStream(null);
          setPublishStreamID(null);
          setRemoteStreams([]);
        } catch (error) {
          console.error("Error during cleanup:", error);
        }
      }
    };
  }, [token, data.roomId, data.callType, userInfo.id, userInfo.name]);

  const handleCallCleanup = () => {
    if (!zegoEngine) return;

    try {
      console.log("Performing call cleanup");

      // Stop all remote streams
      remoteStreams.forEach(({ streamID }) => {
        try {
          zegoEngine.stopPlayingStream(streamID);
          console.log(`Stopped playing remote stream: ${streamID}`);
        } catch (e) {
          console.warn(`Error stopping stream ${streamID}:`, e);
        }
      });

      // Stop local stream
      if (localStream) {
        if (publishStreamID) {
          zegoEngine.stopPublishingStream(publishStreamID);
          console.log(`Stopped publishing local stream: ${publishStreamID}`);
        }

        zegoEngine.destroyStream(localStream);
        console.log("Destroyed local stream");
      }

      // Leave room
      zegoEngine.logoutRoom(data.roomId.toString());
      console.log(`Logged out of room: ${data.roomId}`);

      // Reset state
      setLocalStream(null);
      setPublishStreamID(null);
      setRemoteStreams([]);
    } catch (error) {
      console.error("Error during call cleanup:", error);
    }
  };

  const endCall = () => {
    console.log("User initiated end call");
    const id = data.id;

    // Clean up resources
    handleCallCleanup();

    // Notify other party via socket
    if (socket.current) {
      if (data.callType === "voice") {
        socket.current.emit("reject-voice-call", { from: id });
      } else {
        socket.current.emit("reject-video-call", { from: id });
      }
      console.log(`Emitted reject-${data.callType}-call event`);
    }

    // Update app state to end call UI
    dispatch({ type: reducerCases.END_CALL });
  };

  return (
    <div className="border-conversation-border border-l w-full bg-black flex flex-col h-[100vh] overflow-hidden items-center justify-center text-white">
      {/* Connection status indicator */}
      {callState !== "connected" && (
        <div className="absolute top-4 right-4 px-3 py-1 bg-opacity-70 bg-black rounded-full text-sm">
          {callState === "initializing" && "Initializing..."}
          {callState === "connecting" && "Connecting..."}
          {callState === "failed" && "Connection failed"}
        </div>
      )}

      {/* Call information */}
      <div className="flex flex-col gap-3 items-center">
        <span className="text-3xl font-semibold">{data?.name}</span>
        <span className="text-lg opacity-80">
          {callAccepted && callState === "connected"
            ? data.callType === "video"
              ? "Video call in progress"
              : "Voice call in progress"
            : "Calling..."}
        </span>
      </div>

      {/* Avatar display (shown when no video) */}
      {(data.callType !== "video" || callState !== "connected") && (
        <div className="my-12">
          <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden shadow-lg">
            <Image
              src={data?.profilePicture}
              alt="avatar"
              fill
              className="object-cover"
            />
          </div>
        </div>
      )}

      {/* Video display area - only shown for video calls when connected */}
      {data.callType === "video" && (
        <div
          className={`relative w-full max-w-4xl flex-1 my-6 ${
            callState !== "connected" ? "hidden" : ""
          }`}
        >
          {/* Remote video container */}
          <div
            id="remote-video-container"
            className="w-full h-full rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center"
          >
            {callState === "connected" && remoteStreams.length === 0 && (
              <div className="text-center p-4">
                <p>Waiting for remote video...</p>
              </div>
            )}
          </div>

          {/* Local video container (positioned at bottom right) */}
          <div
            id="local-video-container"
            className="absolute bottom-4 right-4 w-28 h-28 rounded-lg overflow-hidden bg-gray-700 shadow-lg"
          ></div>
        </div>
      )}

      {/* Audio-only containers (hidden from UI but needed for the streams) */}
      {data.callType === "audio" && (
        <div className="hidden">
          <div id="remote-video-container"></div>
          <div id="local-video-container"></div>
        </div>
      )}

      {/* End call button */}
      <div
        className="h-14 w-14 bg-red-600 flex items-center justify-center rounded-full shadow-lg cursor-pointer mt-6"
        onClick={endCall}
      >
        <MdOutlineCallEnd className="text-3xl" />
      </div>
    </div>
  );
}

export default Container;
