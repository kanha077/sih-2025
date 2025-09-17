// forum.js

import { auth, db } from './firebase-config.js';

let currentUsername = null;

// --- DOM ELEMENT REFERENCES ---
const logoutBtn = document.getElementById('logout-btn');
const postTextarea = document.getElementById('post-textarea');
const postSubmitBtn = document.getElementById('post-submit-btn');
const postsContainer = document.getElementById('posts-container');

// --- AUTHENTICATION CHECK ---
// Use onAuthStateChanged to listen for login/logout events
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in.
        // We get the username from the dummy email we created (e.g., "john@studentforum.com")
        currentUsername = user.email.split('@')[0];
        console.log(`User logged in: ${currentUsername}`);
        fetchPosts(); // Load the forum posts
    } else {
        // User is signed out.
        console.log("No user is logged in. Redirecting to login page.");
        // Redirect to the login page if not authenticated
        window.location.href = 'index.html';
    }
});

// --- EVENT LISTENERS ---

// Logout Button
logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
        console.log("User signed out successfully.");
    }).catch(error => {
        console.error("Sign out error:", error);
    });
});

// Post a new Question
postSubmitBtn.addEventListener('click', () => {
    const questionText = postTextarea.value.trim();
    if (questionText === '') {
        alert("Please write a question before posting.");
        return;
    }

    // Add a new post to the 'posts' collection in Firestore
    db.collection('posts').add({
        authorUsername: currentUsername,
        authorId: auth.currentUser.uid,
        questionText: questionText,
        createdAt: firebase.firestore.FieldValue.serverTimestamp() // Use server time
    }).then(() => {
        console.log("Post added successfully!");
        postTextarea.value = ''; // Clear the textarea
    }).catch(error => {
        console.error("Error adding post: ", error);
    });
});

// --- CORE FUNCTIONS ---

// Fetch all posts in real-time
function fetchPosts() {
    // Use onSnapshot for a real-time listener
    db.collection('posts').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
        postsContainer.innerHTML = ''; // Clear existing posts
        snapshot.forEach(doc => {
            const post = doc.data();
            const postId = doc.id;
            renderPost(post, postId);
        });
    });
}

// Render a single post card to the page
function renderPost(post, postId) {
    const postDate = post.createdAt ? post.createdAt.toDate().toLocaleString() : 'Just now';

    const postDiv = document.createElement('div');
    postDiv.className = 'post-card';
    postDiv.innerHTML = `
        <div class="post-header">
            <span class="post-author">${post.authorUsername}</span>
            <span class="post-date">${postDate}</span>
        </div>
        <p class="post-content">${post.questionText}</p>
        <div class="answers-section">
            <div class="answers-list" id="answers-${postId}"></div>
            <div class="answer-form">
                <textarea class="answer-textarea" placeholder="Write an answer..."></textarea>
                <button class="submit-answer-btn" data-post-id="${postId}">Submit Answer</button>
            </div>
        </div>
    `;
    postsContainer.appendChild(postDiv);

    // Now, fetch and render the answers for this specific post
    fetchAndRenderAnswers(postId);
}

// Fetch and render answers for a specific post (using a subcollection)
function fetchAndRenderAnswers(postId) {
    const answersContainer = document.getElementById(`answers-${postId}`);
    
    db.collection('posts').doc(postId).collection('answers').orderBy('createdAt', 'asc').onSnapshot(snapshot => {
        answersContainer.innerHTML = ''; // Clear existing answers
        snapshot.forEach(doc => {
            const answer = doc.data();
            const answerDate = answer.createdAt ? answer.createdAt.toDate().toLocaleString() : 'Just now';
            
            const answerDiv = document.createElement('div');
            answerDiv.className = 'answer-card';
            answerDiv.innerHTML = `
                <div class="post-header">
                    <span class="post-author">${answer.authorUsername}</span>
                    <span class="post-date">${answerDate}</span>
                </div>
                <p>${answer.answerText}</p>
            `;
            answersContainer.appendChild(answerDiv);
        });
    });
}

// --- EVENT DELEGATION FOR ANSWER SUBMISSION ---
// Since answer buttons are created dynamically, we listen on the parent container
postsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('submit-answer-btn')) {
        const postId = e.target.dataset.postId;
        const answerTextarea = e.target.previousElementSibling;
        const answerText = answerTextarea.value.trim();

        if (answerText === '') {
            alert('Please write an answer before submitting.');
            return;
        }

        // Add the answer to the 'answers' subcollection of the specific post
        db.collection('posts').doc(postId).collection('answers').add({
            authorUsername: currentUsername,
            authorId: auth.currentUser.uid,
            answerText: answerText,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            console.log("Answer submitted successfully!");
            answerTextarea.value = ''; // Clear the textarea
        }).catch(error => {
            console.error("Error submitting answer: ", error);
        });
    }
});