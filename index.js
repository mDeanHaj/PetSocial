const express = require("express");
const mysql = require("mysql");
const app = express();
const pool = require("./dbPool.js");
const bcrypt = require('bcrypt');
const crypto = require("crypto");
const session = require('express-session');
const nodemailer = require("nodemailer");
require("dotenv").config();
const sgMail = require('@sendgrid/mail');

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Initialize session
app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true
}));

// Route for Home page
app.get("/", async (req, res) => {
  const url = "https://api.unsplash.com/photos/random/?client_id=7756a1e81f817c186cf57294e1c19b37b49c54b8f34e7c499ee0ce5cd86cd16e&featured=true&query=pets&width=800&height=500&orientation=landscape";


  try {
    // Dynamically import `node-fetch`
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(url);
    const data = await response.json();

    // Check if `data.urls` and `data.urls.small` exist, else use a fallback image
    const image = data.urls && data.urls.small ? data.urls.small : "/img/default-image.png";

    // Pass userId for conditional rendering in navbar
    res.render("index", { petUrl: image, userId: req.session.userId });
  } catch (error) {
    console.error("Error fetching image:", error);
    // Render the page with a fallback image if there's an error
    res.render("index", { petUrl: "/img/default-image.png", userId: req.session.userId });
  }
});

// Route for Profile page
app.get("/profile", async (req, res) => {
  const sql = `
    SELECT p.profile_id, p.name, p.species, p.age, p.gender, p.bio, i.image_url
    FROM profile p
    LEFT JOIN images i ON p.profile_id = i.profile_id
    ORDER BY p.profile_id`;

  const rows = await executeSQL(sql);
  res.render("profile", { profiles: rows, userId: req.session.userId });
});

// Route for Relationship page
app.get("/relationship", (req, res) => {
  res.render("relationship", { userId: req.session.userId });
});

// Route for Edit Blog
app.get("/editBlog", (req, res) => {
  res.render("editBlog", { userId: req.session.userId });
});

// Edit List route
app.get("/list/edit", async function (req, res) {
  const sql = `SELECT * FROM profile ORDER BY profile_id`;
  const rows = await executeSQL(sql);
  res.render("listEdit", { profiles: rows, userId: req.session.userId });
});


// Route for editing a pet profile
app.get("/edit/pet", async (req, res) => {
  const profile_id = req.query.profile_id;
  const profile = await executeSQL(`SELECT * FROM profile WHERE profile_id = ?`, [profile_id]);
  const location = await executeSQL(`SELECT city, state, zipcode FROM location WHERE profile_id = ?`, [profile_id]);
  const image = await executeSQL(`SELECT image_url FROM images WHERE profile_id = ?`, [profile_id]);

  res.render("editPet", {
    profile: profile[0],
    image: image[0] ? image[0].image_url : null,
    location: location[0],
    userId: req.session.userId
  });
});


// Route to handle pet profile edit submission
app.post("/edit/pet", async (req, res) => {
  const { profile_id, name, species, age, gender, bio, image_url, city, state, zipcode } = req.body;

  await executeSQL(`UPDATE profile SET name = ?, species = ?, age = ?, gender = ?, bio = ? WHERE profile_id = ?`,
                   [name, species, age, gender, bio, profile_id]);

  await executeSQL(`UPDATE location SET city = ?, state = ?, zipcode = ? WHERE profile_id = ?`, 
                   [city, state, zipcode, profile_id]);

  const imageExists = await executeSQL(`SELECT COUNT(*) AS count FROM images WHERE profile_id = ?`, [profile_id]);

  if (imageExists[0].count > 0) {
    await executeSQL(`UPDATE images SET image_url = ? WHERE profile_id = ?`, [image_url, profile_id]);
  } else {
    await executeSQL(`INSERT INTO images (profile_id, image_url) VALUES (?, ?)`, [profile_id, image_url]);
  }
  
  res.redirect("/admin");
});

// Route to delete a pet profile
app.get("/profile/delete", async function (req, res) {
  const profile_id = req.query.profile_id;
  await executeSQL(`DELETE FROM images WHERE profile_id = ?`, [profile_id]);
  await executeSQL(`DELETE FROM location WHERE profile_id = ?`, [profile_id]);
  await executeSQL(`DELETE FROM profile WHERE profile_id = ?`, [profile_id]);
  res.redirect("/list/edit");
});


// Route to delete a user
app.get("/delete/user", async (req, res) => {
  const userId = req.query.user_id;

  const sql = `DELETE FROM users WHERE user_id = ?`;
  const values = [userId];

  try {
    await executeSQL(sql, values);
    res.redirect("/users"); // Redirect back to the users page after deletion
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).send("Error deleting user");
  }
});


