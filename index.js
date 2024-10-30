const express = require("express");
const mysql = require("mysql");
const app = express();
const pool = require("./dbPool.js");
const bcrypt = require('bcrypt');
const session = require('express-session');
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: true
}));

// Route 1
app.get("/", async (req, res) => {
  let url =
    "https://api.unsplash.com/photos/random/?client_id=7756a1e81f817c186cf57294e1c19b37b49c54b8f34e7c499ee0ce5cd86cd16e&featured=true&query=pets&width=800&height=500&orientation=landscape";

  let response = await fetch(url);
  let data = await response.json();
  let image = data.urls.small;

  res.render("index", { petUrl: image });
});

app.get("/profile", async (req, res) => {
  let sql = `
    SELECT p.profile_id, p.name, p.species, p.age, p.gender, p.bio, i.image_url
    FROM profile p
    LEFT JOIN images i ON p.profile_id = i.profile_id
    ORDER BY p.profile_id`;
  let rows = await executeSQL(sql);

  res.render("profile", { profiles: rows });
});

app.get("/relationship", (req, res) => {
  res.render("relationship");
});

app.get("/list/edit", async function (req, res) {
  let sql = `SELECT *
            FROM profile
            ORDER BY profile_id`;
  let rows = await executeSQL(sql);
  res.render("listEdit", { profiles: rows });
});

app.get("/edit/pet", async (req, res) => {
  let profile_id = req.query.profile_id;
  let sqlProfile = `SELECT * FROM profile 
                    WHERE profile_id = ?`;
  
  let profileParams = [profile_id];
  let profile = await executeSQL(sqlProfile, profileParams);

  let sqlLocation = `SELECT city, state, zipcode FROM location WHERE profile_id = ?`;
  let location = await executeSQL(sqlLocation, profileParams);

  let sqlImage = `SELECT image_url FROM images WHERE profile_id = ?`;
  let image = await executeSQL(sqlImage, profileParams);


  res.render("editPet", {
    profile: profile[0],
    image: image[0] ? image[0].image_url : null,
    location: location[0],
  });
});

app.post("/edit/pet", async (req, res) => {
  const { profile_id, name, species, age, gender, bio, image_url, city, state, zipcode } = req.body;

  let sqlUpdateProfile = `UPDATE profile 
                            SET name = ?, 
                            species = ?, 
                            age = ?, 
                            gender = ?, 
                            bio = ? 
                            WHERE profile_id = ?`;
  let profileParams = [name, species, age, gender, bio, profile_id];
  await executeSQL(sqlUpdateProfile, profileParams);

  let sqlUpdateLocation = `UPDATE location 
                            SET city = ?, 
                            state = ?, 
                            zipcode = ? 
                            WHERE profile_id = ?`;
  let locationParams = [city, state, zipcode, profile_id];
  await executeSQL(sqlUpdateLocation, locationParams);
  
  let sqlCheckImage = `SELECT COUNT(*) AS count 
                          FROM images 
                          WHERE profile_id = ?`;
  let imageExist = await executeSQL(sqlCheckImage, [profile_id]);

  if (imageExist[0].count > 0) {
    let sqlUpdateImage = `UPDATE images 
                              SET image_url = ? 
                              WHERE profile_id = ?`;
    let imageParams = [image_url, profile_id];
    await executeSQL(sqlUpdateImage, imageParams);
  } else {
    let sqlInsertImage = `INSERT INTO images (profile_id, image_url) VALUES (?, ?)`;
    let imageParams = [profile_id, image_url];
    await executeSQL(sqlInsertImage, imageParams);
  }
  res.redirect("/account");
});

app.get("/profile/delete", async function (req, res) {
  let deleteImagesSql = `DELETE FROM images WHERE profile_id = ?`;
  let deleteLocationSql = `DELETE FROM location WHERE profile_id = ?`;
  let deleteProfileSql = `DELETE FROM profile WHERE profile_id = ?`;
  let params = [req.query.profile_id];
  await executeSQL(deleteLocationSql, params);
  await executeSQL(deleteImagesSql, params);
  await executeSQL(deleteProfileSql, params);
  res.redirect("/list/edit");
});

