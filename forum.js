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
const postsContainer = document.getElementById('posts-container');
const sortNewestBtn = document.getElementById('sort-newest');
const sortPopularBtn = document.getElementById('sort-popular');

let currentSortOrder = { field: 'createdAt', direction: 'desc' };
let unsubscribePosts = null; // To store our real-time listeners
let unsubscribeThreads = null;

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
        fetchPosts(); // Load the forum posts on page load
    } else {
        window.location.href = 'index.html'; // Or your login page file name
    }
});

// --- VIEW MANAGEMENT ---
function showFeedView() {
    postDetailView.style.display = 'none';
    feedView.style.display = 'block';
    if (unsubscribeThreads) unsubscribeThreads(); // Stop listening to specific threads
}

function showPostDetailView(postId) {
    feedView.style.display = 'none';
    postDetailView.style.display = 'block';
    singlePostContainer.innerHTML = `<div class="loader"></div>`;
    threadsContainer.innerHTML = '';

    // Fetch the single post data
    db.collection('posts').doc(postId).get().then(doc => {
        if (doc.exists) {
            renderSinglePost(doc);
            fetchAndRenderThreads(postId);
        } else {
            console.error("No such post found!");
            showFeedView(); // Go back if post doesn't exist
        }
    });
}

backToForumBtn.addEventListener('click', showFeedView);

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


// --- FETCHING & RENDERING (FEED VIEW) ---
function fetchPosts() {
    if (unsubscribePosts) unsubscribePosts();
    postsContainer.innerHTML = `<div class="loader"></div>`;

    unsubscribePosts = db.collection('posts')
        .orderBy(currentSortOrder.field, currentSortOrder.direction)
        .onSnapshot(snapshot => {
            if (snapshot.empty) {
                postsContainer.innerHTML = `<p style="text-align:center; color: var(--text-secondary);">No questions yet. Be the first!</p>`;
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
    postCard.dataset.postId = postId; // Store post ID for click event

    postCard.innerHTML = `
        <div class="post-header">
            <strong class="post-author">${post.authorAnonymousName}</strong>
            <span class="post-date">${postDate}</span>
        </div>
        <p class="post-content">${post.questionText}</p>
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
    const postDate = post.createdAt ? post.createdAt.toDate().toLocaleString() : 'Just now';
    
    singlePostContainer.innerHTML = `
        <div class="post-card">
            <div class="post-header">
                <strong class="post-author">${post.authorAnonymousName}</strong>
                <span class="post-date">${postDate}</span>
            </div>
            <p class="post-content">${post.questionText}</p>
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
    if (unsubscribeThreads) unsubscribeThreads();
    
    unsubscribeThreads = db.collection('posts').doc(postId).collection('answers').orderBy('createdAt', 'asc')
        .onSnapshot(snapshot => {
            threadsContainer.innerHTML = '';
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

// --- EVENT DELEGATION for dynamic content ---
document.body.addEventListener('click', e => {
    // Navigate to detail view
    const postCard = e.target.closest('.post-card.clickable');
    if (postCard) {
        // Check if the click was on the upvote button inside the card, if so, don't navigate
        if (e.target.closest('.upvote-btn')) return;
        showPostDetailView(postCard.dataset.postId);
        return;
    }

    // Handle upvoting (works in both views)
    const upvoteBtn = e.target.closest('.upvote-btn');
    if (upvoteBtn) {
        const postId = upvoteBtn.dataset.id;
        db.collection('posts').doc(postId).update({ upvotes: firebase.firestore.FieldValue.increment(1) });
        return;
    }

    // Handle thread/answer submission in detail view
    if (e.target.id === 'thread-submit-btn') {
        const postId = e.target.dataset.postId;
        const threadTextarea = document.getElementById('thread-textarea');
        const threadText = threadTextarea.value.trim();
        if (!threadText) return;

        db.collection('posts').doc(postId).collection('answers').add({
            authorId: auth.currentUser.uid,
            authorAnonymousName: generateAnonymousName(),
            answerText: threadText,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            threadTextarea.value = '';
            db.collection('posts').doc(postId).update({ answerCount: firebase.firestore.FieldValue.increment(1) });
        });
    }
});