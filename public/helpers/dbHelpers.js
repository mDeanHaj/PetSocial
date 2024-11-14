// Helper function to execute SQL queries
const pool = require("../../dbPool");

async function executeSQL(sql, params) {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

module.exports = { executeSQL };