import React, { useEffect, useState } from "react";
import API from "../api";
import Popup from "../components/popup";

function MyUploads() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    const fetchMyUploads = async () => {
      try {
        setLoading(true);
        const res = await API.get("api/myuploads"); // cookies sent automatically
        setUploads(res.data.reverse());
        setError(null);
      } catch (err) {
        console.error("Error fetching uploads:", err.response || err);
        if (err.response?.status === 401) {
          setError("Please log in to see your uploads.");
        } else {
          setError("Failed to load your uploads");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMyUploads();
  }, []);

  const handleClaim = async (id) => {
    try {
      await API.post(`api/mark-claimed/${id}`); // cookies sent automatically
      setUploads((prev) =>
        prev.map((item) => (item._id === id ? { ...item, status: "claimed" } : item))
      );
    } catch (err) {
      alert("Failed to update status");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Are you sure you want to delete this upload?");
    if (!ok) return;
    try {
      await API.delete(`api/delete/${id}`);
      // remove from UI
      setUploads((prev) => prev.filter((item) => item._id !== id));
      // close popup if it was active
      setActiveImage((prev) => (prev && prev._id === id ? null : prev));
    } catch (err) {
      console.error("Failed to delete upload:", err.response || err);
      alert("Failed to delete upload");
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
              {item.timestamp?.$date ? new Date(item.timestamp.$date).toLocaleString() : "No time"}
            </p>
            <p
              className={`text-xs mt-1 font-semibold ${
                item.status === "claimed" ? "text-green-600" : "text-red-600"
              }`}
            >
              Status: {item.status ? item.status.toUpperCase() : "UNKNOWN"}
            </p>

            <div className="mt-3 flex gap-2">
              {item.status === "not claimed" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClaim(item._id);
                  }}
                  className="bg-green-600 text-white py-2 px-3 rounded hover:bg-green-700"
                >
                  Mark as Claimed
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item._id);
                }}
                className="bg-red-600 text-white py-2 px-3 rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        <Popup activeImage={activeImage} setActiveImage={setActiveImage} />
      </div>
    </div>
  );
}

export default MyUploads;
