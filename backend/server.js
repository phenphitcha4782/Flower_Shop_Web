require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;


const multer = require("multer");
const { is } = require('express/lib/request');

const upload = multer(); // memory storage

// Enable CORS
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'flower_shop_db',
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true
});

const getExistingTableName = async (candidateNames) => {
  for (const tableName of candidateNames) {
    const [rows] = await pool.query('SHOW TABLES LIKE ?', [tableName]);
    if (Array.isArray(rows) && rows.length > 0) {
      return tableName;
    }
  }
  return null;
};


app.get("/api/regions", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT region_id, region_name FROM region ORDER BY region_name"
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ Regions API Error:', err.message);
    res.status(500).json({ 
      error: 'Failed to load regions',
      detail: err.message 
    });
  }
});

app.get("/api/branches", async (req, res) => {
  try {
    let query = `
      SELECT b.branch_id, b.branch_name, p.province_name, r.region_id, r.region_name
      FROM branch b
      JOIN province p ON b.province_id = p.province_id
      JOIN region r ON p.region_id = r.region_id
    `;
    const params = [];

    // ถ้าส่ง region_id มา ให้กรองเฉพาะที่ภาคนั้น
    if (req.query.region_id) {
      query += " WHERE r.region_id = ?";
      params.push(req.query.region_id);
    }

    query += " ORDER BY b.branch_name";
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('❌ Branches API Error:', err.message);
    res.status(500).json({ 
      error: 'Failed to load branches',
      detail: err.message 
    });
  }
});

// VASES: products where product_type_id corresponds to vase (default 2)
app.get('/api/vases', async (req, res) => {
  try {
    const productTypeId = Number(req.query.product_type_id || 2);
    const [rows] = await pool.query(
      'SELECT product_id, product_name, product_price AS price, product_type_id, product_img FROM product WHERE product_type_id = ? ORDER BY product_name',
      [productTypeId]
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ Vases API Error:', err.message);
    res.status(500).json({ error: 'Failed to load vases', detail: err.message });
  }
});

// Vase shapes by selected vase material product_id
app.get('/api/vase-shapes', async (req, res) => {
  try {
    const productId = Number(req.query.product_id);
    if (Number.isNaN(productId) || productId <= 0) {
      return res.status(400).json({ error: 'product_id is required' });
    }

    const [rows] = await pool.query(
      'SELECT vase_id, product_id, vase_name, vase_img, vase_price FROM vase WHERE product_id = ? ORDER BY vase_name',
      [productId]
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ Vase Shapes API Error:', err.message);
    res.status(500).json({ error: 'Failed to load vase shapes', detail: err.message });
  }
});

// Vase colors
app.get('/api/vase-colors', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT vase_color_id, vase_color_name AS color_name, hex FROM vase_color ORDER BY vase_color_id');
    res.json(rows);
  } catch (err) {
    console.error('❌ Vase Colors API Error:', err.message);
    res.status(500).json({ error: 'Failed to load vase colors', detail: err.message });
  }
});

// Main flowers (from flower table)
app.get('/api/main-flowers', async (_req, res) => {
  try {
    const [nameCols] = await pool.query("SHOW COLUMNS FROM flower LIKE 'flower_name'");
    let rows;
    if (Array.isArray(nameCols) && nameCols.length > 0) {
      [rows] = await pool.query('SELECT flower_id, flower_name, flower_price FROM flower ORDER BY flower_name');
    } else {
      [rows] = await pool.query("SELECT flower_id, CONCAT('ดอกหลัก #', flower_id) AS flower_name, flower_price FROM flower ORDER BY flower_id");
    }
    res.json(rows);
  } catch (err) {
    console.error('❌ Main Flowers API Error:', err.message);
    res.status(500).json({ error: 'Failed to load main flowers', detail: err.message });
  }
});

// Filler flowers (from filler_flower table)
app.get('/api/filler-flowers', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT filler_flower_id AS flower_id, filler_flower_name AS flower_name FROM filler_flower ORDER BY filler_flower_name');
    res.json(rows);
  } catch (err) {
    console.error('❌ Filler Flowers API Error:', err.message);
    res.status(500).json({ error: 'Failed to load filler flowers', detail: err.message });
  }
});

// Backward-compatible alias used by old frontend code
app.get('/api/flower-types', async (_req, res) => {
  try {
    const [nameCols] = await pool.query("SHOW COLUMNS FROM flower LIKE 'flower_name'");
    let rows;
    if (Array.isArray(nameCols) && nameCols.length > 0) {
      [rows] = await pool.query('SELECT flower_id, flower_name, flower_price FROM flower ORDER BY flower_name');
    } else {
      [rows] = await pool.query("SELECT flower_id, CONCAT('ดอกหลัก #', flower_id) AS flower_name, flower_price FROM flower ORDER BY flower_id");
    }
    res.json(rows);
  } catch (err) {
    console.error('❌ Flower Types API Error:', err.message);
    res.status(500).json({ error: 'Failed to load flower types', detail: err.message });
  }
});

// Bouquet styles
app.get('/api/bouquet-styles', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT bouquet_style_id, bouquet_style_name FROM bouquet_style ORDER BY bouquet_style_id');
    res.json(rows);
  } catch (err) {
    console.error('❌ Bouquet Styles API Error:', err.message);
    res.status(500).json({ error: 'Failed to load bouquet styles', detail: err.message });
  }
});

// Cards
app.get('/api/cards', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT card_id, card_name, card_img, card_price FROM card ORDER BY card_name'
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ Cards API Error:', err.message);
    res.status(500).json({ error: 'Failed to load cards', detail: err.message });
  }
});

// Product types
app.get('/api/product-types', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT product_type_id, product_type_name FROM product_type ORDER BY product_type_name');
    res.json(rows);
  } catch (err) {
    console.error('❌ Product Types API Error:', err.message);
    res.status(500).json({ error: 'Failed to load product types', detail: err.message });
  }
});

app.get('/api/wrapping-types', async (_req, res) => {
  try {
    const typeTable = await getExistingTableName(['wrapping_material_type', 'wrapping_type']);
    if (!typeTable) {
      return res.status(404).json({ error: 'Wrapping type table not found' });
    }

    const [rows] = await pool.query(
      `
      SELECT
        wrapping_type_id,
        wrapping_type_name
      FROM ${typeTable}
      ORDER BY wrapping_type_name
      `
    );

    res.json(rows);
  } catch (err) {
    console.error('❌ Wrapping Types API Error:', err.message);
    res.status(500).json({ error: 'Failed to load wrapping types', detail: err.message });
  }
});