app.get("/added", (req, res) => {
  res.render("added");
});

app.get("/error", (req, res) => {
  res.render("error");
});

app.get("/add/pet", (req, res) => {
  res.render("addPet");
});


//ORIGINAL CODE
// app.post("/profile/new", async (req, res) => {
//   try {
//     const { name, species, age, gender, zip, city, state, bio, image_url } =
//       req.body;

//     //Inserting a pet into the profile database
//     let sqlProfile =
//       "INSERT INTO profile (name, species, age, gender, bio) VALUES (?, ?, ?, ?, ?)";

//     let paramsProfile = [name, species, age, gender, bio];
//     let resultProfile = await executeSQL(sqlProfile, paramsProfile);
    
//     // Get the last inserted profile_id
//     let sqlGetLastId = "SELECT LAST_INSERT_ID() as last_id";
//     let resultLastId = await executeSQL(sqlGetLastId);

//     // Extracting the last inserted profile_id from the result
//     let extractedProfileId = resultLastId[0].last_id;

//     //Inserting the profile_id and location info into the location database
//     let sqlLocation = "INSERT INTO location (profile_id, zipcode, city, state) VALUES (?, ?, ?, ?)";
//     let paramsLocation = [extractedProfileId, zip, city, state];
    
    
//     let resultLocation = await executeSQL(sqlLocation, paramsLocation);
//     console.log(resultLocation);
    
//     let sqlImages = "INSERT INTO images (profile_id, image_url) VALUES (?, ?)";
//     let paramsImages = [resultProfile.insertId, image_url];
//     await executeSQL(sqlImages, paramsImages);
//     res.render("added");
//   } catch (error) {
//     console.error("Error in form submission: ", error);
//     res.render("error");
//   }
// });


// // WORKS BUT USER_ID IS NULL
// app.post("/profile/new", async (req, res) => {
//   try {
//     const { name, species, age, gender, zip, city, state, bio, image_url } = req.body;

//     // Ensure user is logged in
//     if (!req.session.userId) {
//       return res.redirect("/login");
//     }
    
//     // Insert a pet profile associated with the logged-in user
//     const sqlProfile = `
//       INSERT INTO profile (name, species, age, gender, bio, user_id)
//       VALUES (?, ?, ?, ?, ?, ?)`;

//     const paramsProfile = [name, species, age, gender, bio, req.session.userId];
//     const resultProfile = await executeSQL(sqlProfile, paramsProfile);

//     // Get the last inserted profile_id
//     const sqlGetLastId = "SELECT LAST_INSERT_ID() as last_id";
//     const resultLastId = await executeSQL(sqlGetLastId);
//     const profileId = resultLastId[0].last_id;

//     // Insert location information tied to the profile
//     const sqlLocation = `
//       INSERT INTO location (profile_id, zipcode, city, state)
//       VALUES (?, ?, ?, ?)`;
//     const paramsLocation = [profileId, zip, city, state];
//     await executeSQL(sqlLocation, paramsLocation);

//     // Insert image information tied to the profile
//     const sqlImages = `
//       INSERT INTO images (profile_id, image_url)
//       VALUES (?, ?)`;
//     const paramsImages = [profileId, image_url];
//     await executeSQL(sqlImages, paramsImages);

//     res.redirect("/account"); // Redirect to the account page after adding profile
//   } catch (error) {
//     console.error("Error in form submission: ", error);
//     res.status(500).render("error");
//   }
// });



