/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/prop-types */
import { reducerCases } from "@/context/constants";
import { useStateProvider } from "@/context/StateContext";
import { ADD_AUDIO_MESSAGE_ROUTE } from "@/utils/ApiRoutes";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import {
  FaMicrophone,
  FaPauseCircle,
  FaPlay,
  FaStop,
  FaTrash,
} from "react-icons/fa";
import { MdSend } from "react-icons/md";
import WaveSurfer from "wavesurfer.js";

function CaptureAudio({ hide }) {
  const [{ userInfo, currentChatUser, socket }, dispatch] = useStateProvider();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [waveform, setWaveform] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [renderedAudio, setRenderedAudio] = useState(null);

  const audioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const waveformRef = useRef(null);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => {
          setTotalDuration(prev + 1);
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      clearInterval(interval);
    };
  }, [isRecording]);

  useEffect(() => {
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: "#ccc",
      progressColor: "#4a9eff",
      cursorColor: "#7ae3c3",
      barWidth: 2,
      height: 30,
      responsive: true,
    });
    setWaveform(wavesurfer);

    wavesurfer.on("finish", () => {
      setIsPlaying(false);
    });
    return () => {
      wavesurfer.destroy();
    };
  }, []);

  useEffect(() => {
    if (waveform) handleStartRecording();
  }, [waveform]);

  const handlePlayRecording = () => {
    if (recordedAudio) {
      waveform.stop();
      waveform.play();
      recordedAudio.play();
      setIsPlaying(true);
    }
  };
  const handlePauseRecording = () => {
    waveform.stop();
    recordedAudio.pause();
    setIsPlaying(false);
  };
  useEffect(() => {
    if (recordedAudio) {
      const updatePlayBackTime = () => {
        setCurrentPlaybackTime(recordedAudio.currentTime);
      };
      recordedAudio.addEventListener("timeupdate", updatePlayBackTime);
      return () => {
        recordedAudio.removeEventListener("timeupdate", updatePlayBackTime);
      };
    }
  }, [recordedAudio]);
  const handleStartRecording = () => {
    setRecordingDuration(0);
    setCurrentPlaybackTime(0);
    setTotalDuration(0);
    setRecordedAudio(null);
    setRenderedAudio(null);
    setIsRecording(true);
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioRef.current.srcObject = stream;
        const chunks = [];
        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: "audio/wav" });
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          setRecordedAudio(audio);
          waveform.load(audioUrl);
        };
        mediaRecorder.start();
      })
      .catch((error) => {
        console.error("Error recording audio:", error);
      });
  };
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      waveform.stop();

      const audioChunks = [];
      mediaRecorderRef.current.addEventListener("dataavailable", (event) => {
        audioChunks.push(event.data);
      });
      mediaRecorderRef.current.addEventListener("stop", () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/mp3" });
        const audioFile = new File([audioBlob], "recording.mp3");
        setRenderedAudio(audioFile);
      });
    }
  };
  const sendRecording = async () => {
    try {
      const formData = new FormData();
      formData.append("audio", renderedAudio);
      const response = await axios.post(ADD_AUDIO_MESSAGE_ROUTE, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        params: {
          from: userInfo?.id,
          to: currentChatUser?.id,
        },
      });
      if (response.status === 201) {
        socket.current.emit("send-msg", {
          to: currentChatUser?.id,
          from: userInfo?.id,
          message: response.data.message,
        });
        dispatch({
          type: reducerCases.ADD_MESSAGES,
          newMessage: {
            ...response.data.message,
          },
          fromSeft: true,
        });
      }
    } catch (e) {
      console.error("Error sending image message:", e);
    }
  };
  const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };
  return (
    <div className="flex text-2xl w-full justify-end items-center">
      <div className="pt-1">
        <FaTrash
          className="text-panel-header-icon cursor-pointer"
          onClick={() => hide()}
        />
      </div>

      <div className="mx-4 py-2 px-4 text-white text-lg flex gap-3 justify-center items-center bg-search-input-container-background rounded-full drop-shadow-lg">
        {/* Hiển thị thời gian ghi âm */}
        {isRecording ? (
          <div className="text-red-500 animate-pulse text-center">
            Recording <span>{recordingDuration}s</span>
          </div>
        ) : (
          recordedAudio && (
            <div>
              {isPlaying ? (
                <FaStop onClick={handlePauseRecording} />
              ) : (
                <FaPlay onClick={handlePlayRecording} />
              )}
            </div>
          )
        )}

        {/* Sóng âm thanh */}
        <div className="w-60" ref={waveformRef}>
          {recordedAudio && isPlaying && (
            <span>{formatTime(currentPlaybackTime)}</span>
          )}
          {recordedAudio && !isPlaying && (
            <span>{formatTime(totalDuration)}</span>
          )}
          <audio ref={audioRef} controls hidden />
        </div>

        {/* Nút Microphone & Dừng */}
        <div className="mr-4">
          {!isRecording ? (
            <FaMicrophone
              className="text-red-500 cursor-pointer"
              onClick={handleStartRecording}
            />
          ) : (
            <FaPauseCircle
              className="text-red-500 cursor-pointer"
              onClick={handleStopRecording}
            />
          )}
        </div>

        {/* Nút gửi */}
        {recordedAudio && (
          <div>
            <MdSend
              className="text-panel-header-icon cursor-pointer mr-4"
              title="Send"
              onClick={sendRecording}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default CaptureAudio;
