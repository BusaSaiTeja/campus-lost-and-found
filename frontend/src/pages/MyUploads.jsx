import React, { useEffect, useState } from "react";
import axios from "axios";
import Popup from "../components/popup";

function MyUploads() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchMyUploads = async () => {
      if (!token) {
        setError("Authentication token missing");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/myuploads", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("My uploads response data:", res.data);
        setUploads(res.data.reverse());
        setError(null);
      } catch (err) {
        console.error("Error fetching uploads:", err.response || err);
        setError("Failed to load your uploads");
      } finally {
        setLoading(false);
      }
    };

    fetchMyUploads();
  }, [token]);

  const handleClaim = async (id) => {
    try {
      await axios.post(
        `http://localhost:5000/api/mark-claimed/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Update UI locally
      setUploads((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, status: "claimed" } : item
        )
      );
    } catch (err) {
      alert("Failed to update status");
      console.error(err);
    }
  };

  if (loading) return <p>Loading your uploads...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  if (uploads.length === 0) return <p>You have not uploaded any items yet.</p>;

  return (
  <div className="p-4">
    <h2 className="text-2xl font-bold mb-4">My Uploads</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {uploads.map((item) => (
        <div
          key={item._id}
          className="bg-white rounded shadow p-4 flex flex-col transform transition-transform duration-300 hover:scale-105 cursor-pointer"
          onClick={() => setActiveImage(item)}
        >
          <img
            src={item.imageUrl || item.image}
            alt="upload"
            className="w-full h-48 object-cover rounded mb-2"
          />
          <p className="font-semibold">{item.itemDesc}</p>
          <p className="text-gray-600">{item.placeDesc}</p>
          <p className="text-gray-500 text-xs mt-1">
            {new Date(item.timestamp.$date).toLocaleString()}
          </p>
          <p
            className={`text-xs mt-1 font-semibold ${
              item.status === "claimed" ? "text-green-600" : "text-red-600"
            }`}
          >
            Status: {item.status.toUpperCase()}
          </p>
          {item.status === "not claimed" && (
            <button
              onClick={() => handleClaim(item._id)}
              className="mt-auto bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              Mark as Claimed
            </button>
          )}
        </div>
      ))}
      <Popup activeImage={activeImage} setActiveImage={setActiveImage} />
    </div>
  </div>
);

}

export default MyUploads;
