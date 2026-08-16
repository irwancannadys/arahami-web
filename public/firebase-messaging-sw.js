importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey:            'AIzaSyBbOP0al_mMYGLKdossJhP6c0IXSNJ-xzQ',
  authDomain:        'arahami.firebaseapp.com',
  projectId:         'arahami',
  messagingSenderId: '525356457341',
  appId:             '1:525356457341:web:7436b9b4c8dedc7c8ac014',
})

const messaging = firebase.messaging()

// Handle background notifications
messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification ?? {}
  if (!title) return
  self.registration.showNotification(title, {
    body:  body ?? '',
    icon:  '/icon-192.png',
    badge: '/icon-192.png',
    data:  payload.data ?? {},
  })
})
