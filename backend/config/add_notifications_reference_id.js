const db = require('./db');
const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, 'add_notifications_reference_id.sql');
const sql = fs.readFileSync(sqlPath, 'utf8').trim();

db.query(
  `SELECT COUNT(*) as c FROM INFORMATION_SCHEMA.COLUMNS 
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tbl_notifications' AND COLUMN_NAME = 'reference_id'`,
  (err, rows) => {
    if (err) {
      console.error('Error checking column:', err.message);
      process.exit(1);
    }
    if (rows && rows[0] && rows[0].c > 0) {
      console.log('Column reference_id already exists. Skipping.');
      process.exit(0);
    }
    db.query(sql, (err2) => {
      if (err2) {
        console.error('Error adding reference_id:', err2.message);
        process.exit(1);
      }
      console.log('Column reference_id added to tbl_notifications.');
      process.exit(0);
    });
  }
);
