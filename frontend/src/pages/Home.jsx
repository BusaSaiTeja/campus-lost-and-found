import { useEffect, useState } from "react";
import axios from "axios";
import Popup from "../components/popup";
import API from "../api";

function Home() {
  const [uploads, setUploads] = useState([]);
  const [activeImage, setActiveImage] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUploads = async () => {
      try {
        setLoading(true);
        const response = await API.get("api/uploads");
        setUploads(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to load uploads");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUploads();
  }, []);

  const filteredUploads = uploads.filter((item) => {
    if (filter === "all") return true;
    if (filter === "claimed") return item.status === "claimed";
    if (filter === "not_claimed") return item.status === "not claimed";
    return true;
  });

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Uploaded Items</h2>

      {/* Filter Buttons */}
      <div className="mb-6 flex gap-4">
        {["all", "claimed", "not_claimed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`py-2 px-4 rounded transition ${
              filter === f ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {f === "not_claimed"
              ? "Not Claimed"
              : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Content Display */}
      {loading ? (
        <p>Loading uploads...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : filteredUploads.length === 0 ? (
        <p>No uploads found for this filter</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {filteredUploads.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded shadow hover:shadow-lg cursor-pointer overflow-hidden transform transition-transform duration-300 hover:scale-105"
              onClick={() => setActiveImage(item)}
            >
              <img
                src={item.imageUrl}
                alt="preview"
                className="h-60 w-full object-cover"
              />
              <div className="p-3 text-sm">
                <p className="text-gray-600">
                  <strong>Uploaded By:</strong> {item.username || "Anonymous"}
                </p>
                <p className="font-semibold">
                  <strong>PlaceDesc:</strong> {item.placeDesc || "No description"}
                </p>
                <p className="text-gray-600">
                  <strong>ItemDesc:</strong> {item.itemDesc || "No place info"}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {item.timestamp ? new Date(item.timestamp.$date).toLocaleString() : "No time info"}
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  <strong>Location:</strong>{" "}
                  {item.location
                    ? `Lat: ${item.location.coordinates[1]}, Lng: ${item.location.coordinates[0]}`
                    : "N/A"}
                </p>
                <p className="text-gray-600">
                  <strong>Contact:</strong> {item.contact || "N/A"}
                </p>
                <p className={`text-xs mt-1 font-semibold ${
                    item.status === "claimed" ? "text-green-600" : "text-red-600"
                  }`}>
                  {item.status ? item.status.toUpperCase() : "UNKNOWN"}
                </p>
                
              </div>
            </div>
          ))}
        </div>
      )}
    <Popup activeImage={activeImage} setActiveImage={setActiveImage} />
    </div>
  );
}

export default Home;
