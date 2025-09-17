import { auth, db, storage } from './firebase-config.js';

// --- DOM REFERENCES ---
const feedView = document.getElementById('feed-view');
const postDetailView = document.getElementById('post-detail-view');
const singlePostContainer = document.getElementById('single-post-container');
const threadsContainer = document.getElementById('threads-container');
const backToForumBtn = document.getElementById('back-to-forum-btn');
const logoutBtn = document.getElementById('logout-btn');
const postTextarea = document.getElementById('post-textarea');
const postSubmitBtn = document.getElementById('post-submit-btn');
const mediaUploadInput = document.getElementById('media-upload');
const progressContainer = document.getElementById('progress-container');
const uploadProgress = document.getElementById('upload-progress');
const postsContainer = document.getElementById('posts-container');
const sortNewestBtn = document.getElementById('sort-newest');
const sortPopularBtn = document.getElementById('sort-popular');

let currentSortOrder = { field: 'createdAt', direction: 'desc' };
let unsubscribePosts = null;
let unsubscribeThreads = null;
let fileToUpload = null;

// --- ANONYMOUS NAME GENERATOR ---
const adjectives = ["Clever", "Curious", "Brave", "Wise", "Silent", "Scholarly", "Creative", "Fearless", "Humble"];
const nouns = ["Falcon", "Panda", "Coyote", "Sparrow", "Chameleon", "Jaguar", "Lion", "Wolf", "Eagle"];
function generateAnonymousName() {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj} ${noun}`;
}

// --- AUTHENTICATION & INITIALIZATION ---
auth.onAuthStateChanged(user => {
    if (user) {
        fetchPosts();
    } else {
        window.location.href = 'index.html';
    }
});

// --- VIEW MANAGEMENT ---
function showFeedView() {
    postDetailView.style.display = 'none';
    feedView.style.display = 'block';
    if (unsubscribeThreads) unsubscribeThreads();
}

function showPostDetailView(postId) {
    feedView.style.display = 'none';
    postDetailView.style.display = 'block';
    singlePostContainer.innerHTML = `<div class="loader"></div>`;
    threadsContainer.innerHTML = '';

    db.collection('posts').doc(postId).get().then(doc => {
        if (doc.exists) {
            renderSinglePost(doc);
            fetchAndRenderThreads(postId);
        } else {
            console.error("No such post found!");
            showFeedView();
        }
    });
}

backToForumBtn.addEventListener('click', showFeedView);

// --- CORE APP & UPLOAD LOGIC ---
logoutBtn.addEventListener('click', () => auth.signOut());

mediaUploadInput.addEventListener('change', (e) => {
    fileToUpload = e.target.files[0];
    if (fileToUpload) console.log(`File selected: ${fileToUpload.name}`);
});

postSubmitBtn.addEventListener('click', () => {
    const questionText = postTextarea.value.trim();
    if (!questionText && !fileToUpload) {
        alert("Please write something or select a file to post.");
        return;
    }
    if (fileToUpload) {
        uploadFileAndCreatePost(questionText, fileToUpload);
    } else {
        createPost(questionText, null, null);
    }
});

function uploadFileAndCreatePost(text, file) {
    postSubmitBtn.disabled = true;
    progressContainer.style.display = 'block';
    const uniqueFileName = `${Date.now()}_${file.name}`;
    const storageRef = storage.ref(`posts/${uniqueFileName}`);
    const uploadTask = storageRef.put(file);

    uploadTask.on('state_changed', 
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            uploadProgress.style.width = progress + '%';
        }, 
        (error) => {
            console.error("Upload failed:", error);
            alert("File upload failed. Please try again.");
            resetPostCreator();
        }, 
        () => {
            uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                createPost(text, downloadURL, file.type);
            });
        }
    );
}

function createPost(text, mediaUrl, mediaType) {
    db.collection('posts').add({
        authorId: auth.currentUser.uid,
        authorAnonymousName: generateAnonymousName(),
        questionText: text,
        mediaUrl: mediaUrl,
        mediaType: mediaType,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        upvotes: 0,
        answerCount: 0
    }).then(() => {
        resetPostCreator();
    }).catch(error => {
        console.error("Error creating post: ", error);
        resetPostCreator();
    });
}

function resetPostCreator() {
    postTextarea.value = '';
    mediaUploadInput.value = '';
    fileToUpload = null;
    progressContainer.style.display = 'none';
    uploadProgress.style.width = '0%';
    postSubmitBtn.disabled = false;
}

// --- SORTING LOGIC ---
sortNewestBtn.addEventListener('click', () => { /* ... same as before ... */ });
sortPopularBtn.addEventListener('click', () => { /* ... same as before ... */ });

// --- FETCHING & RENDERING (FEED VIEW) ---
function fetchPosts() {
    if (unsubscribePosts) unsubscribePosts();
    postsContainer.innerHTML = `<div class="loader"></div>`;
    unsubscribePosts = db.collection('posts')
        .orderBy(currentSortOrder.field, currentSortOrder.direction)
        .onSnapshot(snapshot => {
            if (snapshot.empty) {
                postsContainer.innerHTML = `<p style="text-align:center;">No questions yet. Be the first!</p>`;
                return;
            }
            postsContainer.innerHTML = '';
            snapshot.forEach(doc => renderPostCard(doc));
        });
}

function renderPostCard(doc) {
    const post = doc.data();
    const postId = doc.id;
    const postDate = post.createdAt ? post.createdAt.toDate().toLocaleDateString() : 'Just now';
    const postCard = document.createElement('div');
    postCard.className = 'post-card clickable';
    postCard.dataset.postId = postId;

    let mediaHTML = '';
    if (post.mediaUrl) {
        if (post.mediaType.startsWith('image/')) {
            mediaHTML = `<div class="post-media-container"><img src="${post.mediaUrl}" alt="Post image"></div>`;
        } else if (post.mediaType.startsWith('video/')) {
            mediaHTML = `<div class="post-media-container"><video controls src="${post.mediaUrl}"></video></div>`;
        }
    }
    postCard.innerHTML = `
        <div class="post-header">
            <strong class="post-author">${post.authorAnonymousName}</strong>
            <span class="post-date">${postDate}</span>
        </div>
        <p class="post-content">${post.questionText || ''}</p>
        ${mediaHTML}
        <div class="post-footer">
            <div class="post-footer-item upvote-btn" data-id="${postId}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                <span>${post.upvotes || 0}</span>
            </div>
            <div class="post-footer-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                <span>${post.answerCount || 0} Threads</span>
            </div>
        </div>
    `;
    postsContainer.appendChild(postCard);
}

// --- FETCHING & RENDERING (POST-DETAIL VIEW) ---
function renderSinglePost(doc) {
    const post = doc.data();
    const postId = doc.id;
    const postDate = post.createdAt ? post.createdAt.toLocaleString() : 'Just now';
    let mediaHTML = '';
    if (post.mediaUrl) {
        if (post.mediaType.startsWith('image/')) {
            mediaHTML = `<div class="post-media-container"><img src="${post.mediaUrl}" alt="Post image"></div>`;
        } else if (post.mediaType.startsWith('video/')) {
            mediaHTML = `<div class="post-media-container"><video controls src="${post.mediaUrl}"></video></div>`;
        }
    }
    singlePostContainer.innerHTML = `
        <div class="post-card">
            <div class="post-header">
                <strong class="post-author">${post.authorAnonymousName}</strong>
                <span class="post-date">${postDate}</span>
            </div>
            <p class="post-content">${post.questionText || ''}</p>
            ${mediaHTML}
            <div class="post-footer">
                <div class="post-footer-item upvote-btn" data-id="${postId}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                    <span>${post.upvotes || 0}</span>
                </div>
            </div>
        </div>
        <div class="thread-form post-creator">
            <h3>Add to the Thread</h3>
            <textarea id="thread-textarea" placeholder="Contribute your thoughts..."></textarea>
            <button id="thread-submit-btn" data-post-id="${postId}">Add Reply</button>
        </div>
    `;
}

function fetchAndRenderThreads(postId) {
    // If we are already listening to another post's threads, stop that first.
    if (unsubscribeThreads) unsubscribeThreads();
    
    // Set up a real-time listener on the 'answers' subcollection for the given post
    unsubscribeThreads = db.collection('posts').doc(postId).collection('answers').orderBy('createdAt', 'asc')
        .onSnapshot(snapshot => {
            threadsContainer.innerHTML = ''; // Clear any old threads
            snapshot.forEach(doc => {
                const thread = doc.data();
                const threadCard = document.createElement('div');
                threadCard.className = 'thread-card';
                threadCard.innerHTML = `
                    <p><strong>${thread.authorAnonymousName}</strong> replied:</p>
                    <p>${thread.answerText}</p>`;
                threadsContainer.appendChild(threadCard);
            });
        });
}