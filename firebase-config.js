


// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

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

// ✅ Export
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
