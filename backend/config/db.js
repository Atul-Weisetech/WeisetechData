const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'c1115867.sgvps.net',
  user: 'utj6bmhsz3vjf',
  password: 'o5rdzfwc3z0w',
  database: 'dbwar8amqpkhso',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test connection on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error('MySQL connection error:', err);
  } else {
    console.log('MySQL connected');
    connection.release();
  }
});

module.exports = pool;
