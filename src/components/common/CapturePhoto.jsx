/* eslint-disable react/prop-types */
import React, { useEffect, useRef } from "react";
import { IoClose } from "react-icons/io5";

function CapturePhoto({ hide, setImage }) {
  const videoRef = useRef();

  useEffect(() => {
    let stream;
    const startCamera = async () => {
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      videoRef.current.srcObject = stream;
    };
    startCamera();
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const capturePhoto = () => {
    const canvas = document.createElement("canvas");
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0, 300, 150);
    setImage(canvas.toDataURL("image/jpeg"));
    hide(false);
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="relative bg-gray-900 w-[450px] h-[550px] rounded-2xl shadow-lg flex flex-col items-center p-5">
        {/* Nút đóng */}
        <div
          className="pt-2 pe-2 cursor-pointer flex items-end justify-end absolute top-4 right-4 z-50 "
          onClick={() => hide(false)}
        >
          <IoClose className="h-10 w-10 cursor-pointer" />
        </div>

        {/* Video Preview */}
        <div className="flex justify-center w-full h-3/4">
          <video
            id="video"
            className="rounded-lg w-full h-full object-cover"
            autoPlay
            ref={videoRef}
          ></video>
        </div>

        {/* Nút chụp ảnh */}
        <button
          className="mt-5 h-16 w-16 bg-white rounded-full border-8 border-teal-400 shadow-md hover:scale-110 transition"
          onClick={capturePhoto}
        ></button>
      </div>
    </div>
  );
}

export default CapturePhoto;
