// forum.js

import { auth, db } from './firebase-config.js';

// --- DOM ELEMENT REFERENCES for the NEW design ---
const logoutBtn = document.querySelector('.logout-btn');
const postTextarea = document.querySelector('.post-textarea');
const postSubmitBtn = document.querySelector('.submit-btn');
const postsFeed = document.querySelector('.posts-feed');
const leftSidebar = document.querySelector('.sidebar');
const floatingActionBtn = document.querySelector('.floating-action');
const loadingIndicator = document.querySelector('.loading');

// --- STATE MANAGEMENT ---
let currentUserId = null;
// The default sort order is 'Newest'
let currentSortOrder = { field: 'createdAt', direction: 'desc' };
let unsubscribePosts = null; // To manage our real-time listener

// --- AUTHENTICATION CHECK ---
auth.onAuthStateChanged(user => {
    if (user) {
        currentUserId = user.uid;
        fetchPosts(); // Initial fetch of posts
    } else {
        // If no user is logged in, redirect to the login page.
        window.location.href = 'index.html'; // Make sure your login page is named index.html
    }
});

// --- ANONYMOUS NAME & AVATAR GENERATOR ---
const adjectives = ["Clever", "Wise", "Brave", "Silent", "Creative", "Humble", "Curious", "Fearless"];
const nouns = ["Falcon", "Panda", "Coyote", "Sparrow", "Chameleon", "Jaguar", "Lion", "Wolf", "Eagle"];
const avatars = ["👤", "🎭", "🤓", "🌟", "💡", "🚀", "🎓", "🦉", "🧠"];

function generateAnonymousData() {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const avatar = avatars[Math.floor(Math.random() * avatars.length)];
    return {
        name: `${adj} ${noun}`,
        avatar: avatar
    };
}

// --- TIME FORMATTING HELPER ---
function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
}

// --- CORE LOGIC: FETCHING & RENDERING POSTS ---
function fetchPosts() {
    if (unsubscribePosts) unsubscribePosts(); // Detach old listener to prevent memory leaks

    loadingIndicator.style.display = 'flex'; // Show the spinner
    // Remove placeholder/example posts before loading real ones
    postsFeed.querySelectorAll('.post-card').forEach(card => card.remove());

    unsubscribePosts = db.collection('posts')
        .orderBy(currentSortOrder.field, currentSortOrder.direction)
        .onSnapshot(snapshot => {
            loadingIndicator.style.display = 'none'; // Hide spinner
            postsFeed.innerHTML = ''; // Clear feed before rendering new data
            if (snapshot.empty) {
                postsFeed.innerHTML = `<p style="text-align: center; color: var(--text-secondary);">No posts yet. Be the first to share!</p>`;
                return;
            }
            snapshot.forEach(doc => {
                renderPost(doc.id, doc.data());
            });
        }, error => {
            console.error("Error fetching posts: ", error);
            loadingIndicator.style.display = 'none';
            postsFeed.innerHTML = `<p style="text-align: center; color: var(--warning);">Could not load posts. Please check your connection and security rules.</p>`;
        });
}

function renderPost(postId, postData) {
    const postArticle = document.createElement('article');
    postArticle.className = 'post-card fade-in';
    
    // Check if the post belongs to the current user and add a special class
    if (postData.authorId === currentUserId) {
        postArticle.classList.add('user-post');
    }

    const postDate = postData.createdAt ? timeAgo(postData.createdAt.toDate()) : '...';

    // The entire post card is now dynamically created from Firestore data
    postArticle.innerHTML = `
        <div class="post-header">
            <div class="user-avatar">${postData.authorAvatar}</div>
            <div class="post-meta">
                <div class="post-author">${postData.authorName}</div>
                <div class="post-time">${postDate}</div>
            </div>
        </div>
        <div class="post-content">
            ${postData.textContent}
        </div>
        <div class="post-footer">
            <button class="action-btn">
                <span>❤️</span>
                <span>${postData.likes || 0}</span>
            </button>
            <button class="action-btn">
                <span>💬</span>
                <span>${postData.comments || 0}</span>
            </button>
            <button class="action-btn">
                <span>🔄</span>
                <span>${postData.shares || 0}</span>
            </button>
            <button class="action-btn">
                <span>🔖</span>
            </button>
        </div>
    `;
    postsFeed.appendChild(postArticle);
}

// --- EVENT LISTENERS ---

// Logout button
logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

// Create a new post
postSubmitBtn.addEventListener('click', () => {
    const textContent = postTextarea.value.trim();
    if (!textContent) {
        alert("Please write something to post.");
        return;
    }

    const anonymousData = generateAnonymousData();

    // Add the new post to the 'posts' collection in Firestore
    db.collection('posts').add({
        authorId: currentUserId,
        authorName: anonymousData.name,
        authorAvatar: anonymousData.avatar,
        textContent: textContent,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        likes: 0,
        comments: 0,
        shares: 0
    }).then(() => {
        postTextarea.value = ''; // Clear the input field after posting
    }).catch(error => {
        console.error("Error creating post: ", error);
        alert("Could not create post. Please try again.");
    });
});

// Sidebar Sorting and Filtering
leftSidebar.addEventListener('click', (e) => {
    if (e.target.matches('.filter-option')) {
        // Deactivate all buttons in the same group first
        const group = e.target.closest('.filter-group');
        group.querySelectorAll('.filter-option').forEach(btn => btn.classList.remove('active'));
        
        // Activate the clicked button
        e.target.classList.add('active');

        // This is a placeholder to show the UI is interactive.
        // A full implementation would require changing the Firestore query and re-fetching.
        alert(`Filtering by: ${e.target.textContent.trim()}`);
    }
});

// Floating action button to scroll to top and focus the post creator
floatingActionBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    postTextarea.focus();
});