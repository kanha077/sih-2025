// forum.js

// IMPORTANT: Your existing firebase-config.js is still needed for the database!
import { auth, db } from './firebase-config.js';

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
const myPostsBtn = document.querySelector('[data-filter="my-posts"]');
const allPostsBtn = document.querySelector('[data-filter="all"]');
const createPollBtn = document.getElementById('create-poll-btn');
const pollCreatorContainer = document.getElementById('poll-creator-container');
const pollOptionsInputs = document.getElementById('poll-options-inputs');
const addPollOptionBtn = document.getElementById('add-poll-option-btn');

// --- STATE MANAGEMENT ---
let currentUserId = null;
let currentSortOrder = { field: 'createdAt', direction: 'desc' };
let currentAuthorFilter = null; 
let unsubscribePosts = null;
let unsubscribeThreads = null;
let fileToUpload = null;
let isPollActive = false;

// --- ANONYMOUS NAME & AVATAR GENERATOR ---
const adjectives = ["Clever", "Wise", "Brave", "Silent", "Creative", "Humble", "Curious", "Fearless"];
const nouns = ["Falcon", "Panda", "Coyote", "Sparrow", "Chameleon", "Jaguar", "Lion", "Wolf", "Eagle"];
const avatars = ["👤", "🎭", "🤓", "🌟", "💡", "🚀", "🎓", "🦉", "🧠"];
function generateAnonymousData() { return { name: `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`, avatar: avatars[Math.floor(Math.random() * avatars.length)] }; }
function timeAgo(date) { const seconds = Math.floor((new Date() - date) / 1000); let interval = seconds / 31536000; if (interval > 1) return Math.floor(interval) + " years ago"; interval = seconds / 86400; if (interval > 1) return Math.floor(interval) + " days ago"; interval = seconds / 3600; if (interval > 1) return Math.floor(interval) + " hours ago"; interval = seconds / 60; if (interval > 1) return Math.floor(interval) + " minutes ago"; return "Just now"; }

// --- AUTHENTICATION & INITIALIZATION ---
auth.onAuthStateChanged(user => {
    if (user) {
        currentUserId = user.uid;
        fetchPosts();
    } else {
        window.location.href = 'index.html';
    }
});

// --- VIEW MANAGEMENT ---
function showFeedView() { postDetailView.style.display = 'none'; feedView.style.display = 'block'; if (unsubscribeThreads) unsubscribeThreads(); }
function showPostDetailView(postId) { feedView.style.display = 'none'; postDetailView.style.display = 'block'; singlePostContainer.innerHTML = `<div class="loader"></div>`; threadsContainer.innerHTML = ''; db.collection('posts').doc(postId).get().then(doc => { if (doc.exists) { renderSinglePost(doc); fetchAndRenderThreads(postId); } else { console.error("No such post found!"); showFeedView(); } }); }
backToForumBtn.addEventListener('click', showFeedView);

// --- CORE APP & UPLOAD LOGIC ---
logoutBtn.addEventListener('click', () => auth.signOut());
mediaUploadInput.addEventListener('change', (e) => { fileToUpload = e.target.files[0]; if (fileToUpload) console.log(`File selected: ${fileToUpload.name}`); });
createPollBtn.addEventListener('click', () => { isPollActive = !isPollActive; pollCreatorContainer.style.display = isPollActive ? 'block' : 'none'; createPollBtn.classList.toggle('active', isPollActive); });
addPollOptionBtn.addEventListener('click', () => { const optionInputs = pollOptionsInputs.querySelectorAll('.poll-option-input'); if (optionInputs.length < 5) { const newOption = document.createElement('input'); newOption.type = 'text'; newOption.className = 'poll-option-input'; newOption.placeholder = `Poll Option ${optionInputs.length + 1}`; newOption.maxLength = 80; pollOptionsInputs.appendChild(newOption); } else { alert("You can add a maximum of 5 poll options."); } });

postSubmitBtn.addEventListener('click', () => {
    const questionText = postTextarea.value.trim();
    let pollData = null;
    if (isPollActive) {
        const pollOptions = Array.from(pollOptionsInputs.querySelectorAll('.poll-option-input')).map(input => input.value.trim()).filter(text => text !== '');
        if (pollOptions.length < 2) { alert("Please provide at least two options for the poll."); return; }
        pollData = { options: pollOptions.map(text => ({ text: text, votes: 0 })), totalVotes: 0, voters: {} };
    }
    if (!questionText && !fileToUpload) { alert("Please write something or select a file to post."); return; }
    if (fileToUpload) {
        uploadFileAndCreatePost(questionText, fileToUpload, pollData);
    } else {
        createPost(questionText, null, null, pollData);
    }
});