app.get('/api/wrappings', async (req, res) => {
  try {
    const wrappingTypeId = Number(req.query.wrapping_type_id);
    if (Number.isNaN(wrappingTypeId) || wrappingTypeId <= 0) {
      return res.status(400).json({ error: 'wrapping_type_id is required' });
    }

    const wrappingTable = await getExistingTableName(['wrapping_material', 'wrapping']);
    if (!wrappingTable) {
      return res.status(404).json({ error: 'Wrapping material table not found' });
    }

    const [rows] = await pool.query(
      `
      SELECT
        wrapping_id,
        wrapping_type_id,
        wrapping_name,
        wrapping_img,
        wrapping_price
      FROM ${wrappingTable}
      WHERE wrapping_type_id = ?
      ORDER BY wrapping_name
      `,
      [wrappingTypeId]
    );

    res.json(rows);
  } catch (err) {
    console.error('❌ Wrapping Materials API Error:', err.message);
    res.status(500).json({ error: 'Failed to load wrapping materials', detail: err.message });
  }
});

app.get('/api/ribbons', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        ribbon_id,
        ribbon_name,
        ribbon_img
      FROM ribbon
      ORDER BY ribbon_name
      `
    );

    res.json(rows);
  } catch (err) {
    console.error('❌ Ribbons API Error:', err.message);
    res.status(500).json({ error: 'Failed to load ribbons', detail: err.message });
  }
});

app.get('/api/ribbon-colors', async (req, res) => {
  try {
    const ribbonId = Number(req.query.ribbon_id);
    if (Number.isNaN(ribbonId) || ribbonId <= 0) {
      return res.status(400).json({ error: 'ribbon_id is required' });
    }

    const [rows] = await pool.query(
      `
      SELECT
        ribbon_color_id,
        ribbon_id,
        ribbon_color_name,
        hex
      FROM ribbon_color
      WHERE ribbon_id = ?
      ORDER BY ribbon_color_name
      `,
      [ribbonId]
    );

    res.json(rows);
  } catch (err) {
    console.error('❌ Ribbon Colors API Error:', err.message);
    res.status(500).json({ error: 'Failed to load ribbon colors', detail: err.message });
  }
});

app.get('/api/monetary-bouquets', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        monetary_bouquet_id,
        monetary_bouquet_name,
        monetary_value
      FROM monetary_bouquet
      ORDER BY monetary_bouquet_id
      `
    );

    res.json(rows);
  } catch (err) {
    console.error('❌ Monetary Bouquets API Error:', err.message);
    res.status(500).json({ error: 'Failed to load monetary bouquets', detail: err.message });
  }
});

app.get('/api/folding-styles', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        folding_style_id,
        folding_style_name,
        folding_style_img,
        folding_style_price
      FROM folding_style
      ORDER BY folding_style_id
      `
    );

    res.json(rows);
  } catch (err) {
    console.error('❌ Folding Styles API Error:', err.message);
    res.status(500).json({ error: 'Failed to load folding styles', detail: err.message });
  }
});

app.get('/api/customers/points', async (req, res) => {
  try {
    const normalizedPhone = String(req.query.phone || '').replace(/\D/g, '');
    if (!normalizedPhone) {
      return res.status(400).json({ error: 'phone is required' });
    }

    const [rows] = await pool.query(
      `
      SELECT total_point
      FROM customer
      WHERE REPLACE(REPLACE(REPLACE(phone, '-', ''), ' ', ''), '+', '') = ?
      ORDER BY customer_id DESC
      LIMIT 1
      `,
      [normalizedPhone]
    );

    const points = rows.length ? Number(rows[0].total_point || 0) : 0;
    res.json({
      phone: normalizedPhone,
      points: Number.isFinite(points) ? Math.max(0, Math.floor(points)) : 0,
    });
  } catch (err) {
    console.error('❌ Customer Points API Error:', err.message);
    res.status(500).json({ error: 'Failed to load customer points', detail: err.message });
  }
});

app.get('/api/customers/profile', async (req, res) => {
  try {
    const normalizedPhone = String(req.query.phone || '').replace(/\D/g, '');
    if (!normalizedPhone) {
      return res.status(400).json({ error: 'phone is required' });
    }

    const [rows] = await pool.query(
      `
      SELECT
        c.customer_id,
        c.customer_name,
        c.customer_surname,
        c.phone,
        c.total_point,
        c.member_level_id,
        ml.member_level_name
      FROM customer c
      LEFT JOIN member_level ml ON ml.member_level_id = c.member_level_id
      WHERE REPLACE(REPLACE(REPLACE(c.phone, '-', ''), ' ', ''), '+', '') = ?
      ORDER BY c.customer_id DESC
      LIMIT 1
      `,
      [normalizedPhone]
    );

    let customerRow = rows[0] || null;

    if (!customerRow) {
      const [insertResult] = await pool.query(
        `
        INSERT INTO customer (
          customer_name,
          customer_surname,
          gender_id,
          member_level_id,
          phone,
          total_point
        ) VALUES (?, ?, ?, ?, ?, ?)
        `,
        ['-', '-', null, 1, normalizedPhone, 0]
      );

      const insertedId = insertResult.insertId;
      const [insertedRows] = await pool.query(
        `
        SELECT
          c.customer_id,
          c.customer_name,
          c.customer_surname,
          c.phone,
          c.total_point,
          c.member_level_id,
          ml.member_level_name
        FROM customer c
        LEFT JOIN member_level ml ON ml.member_level_id = c.member_level_id
        WHERE c.customer_id = ?
        LIMIT 1
        `,
        [insertedId]
      );

      customerRow = insertedRows[0] || {
        customer_id: insertedId,
        customer_name: '-',
        customer_surname: '-',
        phone: normalizedPhone,
        total_point: 0,
        member_level_id: 1,
        member_level_name: null,
      };
    }

    const points = Number(customerRow.total_point || 0);

    return res.json({
      customer_id: customerRow.customer_id,
      customer_name: customerRow.customer_name || '-',
      customer_surname: customerRow.customer_surname || '-',
      phone: normalizedPhone,
      points: Number.isFinite(points) ? Math.max(0, Math.floor(points)) : 0,
      member_level_id: Number(customerRow.member_level_id || 1),
      member_level_name: customerRow.member_level_name || `ระดับ ${Number(customerRow.member_level_id || 1)}`,
    });
  } catch (err) {
    console.error('❌ Customer Profile API Error:', err.message);
    return res.status(500).json({ error: 'Failed to load customer profile', detail: err.message });
  }
});

// Get active promotions with member levels and promotion type
app.get('/api/promotions', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        p.promotion_id,
        p.promotion_name,
        p.promotion_code,
        p.discount,
        p.max_discount,
        p.minimum_order_amount,
        p.description,
        p.usage_limit,
        p.per_user_limit,
        p.start_date,
        p.end_date,
        p.is_active,
        p.promotion_type_id,
        pt.promotion_type_name,
        GROUP_CONCAT(DISTINCT pml.member_level_id ORDER BY pml.member_level_id) as member_level_ids,
        GROUP_CONCAT(DISTINCT ml.member_level_name ORDER BY pml.member_level_id SEPARATOR '|') as member_level_names
      FROM promotion p
      LEFT JOIN promotion_type pt ON p.promotion_type_id = pt.promotion_type_id
      LEFT JOIN promotion_member_level pml ON p.promotion_id = pml.promotion_id
      LEFT JOIN member_level ml ON pml.member_level_id = ml.member_level_id
      WHERE p.is_active = 1
      AND (p.start_date IS NULL OR p.start_date <= CURDATE())
      AND (p.end_date IS NULL OR p.end_date >= CURDATE())
      GROUP BY p.promotion_id
      ORDER BY p.start_date DESC, p.promotion_id DESC
      `
    );

    console.log('✅ Fetched promotions from DB:', rows.length, 'records');

    const promotions = rows.map((row) => {
      let benefitType = 'amount';
      const discount = Number(row.discount || 0);
      
      // Determine benefit type based on discount value
      if (discount > 0 && discount <= 100) {
        benefitType = 'percent';
      } else if (discount > 100) {
        benefitType = 'amount';
      }

      // Check if it's a shipping promo (can also check promotion_type_name)
      const description = String(row.description || '').toLowerCase();
      const name = String(row.promotion_name || '').toLowerCase();
      const typeName = String(row.promotion_type_name || '').toLowerCase();
      if (description.includes('ฟรี') || name.includes('ฟรี') || 
          description.includes('shipping') || name.includes('shipping') ||
          typeName.includes('ส่วนลดจัดส่ง')) {
        benefitType = 'shipping';
      }

      // Parse member levels (comma-separated string from GROUP_CONCAT)
      const memberLevelIds = row.member_level_ids 
        ? row.member_level_ids.split(',').map(id => parseInt(id, 10))
        : [];
      const memberLevelNames = row.member_level_names
        ? row.member_level_names.split('|').filter(Boolean)
        : [];

      return {
        promotion_id: row.promotion_id,
        code: row.promotion_code,
        label: row.promotion_name,
        benefitType,
        benefitValue: discount,
        maxDiscount: row.max_discount ? Number(row.max_discount) : undefined,
        minSubtotal: row.minimum_order_amount ? Number(row.minimum_order_amount) : 0,
        description: row.description || '',
        usageLimit: row.usage_limit,
        perUserLimit: row.per_user_limit,
        startDate: row.start_date,
        endDate: row.end_date,
        promotionTypeId: row.promotion_type_id,
        promotionTypeName: row.promotion_type_name || '',
        memberLevelIds: memberLevelIds,
        memberLevelNames: memberLevelNames,
      };
    });

    res.json(promotions);
  } catch (err) {
    console.error('❌ Promotions API Error:', err.message);
    res.status(500).json({ 
      error: 'Failed to load promotions',
      detail: err.message 
    });
  }
});

