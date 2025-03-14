/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import ChatList from "./Chatlist/ChatList";
import Chat from "./Chat/Chat";
import { onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/utils/FirebaseConfig";
import { useStateProvider } from "@/context/StateContext";
import axios from "axios";
import { CHECK_USER_ROUTE, GET_MESSAGES_ROUTE, HOST } from "@/utils/ApiRoutes";
import { useRouter } from "next/router";
import { reducerCases } from "@/context/constants";
import Empty from "./Empty";
import { io } from "socket.io-client";
import SearchMessages from "./Chat/SearchMessages";
import VideoCall from "./Call/VideoCall";
import VoiceCall from "./Call/VoiceCall";
import dynamic from "next/dynamic";
const IncomingVideoCall = dynamic(() => import("./common/IncomingVideoCall"), {
  ssr: false,
});
const IncomingVoiceCall = dynamic(() => import("./common/IncomingVoiceCall"), {
  ssr: false,
});

function Main() {
  const router = useRouter();
  const [redirectLogin, setRedirectLogin] = useState(false);
  const [socketEvent, setSocketEvent] = useState(false);
  const socket = useRef();
  const [
    {
      userInfo,
      currentChatUser,
      messageSearch,
      videoCall,
      voiceCall,
      incomingVoiceCall,
      incomingVideoCall,
    },
    dispatch,
  ] = useStateProvider();

  useEffect(() => {
    if (redirectLogin) router.push("/login");
  }, [redirectLogin, router]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      async (currentUser) => {
        if (!currentUser) {
          setRedirectLogin(true);
          return;
        }

        if (!userInfo && currentUser?.email) {
          try {
            const { data } = await axios.post(CHECK_USER_ROUTE, {
              email: currentUser.email,
            });

            if (!data.status || !data.data) {
              router.push("/login");
              return;
            }

            const {
              id,
              name,
              email,
              profilePicture: profileImage,
              status,
            } = data.data;
            dispatch({
              type: reducerCases.SET_USER_INFO,
              userInfo: {
                id,
                name,
                email,
                profileImage,
                status,
              },
            });
          } catch (error) {
            console.error("Error checking user:", error);
          }
        }
      }
    );
    return () => unsubscribe(); // Cleanup listener khi component unmount
  }, [userInfo, dispatch, router]);
  // Add this to your Main component:
  useEffect(() => {
    console.log(
      "Main component state update - incomingVideoCall:",
      incomingVideoCall
    );
  }, [incomingVideoCall]);
  useEffect(() => {
    if (userInfo) {
      console.log("Setting up socket connection with user:", userInfo.id);
      socket.current = io(HOST);

      // Add connection event listeners
      socket.current.on("connect", () => {
        console.log(
          "Socket connected successfully with ID:",
          socket.current.id
        );
        // Only emit add-user after successful connection
        socket.current.emit("add-user", userInfo.id);
        console.log("Emitted add-user event with ID:", userInfo.id);
      });

      socket.current.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      dispatch({ type: reducerCases.SET_SOCKET, socket });
    }
  }, [userInfo]);

  useEffect(() => {
    if (socket.current && !socketEvent) {
      socket.current.on("msg-receive", (data) => {
        dispatch({
          type: reducerCases.ADD_MESSAGES,
          newMessage: {
            ...data.message,
          },
        });
      });
      socket.current.on("incoming-voice-call", ({ from, roomId, callType }) => {
        dispatch({
          type: reducerCases.SET_INCOMING_VOICE_CALL,
          incomingVoiceCall: {
            ...from,
            roomId,
            callType,
          },
        });
      });
      socket.current.on("incoming-video-call", (data) => {
        dispatch({
          type: reducerCases.SET_INCOMING_VIDEO_CALL,
          incomingVideoCall: {
            ...data.from,
            roomId: data.roomId,
            callType: data.callType,
          },
        });
      });
      socket.current.on("voice-call-rejected", () => {
        dispatch({
          type: reducerCases.END_CALL,
        });
      });
      socket.current.on("video-call-rejected", () => {
        dispatch({
          type: reducerCases.END_CALL,
        });
      });
      socket.current.on("online-users", ({ onlineUsers }) => {
        dispatch({
          type: reducerCases.SET_ONLINE_USERS,
          onlineUsers,
        });
      });

      setSocketEvent(true);
    }
  }, [socket.current]);
  useEffect(() => {
    const GetMessages = async () => {
      try {
        const {
          data: { messages },
        } = await axios.get(
          `${GET_MESSAGES_ROUTE}/${userInfo.id}/${currentChatUser.id}`
        );
        dispatch({ type: reducerCases.SET_MESSAGES, messages });
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    if (currentChatUser?.id && userInfo?.id) {
      GetMessages();
    }
  }, [currentChatUser, userInfo]);

  return (
    <>
      {incomingVideoCall && <IncomingVideoCall />}
      {incomingVoiceCall && <IncomingVoiceCall />}
      {videoCall && (
        <div className="h-screen w-screen max-h-full overflow-hidden z-10">
          <VideoCall />
        </div>
      )}
      {voiceCall && (
        <div className="h-screen w-screen max-h-full overflow-hidden z-10">
          <VoiceCall />
        </div>
      )}
      {!videoCall && !voiceCall && (
        <div className="grid grid-cols-1 md:grid-cols-main h-screen w-screen overflow-hidden bg-panel-header-background">
          <div className="hidden md:block h-full bg-panel-header-background">
            <ChatList />
          </div>
          <div className="block md:hidden h-full bg-panel-header-background">
            {!currentChatUser && <ChatList />}
          </div>
          {currentChatUser ? (
            <div
              className={
                messageSearch
                  ? "grid grid-cols-1 lg:grid-cols-2 h-full"
                  : "h-full"
              }
            >
              <Chat />
              {messageSearch && (
                <div className="hidden lg:block h-full">
                  <SearchMessages />
                </div>
              )}
              {messageSearch && (
                <div className="block lg:hidden absolute inset-0 bg-conversation-panel-background z-50">
                  <SearchMessages />
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:block h-full">
              <Empty />
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default Main;