function uploadFileAndCreatePost(text, file, pollData) {
    // !!! IMPORTANT: Replace these with your actual Cloudinary details !!!
    const CLOUDINARY_CLOUD_NAME = "dcukf2sdm"; // Find in your Cloudinary dashboard
    const CLOUDINARY_UPLOAD_PRESET = "ANANDA"; // The unsigned preset you created

    postSubmitBtn.disabled = true;
    progressContainer.style.display = 'block';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;
    const xhr = new XMLHttpRequest();
    xhr.open('POST', cloudinaryUrl, true);
    xhr.upload.onprogress = function(e) { if (e.lengthComputable) { const progress = (e.loaded / e.total) * 100; uploadProgress.style.width = progress + '%'; } };
    xhr.onload = function() { if (xhr.status === 200) { const response = JSON.parse(xhr.responseText); createPost(text, response.secure_url, response.resource_type, pollData); } else { console.error("Cloudinary upload failed:", xhr.responseText); alert("File upload failed."); resetPostCreator(); } };
    xhr.onerror = function() { console.error("Network error during upload."); alert("File upload failed."); resetPostCreator(); };
    xhr.send(formData);
}

function createPost(text, mediaUrl, mediaType, pollData) {
    const anonymousData = generateAnonymousData();
    const postObject = { authorId: auth.currentUser.uid, authorAnonymousName: anonymousData.name, authorAvatar: anonymousData.avatar, questionText: text, mediaUrl: mediaUrl, mediaType: mediaType, createdAt: firebase.firestore.FieldValue.serverTimestamp(), upvotes: 0, answerCount: 0 };
    if (pollData) { postObject.poll = pollData; }
    db.collection('posts').add(postObject).then(() => { resetPostCreator(); }).catch(error => { console.error("Error creating post: ", error); resetPostCreator(); });
}

function resetPostCreator() { postTextarea.value = ''; mediaUploadInput.value = ''; fileToUpload = null; progressContainer.style.display = 'none'; uploadProgress.style.width = '0%'; postSubmitBtn.disabled = false; isPollActive = false; pollCreatorContainer.style.display = 'none'; createPollBtn.classList.remove('active'); pollOptionsInputs.innerHTML = '<input type="text" class="poll-option-input" placeholder="Poll Option 1" maxlength="80"><input type="text" class="poll-option-input" placeholder="Poll Option 2" maxlength="80">'; }

// --- SORTING & FILTERING ---
sortNewestBtn.addEventListener('click', () => { currentSortOrder = { field: 'createdAt', direction: 'desc' }; fetchPosts(); });
sortPopularBtn.addEventListener('click', () => { currentSortOrder = { field: 'upvotes', direction: 'desc' }; fetchPosts(); });
allPostsBtn.addEventListener('click', () => { currentAuthorFilter = null; fetchPosts(); });
myPostsBtn.addEventListener('click', () => { if (currentUserId) { currentAuthorFilter = currentUserId; fetchPosts(); } });

// --- FETCHING & RENDERING (FEED VIEW) ---
function fetchPosts() {
    if (unsubscribePosts) unsubscribePosts();
    postsContainer.innerHTML = `<div class="loader"></div>`;
    let query = db.collection('posts');
    if (currentAuthorFilter) { query = query.where('authorId', '==', currentAuthorFilter); }
    query = query.orderBy(currentSortOrder.field, currentSortOrder.direction);
    unsubscribePosts = query.onSnapshot(snapshot => {
        if (snapshot.empty) { postsContainer.innerHTML = `<p style="text-align:center; color: var(--muted-foreground);">No posts found.</p>`; return; }
        postsContainer.innerHTML = '';
        snapshot.forEach(doc => renderPostCard(doc));
    }, error => { console.error("Error fetching posts:", error); postsContainer.innerHTML = `<p style="text-align:center; color: red;">Error loading posts.</p>`; });
}

