/* eslint-disable @typescript-eslint/no-unused-vars */
import { reducerCases } from "@/context/constants";
import { useStateProvider } from "@/context/StateContext";
import { GET_ALL_CONTACTS_ROUTE } from "@/utils/ApiRoutes";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { BiArrowBack, BiSearchAlt2 } from "react-icons/bi";
import ChatLIstItem from "./ChatListItem";

function ContactsList() {
  const [allContacts, setAllContacts] = useState({});
  const [{ userInfo }, dispatch] = useStateProvider();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchContacts, setSearchContacts] = useState([]);

  useEffect(() => {
    if (searchTerm.length) {
      const filteredData = {};
      Object.keys(allContacts).forEach((key) => {
        const filteredContacts = allContacts[key].filter((obj) =>
          obj.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredContacts.length > 0) {
          filteredData[key] = filteredContacts;
        }
      });

      setSearchContacts(filteredData);
    } else {
      setSearchContacts(allContacts);
    }
  }, [searchTerm, allContacts]); // Thêm allContacts vào dependencies

  useEffect(() => {
    const getContacts = async () => {
      try {
        const { data } = await axios.get(GET_ALL_CONTACTS_ROUTE);

        // Kiểm tra xem users có đúng định dạng không
        if (Array.isArray(data.users)) {
          // Nhóm danh bạ theo chữ cái đầu tiên của tên
          const groupedContacts = data.users.reduce((acc, user) => {
            const firstLetter = user.name[0].toUpperCase(); // Lấy chữ cái đầu
            if (!acc[firstLetter]) {
              acc[firstLetter] = [];
            }
            acc[firstLetter].push(user);
            return acc;
          }, {});

          setAllContacts(groupedContacts);
          setSearchContacts(groupedContacts);
        } else {
          console.error("Dữ liệu API không đúng định dạng:", data);
        }
      } catch (error) {
        console.log("Lỗi khi lấy danh bạ:", error);
      }
    };
    getContacts();
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-24 flex items-end px-3 py-4">
        <div className="flex items-center gap-12 text-white">
          <BiArrowBack
            className="cursor-pointer text-xl"
            onClick={() =>
              dispatch({ type: reducerCases.SET_ALL_CONTACTS_PAGE })
            }
          />
          <span>New Chat</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-search-input-container-background h-full flex-auto overflow-auto custom-scrollbar">
        <div className="flex py-3 items-center gap-3 h-14">
          <div className="bg-panel-header-background flex items-center gap-5 px-3 py-1 rounded-lg flex-grow">
            <BiSearchAlt2 className="text-panel-header-icon cursor-pointer text-xl" />
            <input
              type="text"
              placeholder="Search Contacts"
              className="bg-transparent text-sm focus:outline-none text-white w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Danh sách danh bạ */}
        {Object.keys(searchContacts).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white opacity-75">
            <BiSearchAlt2 className="text-6xl mb-4 animate-pulse text-gray-400" />
            <p className="text-lg font-semibold">No contacts found</p>
            <p className="text-sm text-gray-400">
              Try searching for a different name.
            </p>
          </div>
        ) : (
          Object.entries(searchContacts).map(([initialLetter, userList]) => (
            <div key={Date.now() + initialLetter}>
              <div className="text-teal-light pl-10 py-5">{initialLetter}</div>
              {userList.map((contact) => (
                <ChatLIstItem
                  data={contact}
                  isContactsPage={true}
                  key={contact.id}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ContactsList;
