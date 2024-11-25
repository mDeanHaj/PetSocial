const { executeSQL } = require('../../helpers/dbHelpers');

// Fetch all blog posts
async function getPostsFromDatabase() {
    const sql = `SELECT p.post_id, p.title, p.content, p.created_at, p.flagged, u.username, p.user_id
                 FROM posts p
                 JOIN users u ON p.user_id = u.user_id
                 ORDER BY p.created_at DESC`;
    return executeSQL(sql);
}

// Create a new post
async function createPostInDatabase(title, content, userId) {
    const sql = `INSERT INTO posts (title, content, user_id, created_at) VALUES (?, ?, ?, NOW())`;
    const params = [title, content, userId];
    return executeSQL(sql, params);
}

// Delete a post by ID
async function deletePostFromDatabase(postId) {
    const sql = "DELETE FROM posts WHERE post_id = ?";
    return executeSQL(sql, [postId]);
}

// Retrieve a post by ID
async function retrievePostById(postId, userId) {
    const sql = "SELECT * FROM posts WHERE post_id = ? AND user_id = ?";
    return executeSQL(sql, [postId, userId]);
}

// Update post by ID
async function updatePostInDatabase(postId, title, content) {
    console.log("Before Executing SQL:", [title, content, postId]);
    const sql = "UPDATE posts SET title = ?, content = ? WHERE post_id = ?";
    console.log("Executing SQL:", sql, [title, content, postId]); // Log the SQL query and values
    return executeSQL(sql, [title, content, postId]);
}

// Flag or unflag a post
async function flagPost(postId, flagStatus) {
    const sql = "UPDATE posts SET flagged = ? WHERE post_id = ?";
    const params = [flagStatus, postId];
    return executeSQL(sql, params);
}
async function getFlaggedPosts() {
    const sql = `SELECT *
                 FROM posts p
                 WHERE p.flagged = true`;

    console.log(sql);
    return executeSQL(sql);
}

module.exports = {
    getPostsFromDatabase,
    createPostInDatabase,
    deletePostFromDatabase,
    updatePostInDatabase,
    retrievePostById,
    flagPost,
    getFlaggedPosts
};
