const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'nodeuser',
  password: 'Node@123',
  database: 'hrtools'
});

connection.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    console.log('Please check if MySQL server is running and database "hr_tool" exists');
  } else {
    console.log('MySQL connected');
  }
});

// Add error handler for future errors
connection.on('error', (err) => {
  console.error('MySQL connection error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Database connection was closed. Attempting to reconnect...');
    // You could implement reconnection logic here
  } else {
    throw err;
  }
});

module.exports = connection;