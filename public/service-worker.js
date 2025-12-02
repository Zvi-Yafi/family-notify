// Service Worker for Web Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'FamilyNotify'
  const options = {
    body: data.body || 'יש לך הודעה חדשה',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: data.data || {},
    dir: 'rtl',
    lang: 'he',
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If a window is already open, focus it
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i]
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            return client.focus()
          }
        }
        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow('/')
        }
      })
  )
})



