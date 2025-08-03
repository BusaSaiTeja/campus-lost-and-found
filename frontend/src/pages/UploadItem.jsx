import { useState } from "react";
import { useNavigate } from "react-router-dom";

function UploadItem() {
  const [image, setImage] = useState(null);
  const [placeDesc, setPlaceDesc] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const navigate = useNavigate();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!image || !placeDesc || !itemDesc) {
      alert("Fill all fields");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const data = {
          image,
          placeDesc,
          itemDesc,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        };

        try {
          const res = await fetch("http://localhost:5000/api/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });

          const json = await res.json();
          if (res.ok) {
            alert("Upload successful!");
            navigate("/");
          } else {
            alert(json.message || "Upload failed");
          }
        } catch (err) {
          console.error("Upload error:", err);
          alert("Error uploading");
        }
      },
      () => {
        alert("Location permission denied");
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-5xl">
        <h2 className="text-3xl font-bold text-blue-700 mb-8 text-center">Upload Lost Item</h2>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-4">
            <textarea
              placeholder="Place Description"
              rows={4}
              value={placeDesc}
              onChange={(e) => setPlaceDesc(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <textarea
              placeholder="Item Description"
              rows={4}
              value={itemDesc}
              onChange={(e) => setItemDesc(e.target.value)}
              className="w-full border border-gray-300 p-3 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={handleSubmit}
              className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              Submit
            </button>
          </div>

          {/* Image preview */}
          <div className="flex flex-col items-center space-y-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0
                         file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700
                         hover:file:bg-blue-100"
            />
            {image && (
              <img
                src={image}
                alt="Preview"
                className="w-full max-w-xs rounded-lg shadow-md border"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadItem;
