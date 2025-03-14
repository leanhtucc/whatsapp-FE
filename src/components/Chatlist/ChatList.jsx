/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from "react";
import ChatListHeader from "./ChatListHeader";
import SearchBar from "./SearchBar";
import List from "./List";
import { useStateProvider } from "@/context/StateContext";
import ContactsList from "./ContactsList";

function ChatList() {
  const [{ contactsPage }] = useStateProvider();
  const [pageType, setPageType] = useState("default");

  useEffect(() => {
    if (contactsPage) {
      setPageType("all-contacts");
    } else {
      setPageType("default");
    }
  }, [contactsPage]);

  return (
    <div className="bg-panel-header-background flex flex-col h-full">
      {pageType === "default" && (
        <>
          <ChatListHeader />
          <SearchBar />
          <div className="flex-1 overflow-hidden flex flex-col">
            <List />
          </div>
        </>
      )}
      {pageType === "all-contacts" && (
        <div className="h-full">
          <ContactsList />
        </div>
      )}
    </div>
  );
}

export default ChatList;
