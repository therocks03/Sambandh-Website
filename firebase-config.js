// Firebase Configuration
// 
// IMPORTANT: Replace this with your actual Firebase config from Firebase Console
// 
// Steps to get your Firebase config:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project (or use existing)
// 3. Click on "Web" icon to add web app
// 4. Copy the firebaseConfig object and paste it below
// 5. Enable Email/Password authentication in Authentication > Sign-in methods
// 6. Create Firestore database in Firestore Database section

const firebaseConfig = {
  // REPLACE THESE VALUES WITH YOUR FIREBASE PROJECT DETAILS
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Example config (THIS WON'T WORK - use your own):
/*
const firebaseConfig = {
  apiKey: "AIzaSyC1234567890abcdefghijklmnop",
  authDomain: "sambadh-crm.firebaseapp.com",
  projectId: "sambadh-crm",
  storageBucket: "sambadh-crm.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
*/

// Initialize Firebase
try {
  firebase.initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  console.log('⚠️ Please update firebase-config.js with your Firebase credentials');
}

// Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Enable persistence
db.enablePersistence()
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn('Multiple tabs open, persistence enabled in only one tab');
    } else if (err.code == 'unimplemented') {
      console.warn('Browser does not support persistence');
    }
  });

console.log('🔥 Firebase services ready: Auth & Firestore');
