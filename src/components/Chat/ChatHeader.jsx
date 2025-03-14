import React from "react";
import Avatar from "../common/Avatar";
import { MdCall, MdArrowBack } from "react-icons/md";
import { IoVideocam } from "react-icons/io5";
import { BiSearchAlt2 } from "react-icons/bi";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";

function ChatHeader() {
  const [{ currentChatUser, onlineUsers }, dispatch] = useStateProvider();

  const handleVoiceCall = () => {
    dispatch({
      type: reducerCases.SET_VOICE_CALL,
      voiceCall: {
        ...currentChatUser,
        type: "out-going",
        callType: "voice",
        roomId: Date.now(),
      },
    });
  };

  const handleVideoCall = () => {
    const callData = {
      ...currentChatUser,
      type: "out-going",
      callType: "video",
      roomId: Date.now(),
    };

    console.log("Initiating video call with data:", callData);

    dispatch({
      type: reducerCases.SET_VIDEO_CALL,
      videoCall: callData,
    });
  };

  const handleExitChat = () => {
    dispatch({ type: reducerCases.SET_EXIT_CHAT });
  };

  return (
    <div className="h-16 px-4 py-3 flex justify-between items-center bg-panel-header-background z-10 shadow-sm">
      <div className="flex items-center justify-center gap-2 md:gap-6">
        {/* Nút Back chỉ hiển thị trên điện thoại (màn hình nhỏ) và ẩn trên máy tính (md và lớn hơn) */}
        <button
          onClick={handleExitChat}
          className="md:hidden text-panel-header-icon cursor-pointer p-1 rounded-full hover:bg-panel-header-background-hover transition-all"
          aria-label="Back to Home"
        >
          <MdArrowBack className="text-lg" />
        </button>

        <Avatar type="sm" image={currentChatUser?.profilePicture} />
        <div className="flex flex-col">
          <span className="text-primary-strong font-medium text-md truncate max-w-32 sm:max-w-full">
            {currentChatUser?.name}
          </span>
          <span className="text-secondary text-xs truncate">
            {onlineUsers.includes(currentChatUser?.id) ? "online" : "offline"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={handleVoiceCall}
          className="text-panel-header-icon cursor-pointer p-1 md:p-2 rounded-full hover:bg-panel-header-background-hover transition-all"
          aria-label="Voice Call"
        >
          <MdCall className="text-lg md:text-xl" />
        </button>

        <button
          onClick={handleVideoCall}
          className="text-panel-header-icon cursor-pointer p-1 md:p-2 rounded-full hover:bg-panel-header-background-hover transition-all"
          aria-label="Video Call"
        >
          <IoVideocam className="text-lg md:text-xl" />
        </button>

        <button
          onClick={() => dispatch({ type: reducerCases.SET_MESSAGE_SEARCH })}
          className="text-panel-header-icon cursor-pointer p-1 md:p-2 rounded-full hover:bg-panel-header-background-hover transition-all"
          aria-label="Search Messages"
        >
          <BiSearchAlt2 className="text-lg md:text-xl" />
        </button>
      </div>
    </div>
  );
}

export default ChatHeader;
