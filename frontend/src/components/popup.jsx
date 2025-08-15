import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

const Popup = ({ activeImage, setActiveImage }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!activeImage) return null;

  const handleRedirect = async () => {
    setLoading(true);
    setError("");
  
    try {
      const verifyRes = await API.get("/api/verify_token");
      const currentUsername = verifyRes.data.user?.trim();
      const PartnerUsername = activeImage.username || "" ;
      const partnerId = activeImage.uploadedBy?._id || activeImage.uploadedBy?.$oid; 
  
      console.log("CurrentUsername:", currentUsername, "PartnerUsername:", PartnerUsername);
  
      if (!currentUsername || !partnerId) {
        setError("Missing user information.");
        setLoading(false);
        return;
      }
  
      if (currentUsername === PartnerUsername) {
        setError("You cannot chat with yourself.");
        setLoading(false);
        return;
      }
  
      const payload = { partnerId };
      console.log("Sending payload:", payload);
  
      const res = await API.post("/api/chat/start", payload);
      console.log("Response:", res.data);
  
      if (res.data?.chatId) {
        setActiveImage(null);
        navigate(`/chat/${res.data.chatId}`);
      } else {
        throw new Error("Failed to start chat.");
      }
    } catch (err) {
      console.error("Error starting chat:", err);
      setError(err.response?.data?.error || err.message || "Failed to start chat.");
    } finally {
      setLoading(false);
    }
  };
  
  

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
      onClick={() => setActiveImage(null)}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 relative w-[90%] max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setActiveImage(null)}
          className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-2xl font-bold"
          aria-label="Close"
        >
          &times;
        </button>

        {activeImage.imageUrl ? (
          <img
            src={activeImage.imageUrl}
            alt="Full preview"
            className="w-full max-h-[60vh] object-contain mb-4 rounded"
          />
        ) : (
          <div className="w-full h-60 bg-gray-200 flex items-center justify-center text-gray-500">
            No image available
          </div>
        )}

        <div className="text-sm text-gray-800 space-y-2">
          <p><strong>Uploaded By:</strong> {activeImage.username || "Anonymous"}</p>
          <p><strong>Place Description:</strong> {activeImage.placeDesc || "N/A"}</p>
          <p><strong>Item Description:</strong> {activeImage.itemDesc || "N/A"}</p>
          <p>
            <strong>Timestamp:</strong>{" "}
            {activeImage.timestamp?.$date
              ? new Date(activeImage.timestamp.$date).toLocaleString()
              : "N/A"}
          </p>
          <p>
            <strong>Location:</strong>{" "}
            {activeImage.location
              ? `Lat: ${activeImage.location.coordinates[1]}, Lng: ${activeImage.location.coordinates[0]}`
              : "N/A"}
          </p>
          <p><strong>Status:</strong> {activeImage.status?.toUpperCase() || "N/A"}</p>
        </div>

        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

        <button
          onClick={handleRedirect}
          disabled={loading}
          className={`mt-4 px-4 py-2 rounded text-white ${
            loading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Starting chat..." : "Chat"}
        </button>
      </div>
    </div>
  );
};

export default Popup;
