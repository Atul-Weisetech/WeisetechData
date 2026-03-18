const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: 'http://c1115867.sgvps.net/',
  user: 'utj6bmhsz3vjf',
  password: 'o5rdzfwc3z0w',
  database: 'dbwar8amqpkhso'
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