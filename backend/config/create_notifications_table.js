const db = require('./db');
const fs = require('fs');
const path = require('path');

const sqlFilePath = path.join(__dirname, 'create_notifications_table.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

db.query(sql, (err, results) => {
  if (err) {
    console.error('Error creating tbl_notifications:', err.message);
    process.exit(1);
  }
  console.log('tbl_notifications table created successfully (or already exists).');
  process.exit(0);
});
