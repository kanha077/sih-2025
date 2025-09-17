// --- EVENT DELEGATION for dynamic content ---
document.body.addEventListener('click', e => {
    // Action 1: User clicks on a post card in the feed
    const postCard = e.target.closest('.post-card.clickable');
    if (postCard) {
        // Important: If the click was on the upvote button inside the card, do nothing here.
        // Let the next 'if' block handle it.
        if (e.target.closest('.upvote-btn')) return;
        
        // Otherwise, show the detail view for that post
        showPostDetailView(postCard.dataset.postId);
        return;
    }

    // Action 2: User clicks an upvote button (works in both feed and detail views)
    const upvoteBtn = e.target.closest('.upvote-btn');
    if (upvoteBtn) {
        const postId = upvoteBtn.dataset.id;
        db.collection('posts').doc(postId).update({ upvotes: firebase.firestore.FieldValue.increment(1) });
        return;
    }

    // Action 3: User clicks the "Add Reply" button in the detail view
    if (e.target.id === 'thread-submit-btn') {
        const postId = e.target.dataset.postId;
        const threadTextarea = document.getElementById('thread-textarea');
        const threadText = threadTextarea.value.trim();
        
        if (!threadText) return; // Don't submit empty replies

        // Add the new reply to the 'answers' subcollection
        db.collection('posts').doc(postId).collection('answers').add({
            authorId: auth.currentUser.uid,
            authorAnonymousName: generateAnonymousName(),
            answerText: threadText,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            threadTextarea.value = ''; // Clear the textarea
            // Also, increment the main post's answer count
            db.collection('posts').doc(postId).update({ answerCount: firebase.firestore.FieldValue.increment(1) });
        });
    }
});