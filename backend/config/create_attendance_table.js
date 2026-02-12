const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// Database connection configuration
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '2609',
  database: 'hr_tool'
});

// Read the SQL file
const sqlFilePath = path.join(__dirname, 'create_attendance_table.sql');
const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

// Connect to database and execute the script
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    process.exit(1);
  }
  
  console.log('Connected to MySQL database');
  
  // Execute the SQL script
  connection.query(sqlScript, (err, results) => {
    if (err) {
      console.error('Error executing SQL script:', err);
      connection.end();
      process.exit(1);
    }
    
    console.log('tbl_attendance table created successfully!');
    console.log(results);
    
    connection.end();
  });
});