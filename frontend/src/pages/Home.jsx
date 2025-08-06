import { useEffect, useState } from "react";
import axios from "axios";

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
        const response = await axios.get("http://localhost:5000/api/uploads");
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
                  {item.timestamp ? new Date(item.timestamp).toLocaleString() : "No time info"}
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

      {/* Modal */}
      {activeImage && (
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

            {/* All details shown here */}
            <div className="text-sm text-gray-800 space-y-2">
              <p><strong>ID:</strong> {activeImage._id || "N/A"}</p>
              <p><strong>Uploaded By ID:</strong> {activeImage.uploadedBy || "N/A"}</p>
              <p><strong>Username:</strong> {activeImage.username || "Anonymous"}</p>
              <p><strong>Contact:</strong> {activeImage.contact || "N/A"}</p>
              <p><strong>Place Description:</strong> {activeImage.placeDesc || "N/A"}</p>
              <p><strong>Item Description:</strong> {activeImage.itemDesc || "N/A"}</p>
              <p>
                <strong>Time:</strong>{" "}
                {activeImage.timestamp
                  ? new Date(activeImage.timestamp).toLocaleString()
                  : "N/A"}
              </p>
              <p>
                <strong>Location:</strong>{" "}
                {activeImage.location
                  ? `Lat: ${activeImage.location.coordinates[1]}, Lng: ${activeImage.location.coordinates[0]}`
                  : "N/A"}
              </p>
              <p><strong>Status:</strong> {activeImage.status ? activeImage.status.toUpperCase() : "N/A"}</p>
            </div>

            {/* Debug: Show full JSON object */}
            <pre className="mt-6 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-48">
              {JSON.stringify(activeImage, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
