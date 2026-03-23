require('dotenv').config();
const mysql = require('mysql2/promise');

(async function(){
  const pool = mysql.createPool({
    host: '111.223.52.156',
    user: 'zp12915_admin',
    password: 'flowershop131519Q',
    database: 'zp12915_flower_shop_db',
    port: 2222,
    waitForConnections: true,
    connectionLimit: 2
  });

  try {S
    const [rows] = await pool.query('SELECT * FROM `province`');
    console.log('Connection OK:', rows);
    // optional: check branches table
    // const [branches] = await pool.query('SELECT id, name FROM branches LIMIT 5');
    // console.log('Branches sample:', branches);
  } catch (err) {
    console.error('DB test failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