// Simple pages
app.get("/added", (req, res) => res.render("added", { userId: req.session.userId }));
app.get("/error", (req, res) => res.render("error", { userId: req.session.userId }));
app.get("/add/pet", (req, res) => res.render("addPet", { userId: req.session.userId }));



// Route for liking a profile
app.post('/like/:profileId', async (req, res) => {
  const profileId = req.params.profileId;

  try {
    await executeSQL(`UPDATE profile SET likes = likes + 1 WHERE profile_id = ?`, [profileId]);
    const profile = await executeSQL(`SELECT likes FROM profile WHERE profile_id = ?`, [profileId]);
    res.json({ success: true, likes: profile[0].likes });
  } catch (error) {
    console.error('Error liking profile:', error);
    res.status(500).json({ success: false });
  }
});


// Route for user account page
app.get("/account", async (req, res) => {
  if (!req.session.userId) return res.redirect("/login");

  const profiles = await executeSQL(`SELECT * FROM profile WHERE user_id = ?`, [req.session.userId]);
  res.render("account", { profiles, userId: req.session.userId });
});


// Route for login page
app.get("/login", (req, res) => {
  res.render("login", { userId: req.session.userId });
});



// Handle login form submission
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const sql = `SELECT * FROM users WHERE username = ?`;
  const values = [username];

  try {
    const rows = await executeSQL(sql, values);

    if (rows.length > 0) {
      const user = rows[0];
      const match = await bcrypt.compare(password, user.password_hash);
      
      if (match) {
        req.session.userId = user.user_id;
        req.session.role = user.role; // Store role in session

        // Redirect based on user role
        if (user.role === "admin") {
          res.redirect("/admin"); // Redirect to admin page
        } else {
          res.redirect("/account"); // Redirect to regular account page
        }
      } else {
        res.status(401).send("Incorrect password");
      }
    } else {
      res.status(404).send("User not found");
    }
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).send("Error logging in");
  }
});


// Route for signup page
app.get("/signup", (req, res) => {
  res.render("signup", { userId: req.session.userId });
});


// Handle signup form submission
app.post('/signup', async (req, res) => {
  const { name, lastname, username, password } = req.body;
  const password_hash = await bcrypt.hash(password, 10);

  try {
    await executeSQL(`INSERT INTO users (name, lastname, username, password_hash) VALUES (?, ?, ?, ?)`,
                     [name, lastname, username, password_hash]);
    res.redirect("/login");
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).send("Error creating user");
  }
});

// Route to handle profile creation
app.post("/profile/new", async (req, res) => {
  const { name, species, age, gender, zip, city, state, bio, image_url } = req.body;

  if (!req.session.userId) {
    return res.status(403).send("You must be logged in to add a pet.");
  }

  try {
    const resultProfile = await executeSQL(`INSERT INTO profile (name, species, age, gender, bio, user_id) VALUES (?, ?, ?, ?, ?, ?)`,
                                           [name, species, age, gender, bio, req.session.userId]);

    const profileId = resultProfile.insertId;
    await executeSQL(`INSERT INTO location (profile_id, zipcode, city, state) VALUES (?, ?, ?, ?)`,
                     [profileId, zip, city, state]);
    await executeSQL(`INSERT INTO images (profile_id, image_url) VALUES (?, ?)`, [profileId, image_url]);

    res.redirect("/account");
  } catch (error) {
    console.error("Error creating profile:", error);
    res.status(500).render("error");
  }
});

// Route for the blog page
app.get("/blog", async (req, res) => {
  //await createPostsTable();
  const sql = `SELECT p.title, p.content, p.created_at, u.username
               FROM posts p
               JOIN users u ON p.user_id = u.user_id
               ORDER BY p.created_at DESC`;

  const posts = await executeSQL(sql);
  res.render("blog", { posts, userId: req.session.userId });
});

// Route to handle new blog post submission
app.post("/blog", async (req, res) => {

  const { title, content } = req.body;

  if (!req.session.userId) {
    return res.status(403).send("You must be logged in to post.");
  }

  try {
    await executeSQL(`INSERT INTO posts (title, content, user_id, created_at) VALUES (?, ?, ?, NOW())`,
        [title, content, req.session.userId]);
    res.redirect("/blog");
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).send("Error creating post");
  }
});

// Route for Friends page
app.get("/friends", (req, res) => {
  res.render("friends", { userId: req.session.userId });
});

// Route for logging out
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.redirect('/login');
  });
});


// Route for the Admin account page - 
app.get("/admin", async (req, res) => {
  if (req.session.role === "admin") {
    try {
      // Fetch profiles specific to the logged-in admin user
      const profiles = await executeSQL(`SELECT * FROM profile WHERE user_id = ?`, [req.session.userId]);
      res.render("admin", { profiles, userId: req.session.userId });
    } catch (error) {
      console.error("Error fetching admin profiles:", error);
      res.status(500).send("Error loading admin page.");
    }
  } else {
    res.status(403).send("Access denied");
  }
});


