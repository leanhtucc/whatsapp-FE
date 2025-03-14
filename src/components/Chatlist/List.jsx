import { reducerCases } from "@/context/constants";
import { useStateProvider } from "@/context/StateContext";
import { GET_INITIAL_CONTACTS_ROUTE } from "@/utils/ApiRoutes";
import axios from "axios";
import React, { useEffect } from "react";
import ChatListItem from "./ChatListItem"; // ✅ Đúng

function List() {
  const [{ userInfo, userContacts, filteredConteacts }, dispatch] =
    useStateProvider();

  useEffect(() => {
    const getContacts = async () => {
      try {
        const {
          data: { users, onlineUsers },
        } = await axios(`${GET_INITIAL_CONTACTS_ROUTE}/${userInfo.id}`);
        dispatch({ type: reducerCases.SET_ONLINE_USERS, onlineUsers });
        dispatch({ type: reducerCases.SET_USER_CONTACTS, userContacts: users });
      } catch (e) {
        console.log(e);
      }
    };
    if (userInfo?.id) {
      getContacts();
    }
  }, [userInfo]);
  return (
    <div className="bg-search-input-container-background flex-1 overflow-y-auto custom-scrollbar">
      {filteredConteacts && filteredConteacts.length > 0
        ? filteredConteacts.map((contact) => (
            <ChatListItem data={contact} key={contact.id} />
          ))
        : userContacts.map((contact) => (
            <ChatListItem data={contact} key={contact.id} />
          ))}
    </div>
  );
}

export default List;
