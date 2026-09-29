// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC7oiQifOWshZdJyHOLUVX978Er8p3JDas",
  authDomain: "aptitude-test-f7026.firebaseapp.com",
  projectId: "aptitude-test-f7026",
  storageBucket: "aptitude-test-f7026.firebasestorage.app",
  messagingSenderId: "446608192272",
  appId: "1:446608192272:web:bd1ccd898b39b50d1c2b95",
  measurementId: "G-ZT3BPLWZ1H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics safely in browser environment
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export { app, analytics };
export default app;
