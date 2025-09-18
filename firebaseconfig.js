
          const firebaseConfig = {
  apiKey: "AIzaSyBr347m53UAvyMcTOjQwrIN_kOFYcenIMM",
  authDomain: "ananda-74477.firebaseapp.com",
  databaseURL: "https://ananda-74477-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "ananda-74477",
  storageBucket: "ananda-74477.firebasestorage.app",
  messagingSenderId: "525918416681",
  appId: "1:525918416681:web:fb89b43c7a395816021138",
  measurementId: "G-CL5KLMJD6N"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Make services available to other scripts
const auth = firebase.auth();
const db = firebase.firestore();
const rtdb = firebase.database();

export { auth, db, rtdb };