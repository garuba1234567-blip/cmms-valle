/* Firebase Messaging Service Worker */
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyB4GnMColSExQ2Vn1kKwyZpT1Kswdkx7ik",
  authDomain: "cmms-valle.firebaseapp.com",
  projectId: "cmms-valle",
  storageBucket: "cmms-valle.firebasestorage.app",
  messagingSenderId: "500527794847",
  appId: "1:500527794847:web:7f38de0ac6862f104e30aa",
});

const messaging = firebase.messaging();

// Background messages
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Nueva orden";
  const body = payload.notification?.body || payload.data?.body || "";
  const url = payload.data?.url || "/";

  self.registration.showNotification(title, {
    body,
    data: { url },
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    requireInteraction: true,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clis) => {
      for (const client of clis) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
