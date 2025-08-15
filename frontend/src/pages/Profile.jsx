import { useEffect, useState } from "react";
import API from "../api";
import { subscribeUser } from "../utils/pushNotifications"; // import your subscription helper

export default function Profile() {
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Fetch user info on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get("/api/profile");
        setUsername(res.data.username);

        // Check localStorage for push subscription
        const savedSubscription = localStorage.getItem("pushSubscription");
        setIsSubscribed(!!savedSubscription);
      } catch (err) {
        console.error("Error loading profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const handlePasswordUpdate = async () => {
    if (!newPassword.trim()) {
      setMessage("Password cannot be empty");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }
    try {
      const res = await API.put("/api/profile/password", { newPassword });
      setMessage(res.data.message || "Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Error updating password");
    }
  };

  const toggleSubscription = async () => {
    try {
      if (!isSubscribed) {
        await subscribeUser(); // subscribe user and save to backend
        setIsSubscribed(true);
        setMessage("Subscribed to notifications ✅");
      } else {
        // Unsubscribe
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          await API.post("/api/unsubscribe", { endpoint: subscription.endpoint });
          localStorage.removeItem("pushSubscription");
        }
        setIsSubscribed(false);
        setMessage("Unsubscribed from notifications ❌");
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to update subscription");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>

      <div className="mb-4">
        <label className="block font-medium mb-1">Username</label>
        <input
          type="text"
          value={username}
          readOnly
          className="border rounded-lg px-4 py-2 w-full bg-gray-100"
        />
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="border rounded-lg px-4 py-2 w-full"
        />
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">Confirm New Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="border rounded-lg px-4 py-2 w-full"
        />
      </div>

      <button
        onClick={handlePasswordUpdate}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 mb-4"
      >
        Update Password
      </button>

      <div>
      <button
        onClick={toggleSubscription}
        className={`px-4 py-2 rounded-lg ${
          isSubscribed ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
        } text-white`}
      >
        {isSubscribed ? "Unsubscribe from Notifications" : "Subscribe to Notifications"}
      </button>
      </div>

      {message && <p className="mt-3 text-sm text-gray-600">{message}</p>}
    </div>
  );
}
