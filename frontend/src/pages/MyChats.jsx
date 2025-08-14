import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api";

export default function MyChats() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/api/chat/user")
      .then((res) => setChats(res.data.chats || []))
      .catch((err) => console.error("Error fetching chats:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-6 max-w-3xl mx-auto">Loading chats…</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Chats</h1>

      {chats.length === 0 ? (
        <p className="text-gray-600">No chats yet. Start one from a user’s profile.</p>
      ) : (
        <ul className="space-y-3">
          {chats.map((c) => (
            <li key={c.chatId}>
              <Link
                to={`/chat/${c.chatId}`}
                className="flex items-center justify-between bg-white hover:bg-gray-50 border rounded-xl px-4 py-3 transition"
              >
                <div>
                  <div className="font-semibold">{c.withUser}</div>
                  <div className="text-sm text-gray-500 truncate max-w-[220px]">
                    {c.lastMessage?.text || "No messages yet"}
                  </div>
                </div>
                {c.unreadCount > 0 && (
                  <span className="text-xs bg-blue-600 text-white rounded-full px-2 py-0.5">
                    {c.unreadCount}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