// Debug endpoint to check all promotions (including inactive)
app.get('/api/promotions/debug/all', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM promotion LIMIT 10');
    console.log('👀 All promotions (debug):', rows);
    res.json(rows);
  } catch (err) {
    console.error('❌ Debug Promotions Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Test endpoint with hardcoded promotions
app.get('/api/promotions/test', async (_req, res) => {
  res.json([
    {
      promotion_id: 999,
      code: 'TEST50',
      label: 'สินค้าทดสอบ',
      benefitType: 'amount',
      benefitValue: 50,
      maxDiscount: 50,
      minSubtotal: 100,
      description: 'โปรโมชั่นทดสอบ',
      usageLimit: 10,
      perUserLimit: 1,
      startDate: '2024-01-01',
      endDate: '2026-12-31',
      promotionTypeId: 2,
      promotionTypeName: 'ส่วนลดราคา',
      memberLevelIds: [1, 2, 3, 4]
    }
  ]);
});

// Create order (transactional)
app.post('/api/orders', async (req, res) => {
  const payload = req.body || {};
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const resolveOrderStatus = async () => {
      const [rows] = await conn.query("SHOW COLUMNS FROM orders LIKE 'order_status'");
      const orderStatusType = rows?.[0]?.Type || '';
      const enumMatch = orderStatusType.match(/^enum\((.*)\)$/i);
      if (enumMatch && enumMatch[1]) {
        const allowedValues = enumMatch[1]
          .split(',')
          .map((v) => v.trim().replace(/^'/, '').replace(/'$/, ''));
        if (allowedValues.includes('waiting')) return 'waiting';
        if (allowedValues.includes('received')) return 'received';
      }
      return 'waiting';
    };

    const resolvePaymentMethodId = async (method) => {
      const normalized = String(method || '').trim().toLowerCase();
      const candidatesByMethod = {
        cash: ['Cash'],
        qr: ['Online Payment', 'QR Payment', 'Online'],
        credit: ['Credit Card'],
      };

      const candidates = candidatesByMethod[normalized] || ['Online Payment'];
      for (const methodName of candidates) {
        const [rows] = await conn.query(
          'SELECT payment_method_id FROM payment_method WHERE payment_method_name = ? AND is_active = 1 LIMIT 1',
          [methodName]
        );
        if (Array.isArray(rows) && rows.length > 0) {
          return Number(rows[0].payment_method_id);
        }
      }

      if (normalized === 'cash') return 1;
      if (normalized === 'credit') return 3;
      return 2;
    };

    // Generate unique order code ORD########
    const genOrderCode = async () => {
      while (true) {
        const n = Math.floor(10000000 + Math.random() * 90000000);
        const code = `ORD${n}`;
        const [r] = await conn.query('SELECT 1 FROM orders WHERE order_code = ?', [code]);
        if (r.length === 0) return code;
      }
    };
    const orderCode = await genOrderCode();

    // Resolve branch_id
    let branchId = payload.branch_id ?? null;
    if (!branchId && payload.branch) {
      const [brows] = await conn.query('SELECT branch_id FROM branch WHERE branch_name = ? LIMIT 1', [payload.branch]);
      if (brows.length) branchId = brows[0].branch_id;
    }

    const resolvePromotionId = async () => {
      const directPromotionId = Number(payload.promotion_id);
      if (Number.isInteger(directPromotionId) && directPromotionId > 0) {
        return directPromotionId;
      }

      const promotionCode = String(payload.promotion_code || '').trim();
      if (!promotionCode) {
        return null;
      }

      const [rows] = await conn.query(
        'SELECT promotion_id FROM promotion WHERE UPPER(TRIM(promotion_code)) = UPPER(TRIM(?)) LIMIT 1',
        [promotionCode]
      );
      if (Array.isArray(rows) && rows.length > 0) {
        return Number(rows[0].promotion_id);
      }

      return null;
    };

    // Insert or find customer by phone
    const customer = payload.customer || {};
    const receiver = payload.receiver || {};
    const normalizeDisplayName = (value) => String(value || '').trim();
    const splitFullName = (fullNameRaw) => {
      const fullName = normalizeDisplayName(fullNameRaw);
      if (!fullName) {
        return { firstName: null, surname: null };
      }
      const parts = fullName.split(/\s+/).filter(Boolean);
      if (parts.length === 1) {
        return { firstName: parts[0], surname: '-' };
      }
      return {
        firstName: parts[0],
        surname: parts.slice(1).join(' '),
      };
    };

    let customerId = null;
    if (customer.phone) {
      const [found] = await conn.query(
        'SELECT customer_id, customer_name, customer_surname FROM customer WHERE phone = ? LIMIT 1',
        [customer.phone]
      );
      if (found.length > 0) {
        customerId = found[0].customer_id;

        const existingName = normalizeDisplayName(found[0].customer_name);
        if (!existingName || existingName === '-') {
          const sourceName = normalizeDisplayName(receiver.name) || normalizeDisplayName(customer.name);
          const { firstName, surname } = splitFullName(sourceName);
          if (firstName) {
            await conn.query(
              'UPDATE customer SET customer_name = ?, customer_surname = ? WHERE customer_id = ?',
              [firstName, surname || '-', customerId]
            );
          }
        }
      }
    }
    if (!customerId) {
      const sourceName = normalizeDisplayName(receiver.name) || normalizeDisplayName(customer.name);
      const { firstName, surname } = splitFullName(sourceName);
      const [insCust] = await conn.query(
        'INSERT INTO customer (customer_name, customer_surname, phone, total_point) VALUES (?, ?, ?, ?)',
        [firstName || null, surname || null, customer.phone || null, Math.max(0, Math.floor(Number(payload.total_amount || 0) / 100))]
      );
      customerId = insCust.insertId;
    }

    // Insert order
    const orderStatus = await resolveOrderStatus();
    const promotionId = await resolvePromotionId();
    const [insOrder] = await conn.query(
      'INSERT INTO orders (branch_id, customer_id, promotion_id, order_code, order_status, total_amount) VALUES (?, ?, ?, ?, ?, ?)',
      [branchId, customerId, promotionId, orderCode, orderStatus, payload.total_amount || 0]
    );
    const orderId = insOrder.insertId;

    // Insert order address
    await conn.query(
      'INSERT INTO order_address (order_id, receiver_name, receiver_phone, receiver_address) VALUES (?, ?, ?, ?)',
      [orderId, receiver.name || customer.name || null, receiver.phone || customer.phone || null, receiver.address || (payload.pickup ? 'ที่ร้าน' : null)]
    );
    
    // Insert payment and link payment_method_id
    const slipImage = payload.payment;
    const slipType = payload.method;
    const paymentMethodId = await resolvePaymentMethodId(slipType);
    const [insPayment] = await conn.query(
      'INSERT INTO payment (payment_method_id, order_id) VALUES (?, ?)',
      [paymentMethodId, orderId]
    );

    if (slipType === 'credit') {
      await conn.query(
        'INSERT INTO payment_card_evidence (payment_id, trans_ref, card_last4, card_brand) VALUES (?, ?, ?, ?)',
        [insPayment.insertId, null, String(slipImage || ''), 'VISA']
      );
    } else if (slipType === 'qr') {
      await conn.query(
        'INSERT INTO payment_card_evidence (payment_id, trans_ref, card_last4, card_brand) VALUES (?, ?, ?, ?)',
        [insPayment.insertId, slipImage?.transRef || null, null, 'QR']
      );
    }

    // Insert shopping_cart items and customizations
    if (Array.isArray(payload.items)) {
      for (const it of payload.items) {
        const [insCart] = await conn.query(
          'INSERT INTO shopping_cart (order_id, product_id, total_price) VALUES (?, ?, ?)',
          [orderId, it.product_id, it.price_total || 0]
        );
        const shoppingCartId = insCart.insertId;
        const customization = it.customization || {};

        const resolveFlowerIdByName = async (flowerName) => {
          const [rows] = await conn.query('SELECT flower_id FROM flower WHERE flower_name = ? LIMIT 1', [flowerName]);
          return rows.length ? rows[0].flower_id : null;
        };

        const resolveFillerFlowerIdByName = async (flowerName) => {
          const [rows] = await conn.query(
            'SELECT filler_flower_id FROM filler_flower WHERE filler_flower_name = ? LIMIT 1',
            [flowerName]
          );
          return rows.length ? rows[0].filler_flower_id : null;
        };

        if (Array.isArray(customization.mainFlowers) && customization.mainFlowers.length > 0) {
          for (const flowerItem of customization.mainFlowers) {
            let flowerId = Number(flowerItem?.id || 0);
            if (!flowerId && flowerItem?.name) {
              flowerId = Number(await resolveFlowerIdByName(flowerItem.name) || 0);
            }
            const qty = Number(flowerItem?.count || 1);
            if (flowerId > 0) {
              await conn.query(
                'INSERT INTO flower_detail (shopping_cart_id, flower_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)',
                [shoppingCartId, flowerId, qty > 0 ? qty : 1]
              );
            }
          }
        } else if (Array.isArray(it.flowers)) {
          for (const flowerId of it.flowers) {
            await conn.query(
              'INSERT INTO flower_detail (shopping_cart_id, flower_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)',
              [shoppingCartId, flowerId, 1]
            );
          }
        }

        if (customization.fillerFlower) {
          const fillerFlowerId = await resolveFillerFlowerIdByName(customization.fillerFlower);
          if (fillerFlowerId) {
            await conn.query(
              'INSERT INTO filler_flower_detail (shopping_cart_id, filler_flower_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE filler_flower_id = VALUES(filler_flower_id)',
              [shoppingCartId, fillerFlowerId]
            );
          }
        }

        if (customization.wrapperKraftPattern) {
          const [wrappingRows] = await conn.query(
            'SELECT wrapping_id FROM wrapping_material WHERE wrapping_name = ? LIMIT 1',
            [customization.wrapperKraftPattern]
          );
          if (wrappingRows.length > 0) {
            await conn.query(
              'INSERT INTO wrapping_detail (shopping_cart_id, wrapping_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE wrapping_id = VALUES(wrapping_id)',
              [shoppingCartId, wrappingRows[0].wrapping_id]
            );
          }
        }

        if (customization.ribbonStyle) {
          const [ribbonRows] = await conn.query(
            'SELECT ribbon_id FROM ribbon WHERE ribbon_name = ? LIMIT 1',
            [customization.ribbonStyle]
          );
          if (ribbonRows.length > 0) {
            const ribbonId = ribbonRows[0].ribbon_id;
            let ribbonColorId = null;
            if (customization.ribbonColor) {
              const [colorRows] = await conn.query(
                'SELECT ribbon_color_id FROM ribbon_color WHERE ribbon_id = ? AND ribbon_color_name = ? LIMIT 1',
                [ribbonId, customization.ribbonColor]
              );
              if (colorRows.length > 0) {
                ribbonColorId = colorRows[0].ribbon_color_id;
              }
            }

            await conn.query(
              'INSERT INTO ribbon_detail (shopping_cart_id, ribbon_id, ribbon_color_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE ribbon_color_id = VALUES(ribbon_color_id)',
              [shoppingCartId, ribbonId, ribbonColorId]
            );
          }
        }

        if (customization.hasCard && customization.cardTemplate) {
          const [cardRows] = await conn.query('SELECT card_id FROM card WHERE card_name = ? LIMIT 1', [customization.cardTemplate]);
          if (cardRows.length > 0) {
            await conn.query(
              'INSERT INTO card_detail (shopping_cart_id, card_id, message) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE message = VALUES(message)',
              [shoppingCartId, cardRows[0].card_id, customization.cardMessage || null]
            );
          }
        }

        if (customization.vaseShape) {
          const [vaseRows] = await conn.query(
            'SELECT vase_id FROM vase WHERE vase_name = ? AND product_id = ? LIMIT 1',
            [customization.vaseShape, it.product_id]
          );
          if (vaseRows.length > 0) {
            await conn.query(
              'INSERT INTO vase_customization (shopping_cart_id, vase_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE vase_id = VALUES(vase_id)',
              [shoppingCartId, vaseRows[0].vase_id]
            );
          }
        }

        if (customization.monetaryBouquetId && customization.foldingStyleId && customization.moneyAmount) {
          await conn.query(
            'INSERT INTO monetary_bouquet_detail (shopping_cart_id, monetary_bouquet_id, folding_style_id, amount) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE monetary_bouquet_id = VALUES(monetary_bouquet_id), folding_style_id = VALUES(folding_style_id), amount = VALUES(amount)',
            [shoppingCartId, customization.monetaryBouquetId, customization.foldingStyleId, customization.moneyAmount]
          );
        }
      }
    }

    await conn.commit();
    res.json({ order_id: orderId, order_code: orderCode });
  } catch (err) {
    await conn.rollback().catch(() => {});
    console.error('❌ Create Order Error:', err.message);
    res.status(500).json({ error: 'Failed to create order', detail: err.message });
  } finally {
    conn.release();
  }
});

app.post("/check-slips", upload.single("files"), async (req, res) => {
  try {
    const form = new FormData();
    form.append("files", new Blob([req.file.buffer]), req.file.originalname);

    const r = await fetch("https://api.slipok.com/api/line/apikey/51649", {
      method: "POST",
      headers: {
        "x-authorization": "SLIPOKVLZ8JSO",
      },
      body: form,
    });

    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
});

app.post("/check-dupslip", async (req, res) => {
  try {
    const { text } = req.body;

    const [rows] = await pool.query(
      "SELECT 1 FROM payment_card_evidence WHERE trans_ref = ? LIMIT 1",
      [text]
    );

    if (rows.length > 0) {
      // มีข้อมูลแล้ว
      return res.json({ exists: false });
    } else {
      // ยังไม่มี
      return res.json({ exists: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/check-stocks", async (req, res) => {
  try {
    let is_available = true;
    const orders = req.body;
    for (const item of orders.cart) {
      const [rows] = await pool.query(
        "SELECT bp.product_stock_qty FROM branch_product_container bp WHERE product_id = ? AND branch_id = ?",
        [item.productId, orders.selectedBranchId]
      );
      if (!rows.length || rows[0].product_stock_qty <= 0) {
        is_available = false;
        break;
      }
    }
    return res.json({ is_available : is_available });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/orders/search", async (req, res) => {
  
  try {
    const { order_code } = req.body;
    if (!order_code || typeof order_code !== "string") {
      return res.status(400).json({ message: "order_code ไม่ถูกต้อง" });
    }
    
    const [rows] = await pool.execute(
  `
  SELECT 
    o.*,
    b.branch_name,
    oa.receiver_name,
    oa.receiver_phone,
    oa.receiver_address
  FROM orders o
  JOIN branch b ON b.branch_id = o.branch_id
  LEFT JOIN order_address oa ON oa.order_id = o.order_id
  WHERE o.order_code = ?
  `,
  [order_code]
);
    const [carts] = await pool.execute(
      `
  SELECT 
    sc.*,
    pr.product_name,
    pr.product_img,
    pt.product_type_name,
    GROUP_CONCAT(CONCAT('ดอกไม้#', fd.flower_id) ORDER BY fd.flower_id SEPARATOR ', ') AS flowers
  FROM shopping_cart sc
  JOIN product pr ON pr.product_id = sc.product_id
  JOIN product_type pt ON pt.product_type_id = pr.product_type_id
  LEFT JOIN flower_detail fd ON fd.shopping_cart_id = sc.shopping_cart_id
  WHERE sc.order_id = ?
  GROUP BY 
  sc.shopping_cart_id,
  pr.product_name,
  pr.product_img,
  pt.product_type_name,
  sc.total_price;
  `,
      [rows[0].order_id]
    );

    const list = rows;
    if (list.length === 0) {
      return res.status(404).json({ message: "ไม่พบคำสั่งซื้อ" });
    }

    const records = carts.map((row) => ({
      ...row,
      price_total: Number(row.total_price || 0),
      vase_color_name: null,
      bouquet_style_name: null,
      flowers: row.flowers || '-'
    }));

    return res.json({
      message: "พบคำสั่งซื้อ",
      order: list[0],
      records,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});


// Employee login endpoint
app.post('/api/employee/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ message: 'username and password are required' });
    }

    // Query the employee table in the `employee` database. Adjust qualification if your table lives in the same DB as other tables.
    const [rows] = await pool.query(
      'SELECT employee_id, username, password_hash, role_id, branch_id, name, surname FROM `employee` WHERE username = ? LIMIT 1',
      [username]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];

    // Simple password check: compare provided password with stored password_hash value.
    // If your database stores hashed passwords, replace this with the appropriate hash comparison.
    if (user.password_hash !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Respond with minimal user info (avoid returning password hash)
    return res.json({
      success: true,
      employee: {
        employee_id: user.employee_id,
        username: user.username,
        role_id: user.role_id,
        branch_id: user.branch_id,
        name: user.name,
        surname: user.surname,
      },
    });
  } catch (err) {
    console.error('❌ Employee Login Error:', err.message);
    return res.status(500).json({ message: 'Server error', detail: err.message });
  }
});

// Manager Dashboard Stats endpoint
app.get('/api/manager/dashboard-stats/:branchId', async (req, res) => {
  try {
    const { branchId } = req.params;
    const { date_range, product_type_id } = req.query || {};
    const params = [Number(branchId)];

    // Build date condition based on date_range param
    let dateCondition = '';
    const dateParams = [];
    if (date_range === 'today') {
      dateCondition = ' AND DATE(o.created_at) = CURDATE()';
    } else if (date_range === 'yesterday') {
      dateCondition = ' AND DATE(o.created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)';
    } else if (date_range === 'week') {
      dateCondition = ' AND YEARWEEK(o.created_at) = YEARWEEK(CURDATE())';
    } else if (date_range === 'month') {
      dateCondition = ' AND YEAR(o.created_at) = YEAR(CURDATE()) AND MONTH(o.created_at) = MONTH(CURDATE())';
    } else if (date_range === 'year') {
      dateCondition = ' AND YEAR(o.created_at) = YEAR(CURDATE())';
    } else if (date_range && /^\d{4}-\d{2}$/.test(String(date_range))) {
      const [yr, mo] = String(date_range).split('-');
      dateCondition = ' AND YEAR(o.created_at) = ? AND MONTH(o.created_at) = ?';
      dateParams.push(Number(yr), Number(mo));
    }

    // Build product type filter condition
    let productTypeCondition = '';
    const productTypeParams = [];
    if (product_type_id) {
      const ptId = Number(product_type_id);
      if (!Number.isNaN(ptId)) {
        productTypeCondition = ' AND EXISTS (SELECT 1 FROM shopping_cart sc JOIN product pr ON pr.product_id = sc.product_id WHERE pr.product_type_id = ? AND sc.order_id = o.order_id)';
        productTypeParams.push(ptId);
      }
    }

    // Total revenue with date and product type filter
    const revenueSql = `
      SELECT IFNULL(SUM(total_amount), 0) AS total_revenue
      FROM \`order\` o
      WHERE o.branch_id = ?${dateCondition}${productTypeCondition}
    `;
    const revenueParams = [...params, ...dateParams, ...productTypeParams];
    const [[revenueRow]] = await pool.query(revenueSql, revenueParams);

    // Order count with date and product type filter
    const orderCountSql = `
      SELECT COUNT(*) AS total_orders
      FROM \`order\` o
      WHERE o.branch_id = ?${dateCondition}${productTypeCondition}
    `;
    const orderCountParams = [...params, ...dateParams, ...productTypeParams];
    const [[orderCountRow]] = await pool.query(orderCountSql, orderCountParams);

    // Orders in progress (order_status IN 'received', 'preparing', 'shipping') with date and product type filter
    const inProgressSql = `
      SELECT COUNT(*) AS in_progress_orders
      FROM \`order\` o
      WHERE o.branch_id = ?${dateCondition} AND o.order_status IN ('received', 'preparing', 'shipping')${productTypeCondition}
    `;
    const inProgressParams = [...params, ...dateParams, ...productTypeParams];
    const [[inProgressRow]] = await pool.query(inProgressSql, inProgressParams);

    // Available products (total count of products)
    const availableProductsSql = `
      SELECT COUNT(DISTINCT p.product_id) AS available_products
      FROM product p
    `;
    const [[availableProductsRow]] = await pool.query(availableProductsSql);

    return res.json({
      total_revenue: Number(revenueRow.total_revenue) || 0,
      total_orders: Number(orderCountRow.total_orders) || 0,
      in_progress_orders: Number(inProgressRow.in_progress_orders) || 0,
      available_products: Number(availableProductsRow.available_products) || 0
    });
  } catch (err) {
    console.error('❌ Manager Dashboard Stats Error:', err.message);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

app.get("/api/order/branches/:branchId", async (req, res) => {
  try {
    const branchId = req.params.branchId;

    const [r] = await pool.query(
      `SELECT 
        o.order_id,
        o.order_code,
        o.branch_id,
        o.customer_id,
        c.customer_name,
        c.phone,
        o.total_amount,
        o.order_status,
        o.created_at,
        o.customer_note,
        pm.payment_method_name
      FROM \`order\` o
      JOIN customer c ON o.customer_id = c.customer_id
      LEFT JOIN payment p ON o.order_id = p.order_id
      LEFT JOIN payment_method pm ON p.payment_method_id = pm.payment_method_id
      WHERE o.branch_id = ?
      ORDER BY o.created_at DESC`,
      [branchId]
    );

    res.json(r);

  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});



app.listen(PORT, () => console.log(`✅ API listening on http://localhost:${PORT}`));

// Update order status (by order_id or order_code)
app.put('/api/order/:orderIdentifier/status', async (req, res) => {
  try {
    const { orderIdentifier } = req.params;
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ message: 'status is required' });

    // Try to treat identifier as numeric order_id, otherwise use order_code
    const maybeId = Number(orderIdentifier);
    let result;
    if (!Number.isNaN(maybeId)) {
      [result] = await pool.query('UPDATE `order` SET order_status = ? WHERE order_id = ?', [status, maybeId]);
    } else {
      [result] = await pool.query('UPDATE `order` SET order_status = ? WHERE order_code = ?', [status, orderIdentifier]);
    }

    return res.json({ success: true, changedRows: result.affectedRows || 0, status });
  } catch (err) {
    console.error('❌ Update order status error:', err);
    return res.status(500).json({ message: 'Server error', detail: err.message });
  }
});

// Executive login endpoint
app.post('/api/executive/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ message: 'username and password are required' });
    }

    const [rows] = await pool.query(
      'SELECT executive_id, username, password_hash, name, surname, phone FROM `executive` WHERE username = ? LIMIT 1',
      [username]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    if (user.password_hash !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    return res.json({
      success: true,
      executive: {
        executive_id: user.executive_id,
        username: user.username,
        name: user.name,
        surname: user.surname,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error('❌ Executive Login Error:', err.message);
    return res.status(500).json({ message: 'Server error', detail: err.message });
  }
});

// Executive overview: totals for current year, branch list and customer count
app.get('/api/executive/overview', async (req, res) => {
  try {
    // Support optional filters via query params: start_date, end_date, branch_ids (csv), branch_names (csv), product_type
    const { start_date, end_date, branch_ids, branch_names, product_type } = req.query || {};
    const dateCondition = (field = 'created_at') => {
      if (start_date && end_date) return `(DATE(${field}) BETWEEN ? AND ?)`;
      return `YEAR(${field}) = YEAR(CURDATE())`;
    };
    // Total revenue this year
    // Build params and query conditions
    const params = [];
    let branchFilterSqlOrder = '';
    let branchFilterSqlO = '';
    if (branch_ids) {
      const ids = String(branch_ids).split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n));
      if (ids.length) {
        branchFilterSqlOrder = ` AND branch_id IN (${ids.map(() => '?').join(',')})`;
        branchFilterSqlO = ` AND o.branch_id IN (${ids.map(() => '?').join(',')})`;
        params.push(...ids);
      }
    } else if (branch_names) {
      const names = String(branch_names).split(',').map(s => s.trim()).filter(Boolean);
      if (names.length) {
        branchFilterSqlOrder = ` AND branch_id IN (SELECT branch_id FROM branch WHERE branch_name IN (${names.map(() => '?').join(',')}))`;
        branchFilterSqlO = ` AND o.branch_id IN (SELECT branch_id FROM branch WHERE branch_name IN (${names.map(() => '?').join(',')}))`;
        params.push(...names);
      }
    }

    // Add product_type filter for revenue and orders queries
    let productFilterSql = '';
    let productFilterParams = [];
    if (product_type) {
      const asNum = Number(product_type);
      if (!Number.isNaN(asNum)) {
        productFilterSql = ` AND EXISTS (SELECT 1 FROM shopping_cart sc JOIN product pr ON pr.product_id = sc.product_id WHERE pr.product_type_id = ? AND sc.order_id = o.order_id)`;
        productFilterParams = [asNum];
      } else {
        productFilterSql = ` AND EXISTS (SELECT 1 FROM shopping_cart sc JOIN product pr ON pr.product_id = sc.product_id JOIN product_type pt ON pt.product_type_id = pr.product_type_id WHERE pt.product_type_name = ? AND sc.order_id = o.order_id)`;
        productFilterParams = [String(product_type)];
      }
    }

    const revSql = `SELECT IFNULL(SUM(total_amount),0) AS total_revenue FROM \`order\` o WHERE ${dateCondition('o.created_at')}${branchFilterSqlOrder}${productFilterSql}`;
    const revParams = start_date && end_date ? [start_date, end_date, ...params, ...productFilterParams] : [...params, ...productFilterParams];
    const [[revRow]] = await pool.query(revSql, revParams);

    // Total orders this year
    const ordersSql = `SELECT COUNT(*) AS total_orders FROM \`order\` o WHERE ${dateCondition('o.created_at')}${branchFilterSqlOrder}${productFilterSql}`;
    const ordersParams = start_date && end_date ? [start_date, end_date, ...params, ...productFilterParams] : [...params, ...productFilterParams];
    const [[ordersRow]] = await pool.query(ordersSql, ordersParams);

    // Branch count and list
    const [branches] = await pool.query(`SELECT branch_id, branch_name FROM branch ORDER BY branch_name`);

    // Customer count
    const [[custRow]] = await pool.query(`SELECT COUNT(*) AS customer_count FROM customer`);

    // Per-branch performance this year
    // Aggregate orders/revenue in a subquery first to avoid duplication when joining employees
    // Per-branch performance with same filters
    const branchPerfSql = `SELECT b.branch_id, b.branch_name,
              COALESCE(oa.orders,0) AS orders,
              COALESCE(oa.revenue,0) AS revenue,
              COUNT(DISTINCT emp.employee_id) AS employee_count
       FROM branch b
       LEFT JOIN (
         SELECT branch_id, COUNT(*) AS orders, SUM(total_amount) AS revenue
         FROM \`order\` o
         WHERE ${dateCondition('o.created_at')}${branchFilterSqlOrder}${productFilterSql}
         GROUP BY branch_id
       ) oa ON oa.branch_id = b.branch_id
       LEFT JOIN employee emp ON emp.branch_id = b.branch_id
       GROUP BY b.branch_id, b.branch_name, oa.orders, oa.revenue
       ORDER BY revenue DESC`;
    const branchPerfParams = start_date && end_date ? [start_date, end_date, ...params, ...productFilterParams] : [...params, ...productFilterParams];
    const [branchPerf] = await pool.query(branchPerfSql, branchPerfParams);

    // Top branch (highest revenue)
     const topBranchSql = `SELECT b.branch_id, b.branch_name, IFNULL(SUM(o.total_amount),0) AS revenue
       FROM \`order\` o
       JOIN branch b ON b.branch_id = o.branch_id
       WHERE ${dateCondition('o.created_at')}${branchFilterSqlO}${productFilterSql}
       GROUP BY b.branch_id, b.branch_name
       ORDER BY revenue DESC
       LIMIT 1`;
     const topBranchParams = start_date && end_date ? [start_date, end_date, ...params, ...productFilterParams] : [...params, ...productFilterParams];
     const [topBranchRows] = await pool.query(topBranchSql, topBranchParams);

    // Top flower (most sold) based on flower_detail linked to shopping_cart within current year orders
     const topFlowerSql = `SELECT ft.flower_name, COUNT(*) AS qty
       FROM shopping_cart sc
       JOIN \`order\` o ON sc.order_id = o.order_id
       JOIN product pr ON pr.product_id = sc.product_id
       JOIN flower_detail fd ON fd.shopping_cart_id = sc.shopping_cart_id
       JOIN flower_type ft ON ft.flower_type_id = fd.flower_type_id
       WHERE ${dateCondition('o.created_at')}${branchFilterSqlO}${productFilterSql}
       GROUP BY ft.flower_type_id, ft.flower_name
       ORDER BY qty DESC
       LIMIT 1`;
     const topFlowerParams = start_date && end_date ? [start_date, end_date, ...params, ...productFilterParams] : [...params, ...productFilterParams];
     const [topFlowerRows] = await pool.query(topFlowerSql, topFlowerParams);

    return res.json({
      total_revenue: Number(revRow.total_revenue) || 0,
      total_orders: Number(ordersRow.total_orders) || 0,
      customer_count: Number(custRow.customer_count) || 0,
      branches,
      branch_performance: branchPerf,
      top_branch: topBranchRows[0] || null,
      top_flower: topFlowerRows[0] || null
    });
  } catch (err) {
    console.error('❌ Executive overview error:', err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// Monthly revenue for current year (returns array with month numbers and revenue)
app.get('/api/executive/monthly-revenue', async (req, res) => {
  try {
    const { start_date, end_date, branch_ids, branch_names, product_type } = req.query || {};
    const params = [];
    let branchFilterSql = '';
    if (branch_ids) {
      const ids = String(branch_ids).split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n));
      if (ids.length) {
        branchFilterSql = ` AND branch_id IN (${ids.map(() => '?').join(',')})`;
        params.push(...ids);
      }
    } else if (branch_names) {
      const names = String(branch_names).split(',').map(s => s.trim()).filter(Boolean);
      if (names.length) {
        branchFilterSql = ` AND branch_id IN (SELECT branch_id FROM branch WHERE branch_name IN (${names.map(() => '?').join(',')}))`;
        params.push(...names);
      }
    }

    const dateCondition = (field = 'created_at') => {
      if (start_date && end_date) return `(DATE(${field}) BETWEEN ? AND ?)`;
      return `YEAR(${field}) = YEAR(CURDATE())`;
    };

    // Add product_type filter
    let productFilterSqlMonth = '';
    let productFilterParamsMonth = [];
    if (product_type) {
      const asNum = Number(product_type);
      if (!Number.isNaN(asNum)) {
        productFilterSqlMonth = ` AND EXISTS (SELECT 1 FROM shopping_cart sc JOIN product pr ON pr.product_id = sc.product_id WHERE pr.product_type_id = ? AND sc.order_id = o.order_id)`;
        productFilterParamsMonth = [asNum];
      } else {
        productFilterSqlMonth = ` AND EXISTS (SELECT 1 FROM shopping_cart sc JOIN product pr ON pr.product_id = sc.product_id JOIN product_type pt ON pt.product_type_id = pr.product_type_id WHERE pt.product_type_name = ? AND sc.order_id = o.order_id)`;
        productFilterParamsMonth = [String(product_type)];
      }
    }

    const sql = `SELECT MONTH(created_at) AS month, IFNULL(SUM(total_amount),0) AS revenue
       FROM \`order\` o
       WHERE ${dateCondition('o.created_at')}${branchFilterSql}${productFilterSqlMonth}
       GROUP BY MONTH(created_at)
       ORDER BY MONTH(created_at)`;
    const sqlParams = start_date && end_date ? [start_date, end_date, ...params, ...productFilterParamsMonth] : [...params, ...productFilterParamsMonth];
    const [rows] = await pool.query(sql, sqlParams);

    // Build full 12-month array (1..12) with zeros for missing months
    const months = Array.from({ length: 12 }, (_v, i) => ({ month: i + 1, revenue: 0 }));
    for (const r of rows) {
      const m = Number(r.month);
      if (m >= 1 && m <= 12) months[m - 1].revenue = Number(r.revenue);
    }

    return res.json(months);
  } catch (err) {
    console.error('❌ Monthly revenue error:', err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// Category / Product sales for current year (returns product_name, revenue, percent)
app.get('/api/executive/category-sales', async (req, res) => {
  try {
    const { start_date, end_date, branch_ids, branch_names, product_type } = req.query || {};
    const params = [];
    let branchFilterSql = '';
    if (branch_ids) {
      const ids = String(branch_ids).split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n));
      if (ids.length) {
        branchFilterSql = ` AND o.branch_id IN (${ids.map(() => '?').join(',')})`;
        params.push(...ids);
      }
    } else if (branch_names) {
      const names = String(branch_names).split(',').map(s => s.trim()).filter(Boolean);
      if (names.length) {
        branchFilterSql = ` AND o.branch_id IN (SELECT branch_id FROM branch WHERE branch_name IN (${names.map(() => '?').join(',')}))`;
        params.push(...names);
      }
    }

    let productFilterSql = '';
    if (product_type) {
      // accept either product_type id or name
      const asNum = Number(product_type);
      if (!Number.isNaN(asNum)) {
        productFilterSql = ` AND pr.product_type_id = ?`;
        params.push(asNum);
      } else {
        productFilterSql = ` AND pt.product_type_name = ?`;
        params.push(String(product_type));
      }
    }

    const dateCondition = (field = 'o.created_at') => {
      if (start_date && end_date) return `(${field} BETWEEN ? AND ?)`;
      return `YEAR(${field}) = YEAR(CURDATE())`;
    };

    const sql = `SELECT pr.product_id,
              pr.product_name,
              pt.product_type_name AS product_type,
              IFNULL(SUM(sc.price_total),0) AS revenue
       FROM shopping_cart sc
       JOIN product pr ON pr.product_id = sc.product_id
       LEFT JOIN product_type pt ON pt.product_type_id = pr.product_type_id
       JOIN \`order\` o ON o.order_id = sc.order_id
       WHERE ${dateCondition('o.created_at')}${branchFilterSql}${productFilterSql}
       GROUP BY pr.product_id, pr.product_name, pt.product_type_name
       ORDER BY revenue DESC`;

    const sqlParams = start_date && end_date ? [start_date, end_date, ...params] : params;
    const [rows] = await pool.query(sql, sqlParams);

    const total = rows.reduce((s, r) => s + Number(r.revenue || 0), 0);
    const mapped = rows.map(r => ({
      product_id: r.product_id,
      product_name: r.product_name,
      product_type: r.product_type || null,
      revenue: Number(r.revenue || 0),
      percent: total > 0 ? (Number(r.revenue || 0) / total) * 100 : 0
    }));

    return res.json({ total, items: mapped });
  } catch (err) {
    console.error('❌ Category sales error:', err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// Weekly sales for manager dashboard (last 7 days)
app.get('/api/manager/weekly-sales/:branchId', async (req, res) => {
  try {
    const { branchId } = req.params;
    const params = [Number(branchId)];

    const sql = `
      SELECT DATE(o.created_at) AS date, IFNULL(SUM(o.total_amount),0) AS sales
      FROM \`order\` o
      WHERE o.branch_id = ? AND DATE(o.created_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(o.created_at)
      ORDER BY DATE(o.created_at)
    `;

    const [rows] = await pool.query(sql, params);

    // Build full 7-day list (from 6 days ago -> today) and fill missing days with 0
    const results = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const found = rows.find(r => String(r.date) === iso);
      results.push({ date: iso, sales: found ? Number(found.sales) : 0 });
    }

    return res.json(results);
  } catch (err) {
    console.error('❌ Weekly sales error:', err.message);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// Top selling products for a branch
app.get('/api/manager/top-products/:branchId', async (req, res) => {
  try {
    const { branchId } = req.params;
    const { date_range, product_type_id } = req.query || {};
    const params = [Number(branchId)];

    // Build date condition based on date_range param
    let dateCondition = '';
    const dateParams = [];
    if (date_range === 'today') {
      dateCondition = ' AND DATE(o.created_at) = CURDATE()';
    } else if (date_range === 'yesterday') {
      dateCondition = ' AND DATE(o.created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)';
    } else if (date_range === 'week') {
      dateCondition = ' AND YEARWEEK(o.created_at) = YEARWEEK(CURDATE())';
    } else if (date_range === 'month') {
      dateCondition = ' AND YEAR(o.created_at) = YEAR(CURDATE()) AND MONTH(o.created_at) = MONTH(CURDATE())';
    } else if (date_range === 'year') {
      dateCondition = ' AND YEAR(o.created_at) = YEAR(CURDATE())';
    } else if (date_range && /^\d{4}-\d{2}$/.test(String(date_range))) {
      const [yr, mo] = String(date_range).split('-');
      dateCondition = ' AND YEAR(o.created_at) = ? AND MONTH(o.created_at) = ?';
      dateParams.push(Number(yr), Number(mo));
    }

    // Build product type filter condition
    let productTypeCondition = '';
    const productTypeParams = [];
    if (product_type_id) {
      const ptId = Number(product_type_id);
      if (!Number.isNaN(ptId)) {
        productTypeCondition = ' AND pr.product_type_id = ?';
        productTypeParams.push(ptId);
      }
    }

    const sql = `
      SELECT pr.product_id,
             pr.product_name,
             IFNULL(SUM(sc.qty),0) AS qty_sold,
             IFNULL(SUM(sc.qty * sc.price_total),0) AS revenue,
             pt.product_type_name AS product_type
      FROM shopping_cart sc
      JOIN \`order\` o ON sc.order_id = o.order_id
      JOIN product pr ON pr.product_id = sc.product_id
      LEFT JOIN product_type pt ON pt.product_type_id = pr.product_type_id
      WHERE o.branch_id = ?${dateCondition}${productTypeCondition}
      GROUP BY pr.product_id, pr.product_name, pt.product_type_name
      ORDER BY qty_sold DESC
      LIMIT 10
    `;

    const queryParams = [...params, ...dateParams, ...productTypeParams];
    const [rows] = await pool.query(sql, queryParams);
    return res.json(rows);
  } catch (err) {
    console.error('❌ Top products error:', err.message);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// Order date info for a branch (min/max and months available)
app.get('/api/order/date-info/:branchId', async (req, res) => {
  try {
    const { branchId } = req.params;
    const params = [Number(branchId)];

    const [minmaxRows] = await pool.query(
      `SELECT MIN(DATE(created_at)) AS min_date, MAX(DATE(created_at)) AS max_date FROM \`order\` WHERE branch_id = ?`,
      params
    );

    const [monthsRows] = await pool.query(
      `SELECT YEAR(created_at) AS y, MONTH(created_at) AS m, COUNT(*) AS cnt
       FROM \`order\`
       WHERE branch_id = ?
       GROUP BY YEAR(created_at), MONTH(created_at)
       ORDER BY YEAR(created_at) DESC, MONTH(created_at) DESC`,
      params
    );

    const min_date = minmaxRows[0]?.min_date || null;
    const max_date = minmaxRows[0]?.max_date || null;

    const months = monthsRows.map((r) => ({ year: r.y, month: r.m, count: r.cnt }));

    return res.json({ min_date, max_date, months });
  } catch (err) {
    console.error('❌ Date info error:', err.message);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});