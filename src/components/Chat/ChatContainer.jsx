/* eslint-disable @typescript-eslint/no-unused-vars */
import { useStateProvider } from "@/context/StateContext";
import { calculateTime } from "@/utils/CalculateTime";
import React from "react";
import MessageStatus from "../common/MessageStatus";
import ImageMessage from "./ImageMessage";
import dynamic from "next/dynamic";
import { reducerCases } from "@/context/constants";
const VoiceMessage = dynamic(() => import("./VoiceMessage"), {
  ssr: false,
});

function ChatContainer() {
  const [{ messages, currentChatUser, userInfo }] = useStateProvider();

  return (
    <div className="flex-1 w-full relative overflow-hidden">
      {/* Background */}
      <div className="bg-chat-background bg-fixed h-full w-full opacity-5 absolute left-0 top-0 z-0"></div>

      {/* Messages */}
      <div className="h-full overflow-y-auto px-2 sm:px-4 md:px-10 py-2 sm:py-4 md:py-6 relative z-40">
        <div className="flex w-full">
          <div className="flex flex-col justify-end w-full gap-1">
            {messages && messages.length > 0 ? (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message?.senderId === currentChatUser?.id
                      ? "justify-start"
                      : "justify-end"
                  } mb-2`}
                >
                  {message.type === "text" && (
                    <div
                      className={`text-white px-2 py-[5px] text-xs sm:text-sm rounded-md flex gap-2 items-end max-w-[75%] xs:max-w-[70%] sm:max-w-[65%] md:max-w-[60%] lg:max-w-[50%] ${
                        message?.senderId === currentChatUser?.id
                          ? "bg-incoming-background"
                          : "bg-outgoing-background"
                      }`}
                    >
                      <span className="break-all">{message.message}</span>

                      <div className="flex gap-1 items-end">
                        <span className="text-bubble-meta text-[10px] sm:text-[11px] min-w-fit whitespace-nowrap">
                          {message.createdAt
                            ? calculateTime(message.createdAt)
                            : "Unknown Time"}
                        </span>
                        {message.senderId === userInfo?.id && (
                          <MessageStatus
                            messageStatus={message.messageStatus}
                          />
                        )}
                      </div>
                    </div>
                  )}
                  {message.type === "image" && (
                    <ImageMessage message={message} />
                  )}
                  {message.type === "audio" && (
                    <VoiceMessage message={message} />
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-white">No messages yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatContainer;
