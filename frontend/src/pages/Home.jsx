import { useEffect, useState } from "react";
import API from "../api";
import Popup from "../components/popup";
import { subscribeUser } from "../utils/pushNotifications";

function Home() {
  const [uploads, setUploads] = useState([]);
  const [activeImage, setActiveImage] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const registerSWAndSubscribe = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/service-worker.js');
          console.log('Service Worker registered:', registration);

          if ('PushManager' in window) {
            await subscribeUser();
          }
        } catch (err) {
          console.error('Service Worker registration failed:', err);
        }
      } else {
        console.warn('Service Worker not supported');
      }
    };

    const fetchUploads = async () => {
      try {
        setLoading(true);
        const response = await API.get("api/uploads"); // cookies sent automatically
        setUploads(response.data);
        setError(null);
      } catch (err) {
        if (err.response?.status === 401) {
          setError("Please log in to see uploads.");
        } else {
          setError("Failed to load uploads");
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const init = async () => {
      await registerSWAndSubscribe();
      await fetchUploads();
    };

    init();
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

      <div className="mb-6 flex gap-4">
        {["all", "claimed", "not_claimed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`py-2 px-4 rounded transition ${
              filter === f ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {f === "not_claimed" ? "Not Claimed" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

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
              <img src={item.imageUrl} alt="preview" className="h-60 w-full object-cover" />
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
                  {item.timestamp
                    ? new Date(item.timestamp.$date).toLocaleString()
                    : "No time info"}
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  <strong>Location:</strong>{" "}
                  {item.location
                    ? `Lat: ${item.location.coordinates[1]}, Lng: ${item.location.coordinates[0]}`
                    : "N/A"}
                </p>
                
                <p
                  className={`text-xs mt-1 font-semibold ${
                    item.status === "claimed" ? "text-green-600" : "text-red-600"
                  }`}
                >
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
