const express = require('express');
const blogRouter = express.Router();
const blogController = require('./blogController');


// Route for the blog page - Get all posts
blogRouter.get('/', async (req, res) => {
    try {
        const posts = await blogController.getPostsFromDatabase();
        res.render('blog', { posts, userId: req.session.userId });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).send("Error fetching posts");
    }
});

// Route for submitting a new blog post
blogRouter.post('/', async (req, res) => {
    const { title, content } = req.body;

    if (!req.session.userId) {
        return res.status(403).send("You must be logged in to post.");
    }

    try {
        await blogController.createPostInDatabase(title, content, req.session.userId);
        res.redirect('/blog');
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).send("Error creating post");
    }
});

// Route to delete a blog post by ID
blogRouter.delete('/:id', async (req, res) => {
    const postId = req.params.id;

    try {
        await blogController.deletePostFromDatabase(postId);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ success: false, message: "Error deleting post" });
    }
});

// Route to edit a blog by ID
blogRouter.put('/edit/:id', async (req, res) => {
    const postId = req.params.id;
    const userId = req.session.userId;
    const { title, content } = req.body;
    console.log("Request body:", req.body); // Check if JSON data is being parsed correctly

    if (!userId) {
        return res.status(403).send("You must be logged in to edit a post.");
    }

    try {
        // Check if the user owns the post before updating
        const post = await blogController.retrievePostById(postId, userId);
        if (post.length > 0) {
            // Update the post
            await blogController.updatePostInDatabase(postId, title, content)
            res.json({ success: true });
        } else {
            res.status(403).json({ success: false, message: "Unauthorized" });
        }
    } catch (error) {
        console.error("Error editing post:", error);
        res.status(500).send("Error editing post");
    }
});

// Route to render the new post form
blogRouter.get('/new', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    res.render('newPost', { userId: req.session.userId });
});


module.exports = blogRouter;
