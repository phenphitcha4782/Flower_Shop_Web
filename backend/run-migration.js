const mysql = require('mysql2/promise');
const fs = require('fs');

async function runMigration() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'flower_shop_db',
    multipleStatements: true,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    const connection = await pool.getConnection();
    console.log('✓ Connected to database');

    // Read migration file
    const sql = fs.readFileSync('./migrate-add-florist-columns.sql', 'utf8');
    
    // Execute migration
    console.log('Running migration...');
    await connection.query(sql);
    console.log('✓ Migration completed successfully');

    // Verify payment table columns
    const [paymentColumns] = await connection.query('SHOW COLUMNS FROM payment');
    console.log('\nPayment table columns:');
    paymentColumns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

    // Verify prepare table exists
    const [prepareColumns] = await connection.query('SHOW COLUMNS FROM prepare');
    console.log('\nPrepare table columns:');
    prepareColumns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

    connection.release();
    pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
