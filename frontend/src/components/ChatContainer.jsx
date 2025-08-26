import React, { useContext, useEffect, useRef, useState } from "react";
import assets from "../assets/assets";
import { formatMessageTime } from "../lib/utils";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

const ChatContainer = () => {
  const { messages, selectedUser, setSelectedUser, sendMessage, getMessages, deleteMessage } =
    useContext(ChatContext);   // ⬅️ now we bring in deleteMessage
  const { authUser, onlineUsers } = useContext(AuthContext);
  const scrollEnd = useRef();

  const [input, setInput] = useState("");

  // Handle sending text message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === "") return;
    await sendMessage({ text: input.trim() });
    setInput("");
  };

  // Handle sending image
  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Select a valid image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({ image: reader.result });
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (scrollEnd.current && messages) {
      scrollEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return selectedUser ? (
    <div className="h-full overflow-hidden relative backdrop-blur-lg">
      {/* -------- Header -------- */}
      <div className="flex items-center gap-3 py-3 px-4 border-b border-stone-500">
        <img
          src={selectedUser.profilePic || assets.avatar_icon}
          alt=""
          className="w-8 h-8 rounded-full"
        />
        <p className="flex-1 text-lg text-white flex items-center gap-2">
          {selectedUser.fullName}
          {onlineUsers.includes(selectedUser._id) && (
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          )}
        </p>
        <img
          onClick={() => setSelectedUser(null)}
          src={assets.arrow_icon}
          alt=""
          className="md:hidden max-w-7 cursor-pointer"
        />
        <img
          src={assets.help_icon}
          alt=""
          className="max-md:hidden max-w-5 cursor-pointer"
        />
      </div>

      {/* ------ Chat Area -------- */}
      <div className="flex flex-col h-[calc(100%-120px)] overflow-y-auto p-4">
        {messages.map((msg, index) => {
          const isSender = msg.senderId === authUser._id;
          return (
            <div
              key={msg._id || index}
              onContextMenu={(e) => {
                e.preventDefault();
                if (isSender && window.confirm("Delete this message?")) {
                  deleteMessage(msg._id);
                }
              }}
              className={`flex items-end mb-4 ${
                isSender ? "justify-end" : "justify-start"
              }`}
            >
              {/* Receiver Avatar */}
              {!isSender && (
                <img
                  src={selectedUser?.profilePic || assets.avatar_icon}
                  alt=""
                  className="w-7 h-7 rounded-full mr-2"
                />
              )}

              {/* Message bubble + time */}
              <div
                className={`flex flex-col ${
                  isSender ? "items-end" : "items-start"
                }`}
              >
                {msg.image ? (
                  <img
                    src={msg.image}
                    alt="sent"
                    className="max-w-[230px] rounded-lg mb-1"
                  />
                ) : (
                  <p
                    className={`px-3 py-2 text-sm rounded-lg ${
                      isSender
                        ? "bg-violet-600 text-white rounded-br-none"
                        : "bg-violet-500/30 text-white rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </p>
                )}
                <span className="text-xs text-gray-400 mt-1">
                  {formatMessageTime(msg.createdAt)}
                </span>
              </div>

              {/* Sender Avatar */}
              {isSender && (
                <img
                  src={authUser?.profilePic || assets.avatar_icon}
                  alt=""
                  className="w-7 h-7 rounded-full ml-2"
                />
              )}
            </div>
          );
        })}
        <div ref={scrollEnd}></div>
      </div>

      {/* ---- Bottom area ---- */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3">
        <div className="flex-1 flex items-center bg-gray-100/10 px-3 rounded-full">
          <input
            onChange={(e) => setInput(e.target.value)}
            value={input}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                handleSendMessage(e);
              }
            }}
            type="text"
            placeholder="Send a message"
            className="flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400 bg-transparent"
          />
          <input
            onChange={handleSendImage}
            type="file"
            id="image"
            accept="image/png,image/jpeg"
            hidden
          />
          <label htmlFor="image">
            <img
              src={assets.gallery_icon}
              alt=""
              className="w-5 mr-2 cursor-pointer"
            />
          </label>
        </div>
        <img
          onClick={(e) => handleSendMessage(e)}
          src={assets.send_button}
          alt=""
          className="w-7 cursor-pointer"
        />
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden">
      <img src={assets.logo_icon} alt="" className="max-w-15" />
      <p className="text-lg font-medium text-white">Chat anytime, anywhere</p>
    </div>
  );
};

export default ChatContainer;