function renderPostCard(doc) {
    const post = doc.data();
    const postId = doc.id;
    const postDate = post.createdAt ? timeAgo(post.createdAt.toDate()) : 'Just now';
    const postCard = document.createElement('div');
    const isUserPost = post.authorId === currentUserId;
    postCard.className = `post-card clickable ${isUserPost ? 'user-post' : ''}`;
    postCard.dataset.postId = postId;
    let mediaHTML = '';
    if (post.mediaUrl) { if (post.mediaType === 'image') { mediaHTML = `<div class="post-media"><img src="${post.mediaUrl}" alt="Post image"></div>`; } else if (post.mediaType === 'video') { mediaHTML = `<div class="post-media"><video controls src="${post.mediaUrl}"></video></div>`; } }
    let pollHTML = '';
    if (post.poll) { const userVote = post.poll.voters ? post.poll.voters[currentUserId] : null; const optionsHTML = post.poll.options.map(option => { const percentage = post.poll.totalVotes > 0 ? (option.votes / post.poll.totalVotes) * 100 : 0; const isVoted = userVote === option.text; return `<div class="poll-option ${isVoted ? 'voted' : ''}" data-post-id="${postId}" data-option-text="${option.text}"><div class="poll-option-fill" style="width: ${percentage}%;"></div><div class="poll-option-info"><span class="poll-option-text">${option.text}</span><span class="poll-option-percent">${Math.round(percentage)}%</span></div></div>`; }).join(''); pollHTML = `<div class="poll-container">${optionsHTML}</div>`; }
    const authorDisplayName = isUserPost ? 'You (Anonymous)' : post.authorAnonymousName;
    const deleteBtnHTML = isUserPost ? `<button class="delete-post-btn" title="Delete Post" data-post-id="${postId}">×</button>` : '';

    postCard.innerHTML = `
        ${deleteBtnHTML}
        <div class="post-header">
            <div class="user-avatar">${post.authorAvatar || '👤'}</div>
            <div class="post-meta">
                <div class="post-author">${authorDisplayName}</div>
                <div class="post-time">${postDate}</div>
            </div>
        </div>
        <p class="post-content">${post.questionText || ''}</p>
        ${mediaHTML}
        ${pollHTML}
        <div class="post-footer">
            <div class="action-btn upvote-btn" data-id="${postId}">
                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2"/></svg>
                <span>${post.upvotes || 0}</span>
            </div>
            <div class="action-btn">
                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" fill="none" stroke="currentColor" stroke-width="2"/></svg>
                <span>${post.answerCount || 0} Comments</span>
            </div>
        </div>
    `;
    postsContainer.appendChild(postCard);
}

// --- FETCHING & RENDERING (POST-DETAIL VIEW) ---
function renderSinglePost(doc) {
    const post = doc.data(); const postId = doc.id; const postDate = post.createdAt ? post.createdAt.toDate().toLocaleString() : 'Just now'; let mediaHTML = ''; if (post.mediaUrl) { if (post.mediaType === 'image') { mediaHTML = `<div class="post-media-container"><img src="${post.mediaUrl}" alt="Post image"></div>`; } else if (post.mediaType === 'video') { mediaHTML = `<div class="post-media-container"><video controls src="${post.mediaUrl}"></video></div>`; } } const isUserPost = post.authorId === currentUserId; const authorDisplayName = isUserPost ? 'You (Anonymous)' : post.authorAnonymousName;
    const deleteBtnHTML = isUserPost ? `<button class="delete-post-btn" title="Delete Post" data-post-id="${postId}">×</button>` : '';
    singlePostContainer.innerHTML = `
        <div class="post-card ${isUserPost ? 'user-post' : ''}">
            ${deleteBtnHTML}
            <div class="post-header">
                <div class="user-avatar">${post.authorAvatar || '👤'}</div>
                <div class="post-meta">
                    <div class="post-author">${authorDisplayName}</div>
                    <div class="post-time">${postDate}</div>
                </div>
            </div>
            <p class="post-content">${post.questionText || ''}</p>
            ${mediaHTML}
            <div class="post-footer">
                <div class="action-btn upvote-btn" data-id="${postId}">
                    <svg width="20" height="20" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2"/></svg>
                    <span>${post.upvotes || 0}</span>
                </div>
            </div>
        </div>
        <div class="thread-form post-creator">
            <h3>Add to the Thread</h3>
            <textarea id="thread-textarea" class="post-textarea" placeholder="Contribute your thoughts..."></textarea>
            <button id="thread-submit-btn" class="submit-btn" data-post-id="${postId}">Add Reply</button>
        </div>
    `;
}
function fetchAndRenderThreads(postId) { if (unsubscribeThreads) unsubscribeThreads(); unsubscribeThreads = db.collection('posts').doc(postId).collection('answers').orderBy('createdAt', 'asc').onSnapshot(snapshot => { threadsContainer.innerHTML = ''; snapshot.forEach(doc => { const thread = doc.data(); const threadCard = document.createElement('div'); threadCard.className = 'thread-card'; threadCard.innerHTML = `<p><strong>${thread.authorAnonymousName}</strong> replied:</p><p>${thread.answerText}</p>`; threadsContainer.appendChild(threadCard); }); }); }

