const express = require("express");
const mysql = require("mysql");
const app = express();
const pool = require("./dbPool.js");
const bcrypt = require('bcrypt');
const session = require('express-session');

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
  
  res.redirect("/account");
});

// Route to delete a pet profile
app.get("/profile/delete", async function (req, res) {
  const profile_id = req.query.profile_id;
  await executeSQL(`DELETE FROM images WHERE profile_id = ?`, [profile_id]);
  await executeSQL(`DELETE FROM location WHERE profile_id = ?`, [profile_id]);
  await executeSQL(`DELETE FROM profile WHERE profile_id = ?`, [profile_id]);
  res.redirect("/list/edit");
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

// Route for account page
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

  try {
    const rows = await executeSQL(`SELECT * FROM users WHERE username = ?`, [username]);

    if (rows.length > 0) {
      const user = rows[0];
      const match = await bcrypt.compare(password, user.password_hash);

      if (match) {
        req.session.userId = user.user_id;
        res.redirect("/account");
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

// Route for logging out
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.redirect('/login');
  });
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
