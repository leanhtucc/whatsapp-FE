/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef, useEffect } from "react";
import Avatar from "../common/Avatar";
import { useStateProvider } from "@/context/StateContext";
import { BsFillChatLeftTextFill, BsThreeDotsVertical } from "react-icons/bs";
import { reducerCases } from "@/context/constants";
import ContextMenu from "../common/ContextMenu";
import { useRouter } from "next/router";
import axios from "axios"; // Make sure you have axios imported

function ChatListHeader() {
  const [{ userInfo }, dispatch] = useStateProvider();
  const router = useRouter();
  const menuButtonRef = useRef(null);

  const [contextMenuCordinates, setContextMenuCordinates] = useState({
    x: 0,
    y: 0,
  });
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const showContextMenu = (e) => {
    e.preventDefault();

    // Get the actual position of the menu button
    if (menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        // On mobile, position the menu in the top-right corner with some padding
        setContextMenuCordinates({
          x: window.innerWidth - 160, // Align from right edge with margin
          y: rect.bottom + 5, // Position below the button with a small gap
        });
      } else {
        // On desktop, position below the three dots button
        setContextMenuCordinates({
          x: rect.right - 120, // Align to the right of the button
          y: rect.bottom + 5, // Position below the button with a small gap
        });
      }
    }

    setIsContextMenuVisible(true);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isContextMenuVisible &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target)
      ) {
        setIsContextMenuVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isContextMenuVisible]);

  // Add window resize listener to adjust menu position
  useEffect(() => {
    const handleResize = () => {
      if (isContextMenuVisible && menuButtonRef.current) {
        const rect = menuButtonRef.current.getBoundingClientRect();
        const isMobile = window.innerWidth < 768;

        if (isMobile) {
          setContextMenuCordinates({
            x: window.innerWidth - 160,
            y: rect.bottom + 5,
          });
        } else {
          setContextMenuCordinates({
            x: rect.right - 120,
            y: rect.bottom + 5,
          });
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isContextMenuVisible]);

  const confirmLogout = async () => {
    try {
      setIsLoggingOut(true);

      // Clear user data from state
      dispatch({ type: reducerCases.SET_USER_INFO, userInfo: undefined });

      // Clear any auth tokens from localStorage
      localStorage.removeItem("userInfo");

      // Optional: Make an API call to logout server-side
      // await axios.get("/api/auth/logout");

      // Use window.location for a complete page refresh and redirect
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
      setShowLogoutConfirmation(false);
    }
  };

  const contextMenuOptions = [
    {
      name: "Logout",
      callback: () => {
        setIsContextMenuVisible(false);
        setShowLogoutConfirmation(true);
      },
    },
  ];

  const handleAllContactsPage = () => {
    dispatch({ type: reducerCases.SET_ALL_CONTACTS_PAGE });
  };

  return (
    <div className="h-16 px-4 py-3 flex justify-between items-center">
      <div className="cursor-pointer">
        <Avatar type={"sm"} image={userInfo?.profileImage} />
      </div>
      <div className="flex gap-6">
        <BsFillChatLeftTextFill
          className="text-panel-header-icon cursor-pointer text-xl"
          title="New Chat"
          onClick={handleAllContactsPage}
        />
        <div className="relative">
          <BsThreeDotsVertical
            className="text-panel-header-icon cursor-pointer text-xl"
            title="Menu"
            id="context-opener"
            ref={menuButtonRef}
            onClick={(e) => showContextMenu(e)}
          />
          {isContextMenuVisible && (
            <ContextMenu
              options={contextMenuOptions}
              coordinates={contextMenuCordinates}
              ContextMenu={isContextMenuVisible}
              setContextMenu={setIsContextMenuVisible}
            />
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-panel-header-background rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-xl font-medium text-white mb-4">
              Confirm Logout
            </h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to logout?
            </p>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                onClick={() => setShowLogoutConfirmation(false)}
                disabled={isLoggingOut}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center"
                onClick={confirmLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Logging out...
                  </>
                ) : (
                  "Logout"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatListHeader;