app.post("/profile/new", async (req, res) => {
  try {
    const { name, species, age, gender, zip, city, state, bio, image_url } = req.body;
    const userId = req.session.userId;

    if (!userId) {
      return res.status(403).send("You must be logged in to add a pet.");
    }

    // Insert pet profile, including the user_id field
    let sqlProfile = `
      INSERT INTO profile (name, species, age, gender, bio, user_id)
      VALUES (?, ?, ?, ?, ?, ?)`;
    let paramsProfile = [name, species, age, gender, bio, userId];
    let resultProfile = await executeSQL(sqlProfile, paramsProfile);

    // Get the last inserted profile_id
    let sqlGetLastId = "SELECT LAST_INSERT_ID() as last_id";
    let resultLastId = await executeSQL(sqlGetLastId);
    let extractedProfileId = resultLastId[0].last_id;

    // Insert location data linked to this profile
    let sqlLocation = "INSERT INTO location (profile_id, zipcode, city, state) VALUES (?, ?, ?, ?)";
    let paramsLocation = [extractedProfileId, zip, city, state];
    await executeSQL(sqlLocation, paramsLocation);

    // Insert image data linked to this profile
    let sqlImages = "INSERT INTO images (profile_id, image_url) VALUES (?, ?)";
    let paramsImages = [extractedProfileId, image_url];
    await executeSQL(sqlImages, paramsImages);

    res.redirect("/account");
  } catch (error) {
    console.error("Error creating profile:", error);
    res.status(500).render("error");
  }
});



// Route for login page
app.get("/login", async (req, res) => {
  res.render("login"); // Render the login.ejs template
});



// Handle login form submission
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const sql = `
    SELECT * FROM users
    WHERE username = ?`;
  const values = [username];

  try {
    const rows = await executeSQL(sql, values);

    console.log("Query Results:", rows); // Check what is returned from the database

    if (rows.length > 0) {
      const user = rows[0];

      // Compare entered password with stored hash
      const match = await bcrypt.compare(password, user.password_hash);

      console.log("Password Match:", match); // Log whether the passwords match
      
      if (match) {
        req.session.userId = user.user_id;

        console.log("User logged in, session ID:", req.session.userId); // Confirm session

        res.redirect("/account"); // Redirect to account page on successful login
      } else {

        console.log("Incorrect password entered"); // Log incorrect password attempt

        res.status(401).send("Incorrect password");
      }
    } else {

      console.log("User not found"); // Log if user not found

      res.status(404).send("User not found");
    }
  } catch (err) {

    console.error("Error logging in:", err);
    res.status(500).send("Error logging in");
  }
});


// Route for signup page
app.get("/signup", async (req, res) => {
  res.render("signup"); // Render the signup.ejs template
});


// Handle signup form submission
app.post('/signup', async (req, res) => {
  const { name, lastname, username, password } = req.body;

  // Hash the password
  const password_hash = await bcrypt.hash(password, 10);

  // Define SQL query and values
  const sql = `
    INSERT INTO users (name, lastname, username, password_hash)
    VALUES (?, ?, ?, ?)`;
  const values = [name, lastname, username, password_hash];

  // Execute the query
  try {
    await executeSQL(sql, values);
    res.redirect("/login"); // Redirect to login page after signup
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).send("Error creating user");
  }
});



// Render account page (only accessible if logged in)
// app.get("/account", (req, res) => {
//   if (!req.session.userId) {
//     return res.redirect("/login"); // Redirect to login if user is not logged in
//   }

//   // Optionally fetch user data from the database
//   res.render("account", { userId: req.session.userId });
// });


app.get("/account", async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  const sql = `SELECT * FROM profile WHERE user_id = ?`;
  const values = [req.session.userId];

  try {
    const profiles = await executeSQL(sql, values);
    res.render("account", { profiles }); // Pass profiles to account.ejs for rendering
  } catch (error) {
    console.error("Error retrieving profiles:", error);
    res.status(500).render("error");
  }
});


// Logout and destroy session
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.redirect('/login');
  });
});


//functions
async function executeSQL(sql, params) {
  return new Promise(function (resolve, reject) {
    pool.query(sql, params, function (err, rows, fields) {
      if (err) throw err;
      resolve(rows);
    });
  });
}

//log
app.listen(3000, () => {
  console.log("It works! Server started.");
});
