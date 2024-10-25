const express = require("express");
const mysql = require("mysql");
const app = express();
const pool = require("./dbPool.js");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

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
  res.redirect("/list/edit");
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

app.post("/profile/new", async (req, res) => {
  try {
    const { name, species, age, gender, zip, city, state, bio, image_url } =
      req.body;

    //Inserting a pet into the profile database
    let sqlProfile =
      "INSERT INTO profile (name, species, age, gender, bio) VALUES (?, ?, ?, ?, ?)";

    let paramsProfile = [name, species, age, gender, bio];
    let resultProfile = await executeSQL(sqlProfile, paramsProfile);
    
    // Get the last inserted profile_id
    let sqlGetLastId = "SELECT LAST_INSERT_ID() as last_id";
    let resultLastId = await executeSQL(sqlGetLastId);

    // Extracting the last inserted profile_id from the result
    let extractedProfileId = resultLastId[0].last_id;

    //Inserting the profile_id and location info into the location database
    let sqlLocation = "INSERT INTO location (profile_id, zipcode, city, state) VALUES (?, ?, ?, ?)";
    let paramsLocation = [extractedProfileId, zip, city, state];
    
    
    let resultLocation = await executeSQL(sqlLocation, paramsLocation);
    console.log(resultLocation);
    
    let sqlImages = "INSERT INTO images (profile_id, image_url) VALUES (?, ?)";
    let paramsImages = [resultProfile.insertId, image_url];
    await executeSQL(sqlImages, paramsImages);
    res.render("added");
  } catch (error) {
    console.error("Error in form submission: ", error);
    res.render("error");
  }
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
