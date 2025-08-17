// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyAI7KcHB_ufFjXMUk9ipn22ZQPTS5-fbs0",
  authDomain: "pourpal-9bc4a.firebaseapp.com",
  projectId: "pourpal-9bc4a",
  storageBucket: "pourpal-9bc4a.firebasestorage.app",
  messagingSenderId: "415863957216",
  appId: "1:415863957216:web:429c0f5190fa70c3ae5285"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export default app;
