/* eslint-disable no-empty */
import Avatar from "@/components/common/Avatar";
import Input from "@/components/common/Input";
import { reducerCases } from "@/context/constants";
import { useStateProvider } from "@/context/StateContext";
import { ONBOARD_USER_ROUTE } from "@/utils/ApiRoutes";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

function Onboarding() {
  const router = useRouter();
  const [{ userInfo, newUser }, dispatch] = useStateProvider();
  const [name, setName] = useState(userInfo?.name || "");
  const [about, setAbout] = useState("");
  const [image, setImage] = useState("/default_avatar.png");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!newUser && !userInfo?.email) router.push("/login");
    else if (!newUser && userInfo?.email) router.push("/");
  }, [newUser, userInfo, router]);

  const onboardUserHandler = async () => {
    if (validateDetails()) {
      setIsSubmitting(true);
      setError("");
      const email = userInfo.email;

      try {
        const { data } = await axios.post(ONBOARD_USER_ROUTE, {
          email,
          name,
          about,
          image,
        });

        if (data.status) {
          dispatch({ type: reducerCases.SET_NEW_USER, newUser: false });
          dispatch({
            type: reducerCases.SET_USER_INFO,
            userInfo: {
              id: data.user.id,
              name,
              email,
              profileImage: image,
              status: about,
            },
          });
          router.push("/");
        }
      } catch (error) {
        if (error.response && error.response.status === 409) {
          setError("User already exists. Please log in instead.");
        } else {
          console.error("❌ API Error:", error);
          setError("Something went wrong. Please try again.");
        }
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setError("Name must be at least 3 characters long.");
    }
  };

  const validateDetails = () => {
    return name.length >= 3;
  };

  return (
    <div className="bg-panel-header-background min-h-screen w-screen text-white flex flex-col items-center justify-center px-4 py-8">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-6">
        <Image
          src="/whatsapp.gif"
          height={300}
          width={300}
          alt="whatsapp"
          className="w-40 h-40 sm:w-48 sm:h-48 md:w-60 md:h-60"
        />
        <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">
          Whatsapp
        </span>
      </div>

      <h2 className="text-xl sm:text-2xl font-medium mb-6">
        Create your profile
      </h2>

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-md p-3 mb-4 max-w-md w-full">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-3xl justify-center items-center">
        <div className="flex flex-col items-center justify-center gap-5 w-full max-w-md">
          <Input name="Display Name" state={name} setState={setName} label />
          <Input name="About" state={about} setState={setAbout} label />
          <button
            className="bg-search-input-container-background hover:bg-search-input-container-background/90 p-4 rounded-lg w-full max-w-xs transition-all disabled:opacity-70"
            onClick={onboardUserHandler}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating Profile..." : "Create Profile"}
          </button>
        </div>

        <div className="mt-6 md:mt-0">
          <Avatar type="xl" image={image} setImage={setImage} />
          <p className="text-center mt-2 text-sm text-gray-300">
            Click to change avatar
          </p>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
