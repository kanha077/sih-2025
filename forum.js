// forum.js

import { auth, db, storage } from './firebase-config.js';

// --- DOM REFERENCES (Add new ones) ---
const postTextarea = document.getElementById('post-textarea');
const postSubmitBtn = document.getElementById('post-submit-btn');
const mediaUploadInput = document.getElementById('media-upload');
const progressContainer = document.getElementById('progress-container');
const uploadProgress = document.getElementById('upload-progress');
// ... other DOM references are the same ...

let fileToUpload = null; // Variable to hold the selected file

// --- EVENT LISTENERS ---

// Listen for a file selection
mediaUploadInput.addEventListener('change', (e) => {
    fileToUpload = e.target.files[0];
    if (fileToUpload) {
        console.log(`File selected: ${fileToUpload.name}`);
    }
});

// Post button logic is now more complex
postSubmitBtn.addEventListener('click', () => {
    const questionText = postTextarea.value.trim();
    
    if (!questionText && !fileToUpload) {
        alert("Please write something or select a file to post.");
        return;
    }

    // If there is a file to upload, handle that first.
    if (fileToUpload) {
        uploadFileAndCreatePost(questionText, fileToUpload);
    } else {
        // If it's a text-only post, create it directly.
        createPost(questionText, null, null);
    }
});

// --- UPLOAD & POST CREATION LOGIC ---

function uploadFileAndCreatePost(text, file) {
    postSubmitBtn.disabled = true;
    progressContainer.style.display = 'block';

    const uniqueFileName = `${Date.now()}_${file.name}`;
    const storageRef = storage.ref(`posts/${uniqueFileName}`);
    const uploadTask = storageRef.put(file);

    // Listen for state changes, errors, and completion of the upload.
    uploadTask.on('state_changed', 
        (snapshot) => {
            // Observe state change events such as progress
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            uploadProgress.style.width = progress + '%';
        }, 
        (error) => {
            console.error("Upload failed:", error);
            alert("File upload failed. Please try again.");
            resetPostCreator();
        }, 
        () => {
            // Handle successful uploads on complete
            uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                console.log('File available at', downloadURL);
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
        mediaUrl: mediaUrl, // Can be null
        mediaType: mediaType, // Can be null
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
    mediaUploadInput.value = ''; // Clear the file input
    fileToUpload = null;
    progressContainer.style.display = 'none';
    uploadProgress.style.width = '0%';
    postSubmitBtn.disabled = false;
}

// --- RENDERING LOGIC (UPDATE) ---

// In both renderPostCard and renderSinglePost, find where you declare the innerHTML
// and add the media container.

function renderPostCard(doc) {
    const post = doc.data();
    // ...
    // Create and append the media element if it exists
    let mediaHTML = '';
    if (post.mediaUrl) {
        if (post.mediaType.startsWith('image/')) {
            mediaHTML = `<div class="post-media-container"><img src="${post.mediaUrl}" alt="Post image"></div>`;
        } else if (post.mediaType.startsWith('video/')) {
            mediaHTML = `<div class="post-media-container"><video controls src="${post.mediaUrl}"></video></div>`;
        }
    }

    // Inside the postCard.innerHTML template string, add the mediaHTML
    postCard.innerHTML = `
        <p class="post-content">${post.questionText}</p>
        ${mediaHTML} `;
    // ...
}

// Do the same for renderSinglePost
function renderSinglePost(doc) {
    // ...
    let mediaHTML = '';
    if (doc.data().mediaUrl) {
        // ... same logic as above ...
    }

    singlePostContainer.innerHTML = `
        <p class="post-content">${doc.data().questionText}</p>
        ${mediaHTML} `;
    // ...
}

// ... all other functions (fetchPosts, sorting, auth check, etc.) remain the same ...
// Helper function for name generator
function generateAnonymousName() {
    const adjectives = ["Clever", "Curious", "Brave", "Wise", "Silent", "Scholarly", "Creative", "Fearless", "Humble"];
    const nouns = ["Falcon", "Panda", "Coyote", "Sparrow", "Chameleon", "Jaguar", "Lion", "Wolf", "Eagle"];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj} ${noun}`;
}