// --- EVENT DELEGATION for dynamic content ---
document.body.addEventListener('click', e => {
    const postCard = e.target.closest('.post-card.clickable');
    if (postCard && !e.target.closest('.upvote-btn, .action-btn, .poll-option, .delete-post-btn')) { showPostDetailView(postCard.dataset.postId); return; }
    const upvoteBtn = e.target.closest('.upvote-btn');
    if (upvoteBtn) { const postId = upvoteBtn.dataset.id; db.collection('posts').doc(postId).update({ upvotes: firebase.firestore.FieldValue.increment(1) }); return; }
    const pollOption = e.target.closest('.poll-option');
    if (pollOption) { const postId = pollOption.dataset.postId; const optionText = pollOption.dataset.optionText; voteOnPoll(postId, optionText); return; }
    
    // --- NEW: Handle Post Deletion ---
    const deleteBtn = e.target.closest('.delete-post-btn');
    if (deleteBtn) {
        const postId = deleteBtn.dataset.postId;
        deletePost(postId);
        return;
    }
    
    if (e.target.id === 'thread-submit-btn') { const postId = e.target.dataset.postId; const threadTextarea = document.getElementById('thread-textarea'); const threadText = threadTextarea.value.trim(); if (!threadText) return; const anonymousData = generateAnonymousData(); db.collection('posts').doc(postId).collection('answers').add({ authorId: auth.currentUser.uid, authorAnonymousName: anonymousData.name, authorAvatar: anonymousData.avatar, answerText: threadText, createdAt: firebase.firestore.FieldValue.serverTimestamp() }).then(() => { threadTextarea.value = ''; db.collection('posts').doc(postId).update({ answerCount: firebase.firestore.FieldValue.increment(1) }); }); }
});

// --- VOTE ON POLL FUNCTION ---
function voteOnPoll(postId, optionText) {
    const postRef = db.collection('posts').doc(postId);
    db.runTransaction(async (transaction) => {
        const doc = await transaction.get(postRef);
        if (!doc.exists) { throw "Document does not exist!"; }
        const post = doc.data();
        if (post.poll.voters && post.poll.voters[currentUserId]) { alert("You have already voted on this poll."); return; }
        const newOptions = post.poll.options.map(option => {
            if (option.text === optionText) { return { ...option, votes: option.votes + 1 }; }
            return option;
        });
        const newTotalVotes = post.poll.totalVotes + 1;
        const voterField = `poll.voters.${currentUserId}`;
        transaction.update(postRef, { 'poll.options': newOptions, 'poll.totalVotes': newTotalVotes, [voterField]: optionText });
    }).catch(error => { console.error("Poll transaction failed: ", error); });
}

// --- NEW: DELETE POST FUNCTION ---
async function deletePost(postId) {
    // A confirmation dialog is highly recommended in a real application.
    // Using a simple browser confirm() for now.
    if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) {
        return;
    }

    console.log(`Attempting to delete post: ${postId}`);
    const postRef = db.collection('posts').doc(postId);

    try {
        // In a full application, a Cloud Function would be needed to delete 
        // associated media from Cloudinary and all sub-collections ('answers').
        // For this project, we will just delete the main post document.
        await postRef.delete();
        console.log("Post successfully deleted!");
        if (postDetailView.style.display === 'block') {
            showFeedView();
        }
    } catch (error) {
        console.error("Error deleting post: ", error);
        alert("There was an error deleting the post. Please check the console.");
    }
}