// Route to display the edit form for a specific user
app.get("/edit/user", async (req, res) => {
  const userId = req.query.user_id;
  const sql = `SELECT user_id, username, name, lastname, role FROM users WHERE user_id = ?`;
  const values = [userId];

  try {
    const rows = await executeSQL(sql, values);
    if (rows.length > 0) {
      const user = rows[0];
      res.render("editUser", { user });
    } else {
      res.status(404).send("User not found");
    }
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).send("Error fetching user");
  }
});


// Route to update the user in the database
app.post("/update/user", async (req, res) => {
  const { user_id, username, name, lastname, role } = req.body;

  const sql = `
    UPDATE users 
    SET username = ?, name = ?, lastname = ?, role = ? 
    WHERE user_id = ?
  `;
  const values = [username, name, lastname, role, user_id];

  try {
    await executeSQL(sql, values);
    res.redirect("/users"); // Redirect to the users page after updating
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).send("Error updating user");
  }
});


// Route to get the users page under the admin account
app.get("/users", async (req, res) => {
  const sql = `SELECT user_id, username, name, lastname, role FROM users`;

  try {
    const users = await executeSQL(sql); // Fetch all users from the database
    res.render("users", { users }); // Pass the users data to the users.ejs view
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).send("Error fetching users");
  }
});



// Route to display password reset form
app.get("/reset-password", (req, res) => {
  res.render("reset-password", { errorMessage: null });
});



// POST route for resetting the password
app.post("/reset-password", async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  // Check if passwords match
  if (password !== confirmPassword) {
    return res.render("newPassword", {
      token,
      errorMessage: "Passwords do not match. Please try again.",
    });
  }

  // Validate the token and update the password in the database
  const user = await executeSQL("SELECT * FROM users WHERE reset_token = ?", [token]);

  // Check if the user exists and if the token has expired
  if (!user || user.reset_token_expiry < new Date()) {
    return res.render("newPassword", {
      token,
      errorMessage: "Invalid or expired token. Please try resetting your password again.",
    });
  }

  // Hash the new password and update it
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Update the user's password and clear the reset token fields
  await executeSQL("UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE reset_token = ?", [hashedPassword, token]);

   
  // Render the success page with link to the login page
  res.render("passwordResetSuccess");
});


//////////// SENGRID CONFIG  ////////////////

// Set the SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


// Route for resetting password with the token
app.get("/reset/:token", async (req, res) => {
  const { token } = req.params;  // Get the reset token from the URL

  // Validate the token in the database
  const user = await executeSQL("SELECT * FROM users WHERE reset_token = ?", [token]);
  
  if (!user || user.reset_token_expiry < new Date()) {
    return res.status(400).send("Invalid or expired token.");
  }

  // Render the reset password page, passing the token as a parameter
  res.render("newPassword", { token });
});



// Password reset POST route
app.post("/password-reset", async (req, res) => {
  const { username, email } = req.body;

  // Check if the username exists in the database
  const user = await executeSQL("SELECT * FROM users WHERE username = ?", [username]);

  
  if (!user || user.length === 0) { 
    console.log("User does not exist.");  
      return res.render("reset-password", { errorMessage: "User does not exist." });
  }

  // Generate a secure token 
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Store the reset token and its expiration in the database
  await executeSQL("UPDATE users SET reset_token = ?, reset_token_expiry = NOW() + INTERVAL 1 HOUR WHERE username = ?", [resetToken, username]);

  
  /*############################################################################*/
  // Prepare the email content with the reset token link
  /*####### Comment out the line you are not using Local Computer vs Actual website #########*/
  const resetLink = `https://petsocial.tech/reset/${resetToken}`;  
  //const resetLink = `http://localhost:3000/reset/${resetToken}`;  
  /*############################################################################*/


  // Set up SendGrid email options
  const msg = {
    to: email, // Send the email to the email provided by the user
    from: 'petsocial.tech@gmail.com', // This should be a verified sender email in SendGrid
    subject: "Password Reset Request",
    text: `You requested a password reset. Click the following link to reset your password: ${resetLink}`,
    html: `<p>You requested a password reset. Click the following link to reset your password: <a href="${resetLink}">Reset Password</a></p>`
  };
  

  // Send the email using SendGrid
  try {
    await sgMail.send(msg);
    res.send("Password reset email sent. Please check your inbox.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error sending email.");
  }
});




// Helper function to execute SQL queries
async function executeSQL(sql, params) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Start server
app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});