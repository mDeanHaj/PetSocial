const mysql = require('mysql');

const pool  = mysql.createPool({
    connectionLimit: 10,
    host: "i0rgccmrx3at3wv3.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
    user: "t95a7ri5auepz7oz",
    password: "ea7hb1kpwemlzx5u",
    database: "rcei7skv3btl266x"
});

module.exports = pool;