import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import API from "../api"; // Adjust path as needed

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

const socket = io("https://campusbackend.loca.lt", {
  withCredentials: true,
});

export default function ChatWindow() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const currentUserId = getCookie("user_id");
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load old messages + join room
  useEffect(() => {
    API.get(`/api/chat/${chatId}/messages`)
      .then((res) => setMessages(res.data.messages || []))
      .catch((err) => console.error("Error fetching messages:", err));

    socket.emit("join", { chatId });

    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, [chatId]);

  // Send message
  const sendMessage = () => {
    if (!text.trim()) return;

    const newMsg = {
      chatId,
      sender: currentUserId,
      text,
    };

    socket.emit("send_message", newMsg);
    setText("");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 p-4">
      {/* Chat Window */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
        {messages.map((m, idx) => {
          const isCurrentUser = m.sender === currentUserId;
          return (
            <div
              key={idx}
              className={`flex flex-col max-w-[70%] ${
                isCurrentUser ? "ml-auto items-end" : "mr-auto items-start"
              }`}
            >
              <span className="text-xs text-gray-500 mb-1">
                {isCurrentUser ? "You" : m.sender_name}
              </span>
              <div
                className={`px-4 py-2 rounded-2xl shadow-md ${
                  isCurrentUser
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-white text-gray-800 rounded-bl-none"
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="flex items-center bg-white p-3 rounded-xl shadow-md"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          type="submit"
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          Send
        </button>
      </form>
    </div>
  );
}
