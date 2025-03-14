/* eslint-disable no-empty-pattern */
"use client";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import Image from "next/image";
import React, { useEffect } from "react";
import { FcGoogle } from "react-icons/fc";
import { firebaseAuth } from "../utils/FirebaseConfig";
import axios from "axios";
import { CHECK_USER_ROUTE } from "../utils/ApiRoutes";
import { useRouter } from "next/router";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
function login() {
  const router = useRouter();

  const [{ userInfo, newUser }, dispatch] = useStateProvider();

  useEffect(() => {
    console.log(userInfo, newUser);
    if (userInfo?.id && !newUser) router.push("/");
  }, [userInfo, newUser]);
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    const {
      user: { displayName: name, email, photoURL: profileImage },
    } = await signInWithPopup(firebaseAuth, provider);

    try {
      if (email) {
        const { data } = await axios.post(CHECK_USER_ROUTE, { email });

        if (!data.status || !data.data) {
          // Nếu không tìm thấy user, đánh dấu là user mới và chuyển đến onboarding
          dispatch({ type: reducerCases.SET_NEW_USER, newUser: true });
          dispatch({
            type: reducerCases.SET_USER_INFO,
            userInfo: {
              name,
              email,
              profileImage,
              status: "",
            },
          });
          router.push("/onboarding");
        } else {
          // ✅ Kiểm tra `data.data` có tồn tại trước khi destructure
          const { id, name, email, profilePicture, status } = data.data;
          dispatch({
            type: reducerCases.SET_USER_INFO,
            userInfo: {
              id,
              name,
              email,
              profileImage: profilePicture, // Sửa lại đúng key từ API
              status,
            },
          });
          router.push("/");
        }
      }
    } catch (e) {
      console.error("Login error:", e);
    }
  };

  return (
    <div className="flex justify-center items-center bg-panel-header-background h-screen w-screen flex-col gap-6 px-4">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-white">
        <Image
          src="/whatsapp.gif"
          alt="Whatsapp"
          height={300}
          width={300}
          className="w-48 h-48 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80"
        />
        <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mt-2 sm:mt-0">
          Whatsapp
        </span>
      </div>
      <button
        className="flex items-center justify-center gap-3 sm:gap-5 md:gap-7 bg-search-input-container-background p-3 sm:p-4 md:p-5 rounded-lg hover:opacity-90 transition-all w-full max-w-xs sm:max-w-sm md:max-w-md"
        onClick={handleLogin}
      >
        <FcGoogle className="text-2xl sm:text-3xl md:text-4xl" />
        <span className="text-white text-lg sm:text-xl md:text-2xl">
          Login with Google
        </span>
      </button>
    </div>
  );
}

export default login;
