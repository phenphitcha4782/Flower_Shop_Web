// Test script to check and create promotion table if needed
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'flower_shop_db',
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true
});

async function checkAndCreatePromotions() {
  const conn = await pool.getConnection();
  try {
    // Check if promotion table exists
    const [tables] = await conn.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'promotion'`
    );

    if (tables.length === 0) {
      console.log('❌ Promotion table not found! Creating...');
      
      // Create table
      await conn.query(`
        CREATE TABLE promotion (
          promotion_id INT PRIMARY KEY AUTO_INCREMENT,
          promotion_name VARCHAR(255) NOT NULL,
          promotion_code VARCHAR(100) UNIQUE NOT NULL,
          discount DECIMAL(10, 2),
          max_discount DECIMAL(10, 2),
          minimum_order_amount DECIMAL(10, 2),
          description TEXT,
          usage_limit INT,
          per_user_limit INT,
          start_date DATE,
          end_date DATE,
          is_active TINYINT(1) DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Promotion table created!');
    }

    // Check if table has data
    const [rows] = await conn.query('SELECT COUNT(*) as count FROM promotion');
    console.log(`📊 Total promotions in DB: ${rows[0].count}`);

    if (rows[0].count === 0) {
      console.log('📝 Inserting sample promotions...');
      
      await conn.query(`
        INSERT INTO promotion (promotion_name, promotion_code, discount, max_discount, minimum_order_amount, description, usage_limit, per_user_limit, start_date, end_date, is_active) VALUES
        ('ลด 50 บาท', 'BLOOM50', 50, 50, 199, 'บูมเบลสมดุล', 20, 1, '2024-01-01', '2026-12-31', 1),
        ('ลด 100 บาท', 'FLOWER100', 100, 100, 399, 'ดอกไม้ดอก', 16, 1, '2024-01-01', '2026-12-31', 1),
        ('ลด 20%', 'LOVE20', 20, 300, 199, 'รักเลย', 12, 1, '2024-01-01', '2026-12-31', 1),
        ('ลด 120 บาท', 'SAVE120', 120, 120, 599, 'เทศกาลพิเศษ', 10, 1, '2024-01-01', '2026-12-31', 1),
        ('ส่งฟรี', 'FREESHIP', 0, NULL, 499, 'ส่งฟรีทั่วประเทศ', 30, 1, '2024-01-01', '2026-12-31', 1)
      `);
      console.log('✅ Sample promotions inserted!');
    }

    // Show all promotions
    const [allPromos] = await conn.query('SELECT promotion_id, promotion_code, promotion_name, discount, is_active FROM promotion');
    console.log('\n📋 Current promotions:');
    console.table(allPromos);

    // Check active promotions
    const [activePromos] = await conn.query(`
      SELECT promotion_id, promotion_code, promotion_name, discount FROM promotion
      WHERE is_active = 1
      AND (start_date IS NULL OR start_date <= CURDATE())
      AND (end_date IS NULL OR end_date >= CURDATE())
    `);
    console.log('\n✅ Active promotions (matching filter):');
    console.table(activePromos);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    conn.release();
    await pool.end();
  }
}

checkAndCreatePromotions();
