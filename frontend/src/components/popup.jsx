import React from "react";

const Popup = ({ activeImage, setActiveImage }) => {
  if (!activeImage) return null;

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
          <p><strong>ID:</strong> {activeImage._id || "N/A"}</p>
          <p><strong>Uploaded By ID:</strong> {activeImage.uploadedBy?.$oid || "N/A"}</p>
          <p><strong>Username:</strong> {activeImage.username || "Anonymous"}</p>
          <p><strong>Contact:</strong> {activeImage.contact || "N/A"}</p>
          <p><strong>Place Description:</strong> {activeImage.placeDesc || "N/A"}</p>
          <p><strong>Item Description:</strong> {activeImage.itemDesc || "N/A"}</p>
          <p><strong>Timestamp:</strong> 
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
          <p>
            <strong>Status:</strong> {activeImage.status?.toUpperCase() || "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Popup;
