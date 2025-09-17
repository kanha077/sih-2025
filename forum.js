import { auth, db } from './firebase-config.js';

// --- DOM REFERENCES ---
const welcomeModal = document.getElementById('welcome-modal');
const modalSkipBtn = document.getElementById('modal-skip-btn');
const modalPostBtn = document.getElementById('modal-post-btn');
const logoutBtn = document.getElementById('logout-btn');
const postTextarea = document.getElementById('post-textarea');
const postSubmitBtn = document.getElementById('post-submit-btn');
const postsContainer = document.getElementById('posts-container');
const sortNewestBtn = document.getElementById('sort-newest');
const sortPopularBtn = document.getElementById('sort-popular');

let currentSortOrder = { field: 'createdAt', direction: 'desc' };
let unsubscribePosts = null; // To store our real-time listener

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
        welcomeModal.classList.add('visible'); // Show welcome popup
    } else {
        window.location.href = 'index.html';
    }
});

// --- MODAL/POPUP LOGIC ---
modalSkipBtn.addEventListener('click', () => {
    welcomeModal.classList.remove('visible');
    fetchPosts(); // Load posts after skipping
});

modalPostBtn.addEventListener('click', () => {
    welcomeModal.classList.remove('visible');
    postTextarea.focus(); // Focus on the post creator
    fetchPosts(); // Also load posts
});

// --- CORE APP LOGIC ---
logoutBtn.addEventListener('click', () => auth.signOut());

postSubmitBtn.addEventListener('click', () => {
    const questionText = postTextarea.value.trim();
    if (!questionText) return;

    db.collection('posts').add({
        authorId: auth.currentUser.uid,
        authorAnonymousName: generateAnonymousName(),
        questionText: questionText,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        upvotes: 0,
        answerCount: 0
    }).then(() => {
        postTextarea.value = '';
    }).catch(error => console.error("Error adding post: ", error));
});

// --- SORTING LOGIC ---
sortNewestBtn.addEventListener('click', () => {
    currentSortOrder = { field: 'createdAt', direction: 'desc' };
    sortNewestBtn.classList.add('active');
    sortPopularBtn.classList.remove('active');
    fetchPosts();
});

sortPopularBtn.addEventListener('click', () => {
    currentSortOrder = { field: 'upvotes', direction: 'desc' };
    sortPopularBtn.classList.add('active');
    sortNewestBtn.classList.remove('active');
    fetchPosts();
});

// --- FETCHING & RENDERING ---
function fetchPosts() {
    // If a listener is already active, detach it before creating a new one
    if (unsubscribePosts) {
        unsubscribePosts();
    }
    postsContainer.innerHTML = `<div class="loader"></div>`;

    unsubscribePosts = db.collection('posts')
        .orderBy(currentSortOrder.field, currentSortOrder.direction)
        .onSnapshot(snapshot => {
            if (snapshot.empty) {
                postsContainer.innerHTML = `<p style="text-align: center; color: var(--text-secondary);">No questions have been asked yet. Be the first!</p>`;
                return;
            }
            postsContainer.innerHTML = '';
            snapshot.forEach(doc => renderPost(doc));
        });
}

function renderPost(doc) {
    const post = doc.data();
    const postId = doc.id;
    const postDate = post.createdAt ? post.createdAt.toDate().toLocaleDateString() : 'Just now';

    const postCard = document.createElement('div');
    postCard.className = 'post-card';
    postCard.innerHTML = `
        <div class="post-header">
            <strong class="post-author">${post.authorAnonymousName}</strong>
            <span class="post-date">${postDate}</span>
        </div>
        <p class="post-content">${post.questionText}</p>
        <div class="post-footer">
            <div class="upvote-btn" data-post-id="${postId}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                <span>${post.upvotes || 0}</span>
            </div>
            <div class="answers-count">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                <span>${post.answerCount || 0} Answers</span>
            </div>
        </div>
        <div class="answers-section">
            <div class="answers-list" id="answers-${postId}"></div>
            <div class="answer-form">
                <textarea class="answer-textarea" placeholder="Contribute your thoughts..."></textarea>
                <button class="submit-answer-btn" data-post-id="${postId}">Answer</button>
            </div>
        </div>
    `;
    postsContainer.appendChild(postCard);
    fetchAndRenderAnswers(postId);
}

function fetchAndRenderAnswers(postId) {
    const answersContainer = document.getElementById(`answers-${postId}`);
    db.collection('posts').doc(postId).collection('answers').orderBy('createdAt', 'asc').onSnapshot(snapshot => {
        answersContainer.innerHTML = '';
        snapshot.forEach(doc => {
            const answer = doc.data();
            const answerCard = document.createElement('div');
            answerCard.className = 'answer-card';
            answerCard.innerHTML = `<p><strong>${answer.authorAnonymousName}</strong> replied:</p><p>${answer.answerText}</p>`;
            answersContainer.appendChild(answerCard);
        });
    });
}

// --- EVENT DELEGATION for dynamic buttons (answers & upvotes) ---
postsContainer.addEventListener('click', e => {
    // Answer submission
    if (e.target.classList.contains('submit-answer-btn')) {
        const postId = e.target.dataset.postId;
        const answerTextarea = e.target.previousElementSibling;
        const answerText = answerTextarea.value.trim();
        if (!answerText) return;

        db.collection('posts').doc(postId).collection('answers').add({
            authorId: auth.currentUser.uid,
            authorAnonymousName: generateAnonymousName(),
            answerText: answerText,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            answerTextarea.value = '';
            // Update answer count on the post
            const postRef = db.collection('posts').doc(postId);
            postRef.update({ answerCount: firebase.firestore.FieldValue.increment(1) });
        });
    }

    // Upvote submission
    if (e.target.closest('.upvote-btn')) {
        const upvoteBtn = e.target.closest('.upvote-btn');
        const postId = upvoteBtn.dataset.postId;
        const postRef = db.collection('posts').doc(postId);
        postRef.update({ upvotes: firebase.firestore.FieldValue.increment(1) });
    }
});