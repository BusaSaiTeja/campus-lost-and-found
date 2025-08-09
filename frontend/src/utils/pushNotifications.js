import API from "../api";

const PUBLIC_VAPID_KEY = 'BEnKYeEPRVDTPaX7NzTtlxlhWCF2jxLe6QwjyLWX_-LCEl5lMgF1oC4UB2SHNHm8X7dbHuow2wkNjwFghqbY26U'; // Replace with your VAPID public key from backend

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

export async function subscribeUser() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push messaging is not supported');
    return;
  }

  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return;
    }
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
      });
    }

    console.log('User is subscribed:', subscription);

    await API.post('/api/save-subscription', subscription, { withCredentials: true });

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe the user:', error);
  }
}
