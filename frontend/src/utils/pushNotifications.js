import API from "../api";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function subscribeUser() {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push messaging not supported");
      return;
    }

    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("Notification permission denied");
        return;
      }
    }

    // Fetch VAPID key from backend
    const { data } = await API.get("/vapid_public_key");
    const vapidKey = data.key;

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }

    // Check if subscription is already saved in localStorage
    const savedSubscription = localStorage.getItem("pushSubscription");
    const currentSubscriptionString = JSON.stringify(subscription);

    if (savedSubscription !== currentSubscriptionString) {
      // Save subscription to backend only if changed or new
      await API.post("/api/save-subscription", subscription, { withCredentials: true });
      localStorage.setItem("pushSubscription", currentSubscriptionString);
      console.log("User subscribed to push notifications and subscription saved");
    } else {
      console.log("Subscription already saved, no need to save again");
    }

    return subscription;
  } catch (error) {
    console.error("Failed to subscribe the user:", error);
  }
}
