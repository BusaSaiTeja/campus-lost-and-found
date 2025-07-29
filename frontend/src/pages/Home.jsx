import { useEffect, useState } from "react";

function Home() {
  const [uploads, setUploads] = useState([]);
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("uploads") || "[]");
    setUploads(data.reverse()); // latest first
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Uploaded Items</h2>

      {uploads.length === 0 ? (
        <p>No uploads yet</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {uploads.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded shadow hover:shadow-lg cursor-pointer overflow-hidden transform transition-transform duration-300 hover:scale-105"
              onClick={() => setActiveImage(item)}
            >
              <img
                src={item.image}
                alt="preview"
                className="h-60 w-full object-cover"
              />
              <div className="p-3 text-sm">
                <p className="font-semibold">{item.itemDesc}</p>
                <p className="text-gray-600">{item.placeDesc}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {new Date(item.time).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Image Modal */}
      {activeImage && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white p-4 max-w-3xl w-full rounded relative">
            <button
              className="absolute top-2 right-2 text-red-500 text-lg"
              onClick={() => setActiveImage(null)}
            >
              ✖
            </button>
            <img
              src={activeImage.image}
              alt="full"
              className="w-full max-h-[70vh] object-contain mb-4"
            />
            <p>
              <strong>Place Description:</strong> {activeImage.placeDesc}
            </p>
            <p>
              <strong>Item Description:</strong> {activeImage.itemDesc}
            </p>
            <p>
              <strong>Time:</strong>{" "}
              {new Date(activeImage.time).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">
              📍 Lat: {activeImage.location.lat.toFixed(4)} | Lng:{" "}
              {activeImage.location.lng.toFixed(4)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
