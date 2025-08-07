import React, { useState } from "react";
import API from "../api";

const UploadItem = () => {
  const [image, setImage] = useState(null);
  const [placeDesc, setPlaceDesc] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [contact, setContact] = useState("");
  const [geoLocation, setGeoLocation] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const convertToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
    });

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await convertToBase64(file);
      setImage(base64);
    }
  };

  const getLocation = () => {
    setIsGettingLocation(true);
    setUploadStatus("Getting location...");

    if (!navigator.geolocation) {
      setUploadStatus("Geolocation is not supported by your browser");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGeoLocation({ lat: latitude, lng: longitude });
        setUploadStatus("Location captured successfully!");
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Location error:", error);
        setUploadStatus("Failed to get location. Please enable location services.");
        setIsGettingLocation(false);
      },
      { timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!image || !placeDesc.trim() || !itemDesc.trim() || !contact.trim()) {
      setUploadStatus("Please fill in all fields.");
      setIsSubmitting(false);
      return;
    }

    if (!geoLocation) {
      setUploadStatus("Please capture your location");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await API.post(
        "api/upload",
        { image, placeDesc, itemDesc, contact, geoLocation }
      );
      if (response.status === 200) {
        setUploadStatus("✅ Upload successful!");
        setImage(null);
        setPlaceDesc("");
        setItemDesc("");
        setContact("");
        setGeoLocation(null);
      } else {
        setUploadStatus(`❌ Upload failed: ${response.data.message}`);
      }
    } catch (err) {
      console.error(err);
      if (err.response) {
        setUploadStatus(`⚠️ Error: ${err.response.data.message}`);
      } else {
        setUploadStatus("⚠️ Network error. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-center mb-6 text-gray-700">
        Upload Lost & Found Item
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-600 font-medium mb-1">Upload Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full border border-gray-300 p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-gray-600 font-medium mb-1">Place Description</label>
          <input
            type="text"
            placeholder="Where was it found?"
            value={placeDesc}
            onChange={(e) => setPlaceDesc(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-gray-600 font-medium mb-1">Item Description</label>
          <input
            type="text"
            placeholder="Describe the item"
            value={itemDesc}
            onChange={(e) => setItemDesc(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-gray-600 font-medium mb-1">Your Contact Info</label>
          <input
            type="text"
            placeholder="Phone/Email for claims"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-gray-600 font-medium mb-1">Location</label>
          <button
            type="button"
            onClick={getLocation}
            disabled={isGettingLocation}
            className={`w-full py-2 rounded ${
              isGettingLocation
                ? "bg-gray-400 cursor-not-allowed"
                : geoLocation
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {geoLocation
              ? "✅ Location Captured"
              : isGettingLocation
              ? "Capturing Location..."
              : "Capture Current Location"}
          </button>
          {geoLocation && (
            <p className="mt-2 text-sm text-gray-600">
              Latitude: {geoLocation.lat.toFixed(6)}, Longitude: {geoLocation.lng.toFixed(6)}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full ${
            isSubmitting ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          } text-white py-2 rounded transition-colors`}
        >
          {isSubmitting ? "Uploading..." : "Submit"}
        </button>
      </form>
      {uploadStatus && (
        <p className="mt-4 text-center text-sm font-medium text-gray-700">{uploadStatus}</p>
      )}
    </div>
  );
};

export default UploadItem;
