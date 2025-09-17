// forum.js
import { auth, db, storage } from "./firebase-config.js";

const logoutBtn = document.getElementById("logout-btn");
const postTextarea = document.getElementById("post-textarea");
const postSubmitBtn = document.getElementById("post-submit-btn");
const mediaUpload = document.getElementById("media-upload");
const progressContainer = document.getElementById("progress-container");
const uploadProgress = document.getElementById("upload-progress");

const postsContainer = document.getElementById("posts-container");
const feedView = document.getElementById("feed-view");
const postDetailView = document.getElementById("post-detail-view");
const singlePostContainer = document.getElementById("single-post-container");
const threadsContainer = document.getElementById("threads-container");
const backToForumBtn = document.getElementById("back-to-forum-btn");

const sortNewestBtn = document.getElementById("sort-newest");
const sortPopularBtn = document.getElementById("sort-popular");

let currentSort = "newest"; // default sort
let selectedMediaFile = null;

// ----------------- AUTH -----------------
logoutBtn.addEventListener("click", () => {
  auth.signOut().then(() => {
    window.location.href = "login.html"; // redirect after logout
  });
});

// ----------------- POST CREATION -----------------
mediaUpload.addEventListener("change", (e) => {
  selectedMediaFile = e.target.files[0];
});

postSubmitBtn.addEventListener("click", async () => {
  const content = postTextarea.value.trim();
  if (!content && !selectedMediaFile) {
    alert("Post cannot be empty!");
    return;
  }

  postSubmitBtn.disabled = true;

  let mediaUrl = null;
  let mediaType = null;

  if (selectedMediaFile) {
    const storageRef = storage.ref(
      `posts/${Date.now()}_${selectedMediaFile.name}`
    );
    const uploadTask = storageRef.put(selectedMediaFile);

    progressContainer.style.display = "block";

    await new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          uploadProgress.style.width = `${progress}%`;
        },
        (error) => reject(error),
        async () => {
          mediaUrl = await uploadTask.snapshot.ref.getDownloadURL();
          mediaType = selectedMediaFile.type.startsWith("video")
            ? "video"
            : "image";
          resolve();
        }
      );
    });

    progressContainer.style.display = "none";
    uploadProgress.style.width = "0%";
    selectedMediaFile = null;
    mediaUpload.value = "";
  }

  await db.collection("posts").add({
    content,
    mediaUrl,
    mediaType,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    upvotes: 0,
  });

  postTextarea.value = "";
  postSubmitBtn.disabled = false;
  loadPosts();
});

// ----------------- LOAD POSTS -----------------
async function loadPosts() {
  postsContainer.innerHTML = `<div class="loader"></div>`;

  let query = db.collection("posts");

  if (currentSort === "newest") {
    query = query.orderBy("createdAt", "desc");
  } else if (currentSort === "popular") {
    query = query.orderBy("upvotes", "desc");
  }

  const snapshot = await query.get();
  postsContainer.innerHTML = "";

  snapshot.forEach((doc) => {
    const post = doc.data();
    const postEl = document.createElement("div");
    postEl.className = "post-card clickable";

    const date = post.createdAt
      ? post.createdAt.toDate().toLocaleString()
      : "Just now";

    postEl.innerHTML = `
      <div class="post-header">
        <span class="post-author">Anonymous</span>
        <span class="post-date">${date}</span>
      </div>
      <div class="post-content">${post.content || ""}</div>
      ${
        post.mediaUrl
          ? `<div class="post-media-container">${
              post.mediaType === "video"
                ? `<video controls src="${post.mediaUrl}"></video>`
                : `<img src="${post.mediaUrl}" alt="post media">`
            }</div>`
          : ""
      }
      <div class="post-footer">
        <div class="post-footer-item upvote-btn" data-id="${doc.id}">
          ⬆️ ${post.upvotes || 0}
        </div>
      </div>
    `;

    postEl.addEventListener("click", (e) => {
      if (e.target.classList.contains("upvote-btn")) return; // avoid detail click
      showPostDetail(doc.id, post);
    });

    const upvoteBtn = postEl.querySelector(".upvote-btn");
    upvoteBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await db.collection("posts").doc(doc.id).update({
        upvotes: firebase.firestore.FieldValue.increment(1),
      });
      loadPosts();
    });

    postsContainer.appendChild(postEl);
  });

  if (snapshot.empty) {
    postsContainer.innerHTML = "<p>No posts yet. Be the first!</p>";
  }
}

// ----------------- POST DETAIL -----------------
async function showPostDetail(postId, post) {
  feedView.style.display = "none";
  postDetailView.style.display = "block";

  const date = post.createdAt
    ? post.createdAt.toDate().toLocaleString()
    : "Just now";

  singlePostContainer.innerHTML = `
    <div class="post-card">
      <div class="post-header">
        <span class="post-author">Anonymous</span>
        <span class="post-date">${date}</span>
      </div>
      <div class="post-content">${post.content || ""}</div>
      ${
        post.mediaUrl
          ? `<div class="post-media-container">${
              post.mediaType === "video"
                ? `<video controls src="${post.mediaUrl}"></video>`
                : `<img src="${post.mediaUrl}" alt="post media">`
            }</div>`
          : ""
      }
    </div>
    <div class="thread-form">
      <textarea id="thread-textarea" placeholder="Write a reply..."></textarea>
      <button id="thread-submit-btn">Reply</button>
    </div>
  `;

  threadsContainer.innerHTML = `<div class="loader"></div>`;

  // Load threads
  const threadsSnap = await db
    .collection("posts")
    .doc(postId)
    .collection("threads")
    .orderBy("createdAt", "asc")
    .get();

  threadsContainer.innerHTML = "";
  threadsSnap.forEach((doc) => {
    const thread = doc.data();
    const threadEl = document.createElement("div");
    threadEl.className = "thread-card";
    threadEl.innerHTML = `
      <div class="post-header">
        <span class="post-author">Anonymous</span>
        <span class="post-date">${
          thread.createdAt
            ? thread.createdAt.toDate().toLocaleString()
            : "Just now"
        }</span>
      </div>
      <div class="post-content">${thread.content}</div>
    `;
    threadsContainer.appendChild(threadEl);
  });

  // Add new thread
  document
    .getElementById("thread-submit-btn")
    .addEventListener("click", async () => {
      const reply = document
        .getElementById("thread-textarea")
        .value.trim();
      if (!reply) return;

      await db
        .collection("posts")
        .doc(postId)
        .collection("threads")
        .add({
          content: reply,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

      showPostDetail(postId, post); // reload detail
    });
}

backToForumBtn.addEventListener("click", () => {
  postDetailView.style.display = "none";
  feedView.style.display = "block";
  loadPosts();
});

// ----------------- SORT HANDLERS -----------------
sortNewestBtn.addEventListener("click", () => {
  currentSort = "newest";
  sortNewestBtn.classList.add("active");
  sortPopularBtn.classList.remove("active");
  loadPosts();
});

sortPopularBtn.addEventListener("click", () => {
  currentSort = "popular";
  sortPopularBtn.classList.add("active");
  sortNewestBtn.classList.remove("active");
  loadPosts();
});

// ----------------- INIT -----------------
auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    loadPosts();
  }
});
