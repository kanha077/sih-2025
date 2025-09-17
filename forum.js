// forum.js

import { auth, db, storage } from './firebase-config.js';

// --- DOM ELEMENT REFERENCES ---
const logoutBtn = document.querySelector('.logout-btn');
const postTextarea = document.querySelector('.post-textarea');
const postSubmitBtn = document.querySelector('.submit-btn');
const postsFeed = document.querySelector('.posts-feed');
const leftSidebar = document.querySelector('.sidebar');
const rightSidebar = document.querySelector('.right-sidebar');
const floatingActionBtn = document.querySelector('.floating-action');

// --- AUTHENTICATION CHECK ---
auth.onAuthStateChanged(user => {
    if (!user) {
        // If no user is logged in, redirect to the login page.
        window.location.href = 'index.html'; 
    }
});

// --- STATE MANAGEMENT ---
let currentUserId = null;
let currentSortOrder = { field: 'createdAt', direction: 'desc' };
let unsubscribePosts = null;

auth.onAuthStateChanged(user => {
    if (user) {
        currentUserId = user.uid;
        fetchPosts(); // Initial fetch
    } else {
        window.location.href = 'index.html';
    }
});

// --- ANONYMOUS NAME & AVATAR GENERATOR ---
const adjectives = ["Clever", "Wise", "Brave", "Silent", "Creative", "Humble"];
const nouns = ["Falcon", "Panda", "Coyote", "Sparrow", "Chameleon", "Jaguar"];
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

// --- TIME FORMATTING ---
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
    if (unsubscribePosts) unsubscribePosts(); // Detach old listener

    postsFeed.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;

    unsubscribePosts = db.collection('posts')
        .orderBy(currentSortOrder.field, currentSortOrder.direction)
        .onSnapshot(snapshot => {
            postsFeed.innerHTML = ''; // Clear feed
            if (snapshot.empty) {
                postsFeed.innerHTML = `<p style="text-align: center; color: var(--text-secondary);">No posts yet. Be the first to share!</p>`;
                return;
            }
            snapshot.forEach(doc => {
                renderPost(doc.id, doc.data());
            });
        });
}

function renderPost(postId, postData) {
    const postArticle = document.createElement('article');
    postArticle.className = 'post-card fade-in';
    
    // Check if the post belongs to the current user
    if (postData.authorId === currentUserId) {
        postArticle.classList.add('user-post');
    }

    const postDate = postData.createdAt ? timeAgo(postData.createdAt.toDate()) : '';

    postArticle.innerHTML = `
        <div class="post-header">
            <div class="user-avatar">${postData.authorAvatar}</div>
            <div class="post-meta">
                <div class="post-author">${postData.authorName}</div>
                <div class="post-time">${postDate}</div>
            </div>
        </div>
        <div class="post-content">${postData.textContent}</div>
        <div class="post-footer">
            <button class="action-btn">❤️ <span>${postData.likes || 0}</span></button>
            <button class="action-btn">💬 <span>${postData.comments || 0}</span></button>
            <button class="action-btn">🔄 <span>${postData.shares || 0}</span></button>
            <button class="action-btn">🔖</button>
        </div>
    `;
    postsFeed.appendChild(postArticle);
}

// --- EVENT LISTENERS ---

// Logout
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
        postTextarea.value = '';
    }).catch(error => {
        console.error("Error creating post: ", error);
    });
});

// Sidebar Sorting and Filtering
leftSidebar.addEventListener('click', (e) => {
    if (e.target.matches('.filter-option')) {
        // Deactivate all buttons in the same group
        const group = e.target.closest('.filter-group');
        group.querySelectorAll('.filter-option').forEach(btn => btn.classList.remove('active'));
        
        // Activate the clicked button
        e.target.classList.add('active');

        // Note: Full sorting/filtering logic would require more complex queries.
        // For now, this just updates the UI.
        alert(`Filtering by: ${e.target.textContent}`);
    }
});

// Floating action button to scroll to top/focus post creator
floatingActionBtn.addEventListener('click', () => {
    postTextarea.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});