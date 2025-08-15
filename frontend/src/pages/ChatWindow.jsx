import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import API from "../api";

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

export default function ChatWindow() {
  const { chatId } = useParams();
  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [socket, setSocket] = useState(null);
  const [typing, setTyping] = useState(null);

  const currentUserId = getCookie("user_id");
  const chatEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingEmitTimeout = useRef(null);

  // -------------------- Socket Initialization --------------------
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_URL;
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket"],
      path: "/socket.io",
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  // -------------------- Join Room + Events --------------------
  useEffect(() => {
    if (!socket || !chatId) return;

    const joinRoom = () => socket.emit("join", { chatId });

    if (socket.connected) joinRoom();
    else socket.on("connect", joinRoom);

    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    });

    socket.on("typing", (data) => {
      if (data.userId !== currentUserId) {
        setTyping(data.isTyping ? partner?.username || "Someone" : null);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (data.isTyping) {
          typingTimeoutRef.current = setTimeout(() => setTyping(null), 2000);
        }
      }
    });

    // Fetch latest messages on reconnect to avoid missing any
    socket.on("connect", async () => {
      try {
        const res = await API.get(`/api/chat/${chatId}/messages`);
        setMessages(res.data.messages || []);
        scrollToBottom();
      } catch (e) {
        console.error("Failed to fetch messages on reconnect:", e);
      }
    });

    return () => {
      socket.off("receive_message");
      socket.off("typing");
      socket.off("connect", joinRoom);
      socket.emit("leave", { chatId });
    };
  }, [socket, chatId, currentUserId, partner]);

  // -------------------- Load Chat Info + History --------------------
  useEffect(() => {
    if (!chatId) return;

    (async () => {
      try {
        const info = await API.get(`/api/chat/${chatId}/info`);
        setPartner(info.data.partner);

        const res = await API.get(`/api/chat/${chatId}/messages`);
        setMessages(res.data.messages || []);
      } catch (e) {
        console.error("Error loading chat:", e);
      } finally {
        scrollToBottom();
      }
    })();
  }, [chatId]);

  // -------------------- Helpers --------------------
  const scrollToBottom = () => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;

    const messageData = {
      chatId,
      text: text.trim(),
      senderId: currentUserId,
      timestamp: new Date().toISOString(),
      senderName: "You",
    };

    setMessages((prev) => [...prev, messageData]);
    scrollToBottom();
    console.log("message sent" , messageData) ;
    socket.emit("send_message", messageData);
    setText("");
  };

  const handleTyping = (val) => {
    setText(val);
    if (!socket) return;

    if (typingEmitTimeout.current) clearTimeout(typingEmitTimeout.current);

    typingEmitTimeout.current = setTimeout(() => {
      socket.emit("typing", { chatId, isTyping: val.length > 0, userId: currentUserId });
    }, 200);
  };

  if (!chatId) return <div className="p-4">Chat ID missing in URL.</div>;
  if (!currentUserId) return <div className="p-4">Please log in to chat.</div>;

  // -------------------- JSX --------------------
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-white shadow px-4 py-3 text-xl font-semibold border-b">
        💬 Chat with {partner?.username || "Loading..."}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, index) => {
          const isCurrentUser = m.senderId === currentUserId;
          return (
            <div
              key={m._id || m.timestamp || index}
              className={`flex flex-col max-w-[70%] ${
                isCurrentUser ? "ml-auto items-end" : "mr-auto items-start"
              }`}
            >
              <span className="text-xs text-gray-500 mb-1">
                {isCurrentUser ? "You" : partner?.username || "User"}
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
              <span className="text-[10px] text-gray-400 mt-1">
                {new Date(m.timestamp).toLocaleString()}
              </span>
            </div>
          );
        })}
        {typing && <div className="text-xs text-gray-500">{typing} is typing…</div>}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center bg-white p-3 border-t">
        <input
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
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
