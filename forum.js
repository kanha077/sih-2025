import { app, auth, db, storage } from "./firebase-config.js";

// Elements
const logoutBtn = document.getElementById("logout-btn");
const postBtn = document.getElementById("post-submit-btn");
const postInput = document.getElementById("post-textarea");
const postsContainer = document.getElementById("posts-container");
const mediaUpload = document.getElementById("media-upload");
const progressContainer = document.getElementById("progress-container");
const uploadProgress = document.getElementById("upload-progress");
const userEmailEl = document.getElementById("user-email");

// Check auth
auth.onAuthStateChanged(user => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    userEmailEl.textContent = user.email;
    loadPosts();
  }
});

// Logout
logoutBtn.addEventListener("click", async () => {
  await auth.signOut();
  window.location.href = "login.html";
});

// Create post
postBtn.addEventListener("click", async () => {
  const text = postInput.value.trim();
  const file = mediaUpload.files[0];

  if (!text && !file) return alert("Write something or add media");

  let mediaUrl = "";
  if (file) {
    const storageRef = storage.ref(`posts/${Date.now()}-${file.name}`);
    const uploadTask = storageRef.put(file);

    progressContainer.classList.remove("hidden");

    uploadTask.on("state_changed", snap => {
      const progress = (snap.bytesTransferred / snap.totalBytes) * 100;
      uploadProgress.style.width = progress + "%";
    });

    await uploadTask;
    mediaUrl = await storageRef.getDownloadURL();
    progressContainer.classList.add("hidden");
    uploadProgress.style.width = "0%";
  }

  await db.collection("posts").add({
    text,
    mediaUrl,
    email: auth.currentUser.email,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    likes: 0
  });

  postInput.value = "";
  mediaUpload.value = "";
});

// Load posts
function loadPosts() {
  db.collection("posts")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {
      postsContainer.innerHTML = "";
      if (snapshot.empty) {
        postsContainer.innerHTML = `<p class="text-center text-gray-500">No posts yet</p>`;
        return;
      }
      snapshot.forEach(doc => {
        const post = doc.data();
        const postId = doc.id;

        const postEl = document.createElement("div");
        postEl.className = "bg-white shadow rounded-xl p-4";
        postEl.innerHTML = `
          <div class="flex justify-between text-sm text-gray-500 mb-2">
            <span>${post.email}</span>
            <span>${post.createdAt?.toDate().toLocaleString() || ""}</span>
          </div>
          <p class="text-gray-800 mb-2">${post.text || ""}</p>
          ${
            post.mediaUrl
              ? post.mediaUrl.match(/\.mp4|\.webm/)
                ? `<video controls class="rounded-lg max-h-64 w-full"><source src="${post.mediaUrl}"></video>`
                : `<img src="${post.mediaUrl}" class="rounded-lg max-h-64 w-full object-cover"/>`
              : ""
          }
          <div class="flex space-x-6 mt-3 text-sm text-gray-500">
            <button class="like-btn" data-id="${postId}">👍 ${post.likes || 0}</button>
            <button class="comment-btn" data-id="${postId}">💬 Comment</button>
          </div>
          <div class="comments mt-3 space-y-2"></div>
          <input type="text" placeholder="Write a comment..." class="comment-input mt-2 w-full border rounded p-1 text-sm"/>
        `;

        // Like button
        postEl.querySelector(".like-btn").addEventListener("click", async e => {
          await db.collection("posts").doc(postId).update({
            likes: firebase.firestore.FieldValue.increment(1)
          });
        });

        // Comment button
        const commentInput = postEl.querySelector(".comment-input");
        commentInput.addEventListener("keypress", async e => {
          if (e.key === "Enter" && commentInput.value.trim()) {
            await db.collection("posts").doc(postId).collection("comments").add({
              text: commentInput.value.trim(),
              email: auth.currentUser.email,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            commentInput.value = "";
          }
        });

        // Load comments
        db.collection("posts").doc(postId).collection("comments").orderBy("createdAt", "asc")
          .onSnapshot(commentsSnap => {
            const commentsEl = postEl.querySelector(".comments");
            commentsEl.innerHTML = "";
            commentsSnap.forEach(c => {
              const cm = c.data();
              const div = document.createElement("div");
              div.className = "text-sm text-gray-700 bg-gray-100 p-2 rounded";
              div.textContent = `${cm.email}: ${cm.text}`;
              commentsEl.appendChild(div);
            });
          });

        postsContainer.appendChild(postEl);
      });
    });
}
