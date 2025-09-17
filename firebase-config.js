

// firebase-config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
          const firebaseConfig = {
  apiKey: "AIzaSyBr347m53UAvyMcTOjQwrIN_kOFYcenIMM",
  authDomain: "ananda-74477.firebaseapp.com",
  databaseURL: "https://ananda-74477-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ananda-74477",
  storageBucket: "ananda-74477.firebasestorage.app",
  messagingSenderId: "525918416681",
  appId: "1:525918416681:web:fb89b43c7a395816021138",
  measurementId: "G-CL5KLMJD6N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Export properly
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
