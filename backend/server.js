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

// Flower types
app.get('/api/flower-types', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT flower_type_id AS flower_id, flower_name FROM flower_type ORDER BY flower_name');
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

app.get('/api/customers/points', async (req, res) => {
  try {
    const normalizedPhone = String(req.query.phone || '').replace(/\D/g, '');
    if (!normalizedPhone) {
      return res.status(400).json({ error: 'phone is required' });
    }

    const [rows] = await pool.query(
      `
      SELECT points
      FROM customer
      WHERE REPLACE(REPLACE(REPLACE(phone, '-', ''), ' ', ''), '+', '') = ?
      ORDER BY customer_id DESC
      LIMIT 1
      `,
      [normalizedPhone]
    );

    const points = rows.length ? Number(rows[0].points || 0) : 0;
    res.json({
      phone: normalizedPhone,
      points: Number.isFinite(points) ? Math.max(0, Math.floor(points)) : 0,
    });
  } catch (err) {
    console.error('❌ Customer Points API Error:', err.message);
    res.status(500).json({ error: 'Failed to load customer points', detail: err.message });
  }
});

// Create order (transactional)
app.post('/api/orders', async (req, res) => {
  const payload = req.body || {};
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Generate unique order code ORD########
    const genOrderCode = async () => {
      while (true) {
        const n = Math.floor(10000000 + Math.random() * 90000000);
        const code = `ORD${n}`;
        const [r] = await conn.query('SELECT 1 FROM `order` WHERE order_code = ?', [code]);
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

    // Insert or find customer by phone
    const customer = payload.customer || {};
    let customerId = null;
    if (customer.phone) {
      const [found] = await conn.query('SELECT customer_id FROM customer WHERE phone = ? LIMIT 1', [customer.phone]);
      if (found.length > 0) customerId = found[0].customer_id;
    }
    if (!customerId) {
      const [insCust] = await conn.query('INSERT INTO customer (customer_name, phone, points) VALUES (?, ?, ?)', [customer.name || null, customer.phone || null, (payload.total_amount/100)]);
      customerId = insCust.insertId;
    }

    // province for address
    // let provinceId = null;
    // if (payload.receiver && payload.receiver.province_id) provinceId = payload.receiver.province_id;
    // else {
       const [p] = await conn.query('SELECT province_id FROM province WHERE province_id = ?', [payload.branch_id]);
       provinceId = p.length ? p[0].province_id : null;
    // }

    // Insert customer_address
    const receiver = payload.receiver || {};
    await conn.query(
      'INSERT INTO customer_address (customer_id, province_id, receiver_name, receiver_phone, receiver_address) VALUES (?, ?, ?, ?, ?)',
      [customerId, provinceId, receiver.name || customer.name || null, receiver.phone || customer.phone || null, receiver.address || (payload.pickup ? 'ที่ร้าน' : null)]
    );

    // Insert order
    const [insOrder] = await conn.query(
      'INSERT INTO `order` (branch_id, customer_id, promotion_id, customer_note, order_code, order_status, total_amount, florist_photo_url, rider_photo_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [branchId, customerId, payload.promotion_id || null, payload.customer_note || null, orderCode, 'received', payload.total_amount || 0, null, null]
    );
    const orderId = insOrder.insertId;
    
    // Insert payment if provided
    if (payload.payment) {
      // use provided slip_image or generate a random placeholder filename
      const slipImage = payload.payment;
      const slipType = payload.method;
      if (slipType === 'cash') {
        await conn.query('INSERT INTO payment (payment_method_id,order_id) VALUES (?,?)', [1, orderId]);
      } else if (slipType === 'credit') {
         const [insPayment] = await conn.query('INSERT INTO payment (payment_method_id,order_id) VALUES (?,?)', [3, orderId]);
         await conn.query('INSERT INTO payment_card_evidence (payment_id, trans_ref, card_last4, card_brand, created_at) VALUES (?, ?, ?, ?, NOW())', [insPayment.insertId, "23asd", slipImage, "Visa"]);
      } else {
        const [insPayment] = await conn.query('INSERT INTO payment (payment_method_id,order_id) VALUES (?,?)', [2, orderId]);
        await conn.query('INSERT INTO payment_evidence (payment_id, trans_ref, sender_name, bank, slip_time, raw_response, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())', [insPayment.insertId, slipImage.transRef, slipImage.sender.displayName, slipImage.sendingBank, slipImage.transTimestamp, JSON.stringify(slipImage)]);
      }
      
    }

    // Insert shopping_cart items and customizations
    if (Array.isArray(payload.items)) {
      for (const it of payload.items) {
        const [insCart] = await conn.query('INSERT INTO shopping_cart (order_id, product_id, qty, price_total) VALUES (?, ?, ?, ?)', [orderId, it.product_id, it.qty || 1, it.price_total || 0]);
        await conn.query('UPDATE branch_container SET stock_qty = stock_qty - 1, is_available = CASE WHEN stock_qty - 1 <= 0 THEN 0 ELSE 1 END WHERE branch_id = ? AND product_id = ?', [branchId, it.product_id]);
        const shoppingCartId = insCart.insertId;
        if (it.bouquet_style_id) {
          await conn.query('INSERT INTO bouquet_customization (shopping_cart_id, bouquet_style_id) VALUES (?, ?)', [shoppingCartId, it.bouquet_style_id]);
        }
        if (it.vase_color_id) {
          await conn.query('INSERT INTO vase_customization (shopping_cart_id, vase_color_id) VALUES (?, ?)', [shoppingCartId, it.vase_color_id]);
        }
        if (Array.isArray(it.flowers)) {
          for (const ftId of it.flowers) {
            await conn.query('INSERT INTO flower_detail (shopping_cart_id, flower_type_id) VALUES (?, ?)', [shoppingCartId, ftId]);
          }
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
    ca.receiver_name,
    ca.receiver_phone,
    ca.receiver_address
  FROM \`order\` o
  JOIN branch b ON b.branch_id = o.branch_id
  JOIN customer_address ca ON ca.customer_id = o.customer_id
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
    GROUP_CONCAT(ft.flower_name ORDER BY ft.flower_name SEPARATOR ', ') AS flowers,
    vco.vase_color_name,
    bst.bouquet_style_name

  FROM \`shopping_cart\` sc
  JOIN product pr ON pr.product_id = sc.product_id
  JOIN product_type pt ON pt.product_type_id = pr.product_type_id
  LEFT JOIN flower_detail fd ON fd.shopping_cart_id = sc.shopping_cart_id
  LEFT JOIN flower_type ft ON ft.flower_type_id = fd.flower_type_id
  LEFT JOIN vase_customization vc ON vc.shopping_cart_id = sc.shopping_cart_id
  LEFT JOIN vase_color vco ON vco.vase_color_id = vc.vase_color_id
  LEFT JOIN bouquet_customization bc ON bc.shopping_cart_id = sc.shopping_cart_id
  LEFT JOIN bouquet_style bst ON bst.bouquet_style_id = bc.bouquet_style_id
  WHERE sc.order_id = ?
  GROUP BY 
  sc.shopping_cart_id,
  pr.product_name;
  `,
      [rows[0].order_id]
    );

    const list = rows;
    if (list.length === 0) {
      return res.status(404).json({ message: "ไม่พบคำสั่งซื้อ" });
    }

    return res.json({
      message: "พบคำสั่งซื้อ",
      order: list[0],
      records: carts,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
});

app.post("/check-dupslip", async (req, res) => {
  try {
    const { text } = req.body;

    const [rows] = await pool.query(
      "SELECT 1 FROM payment_evidence WHERE trans_ref = ? LIMIT 1",
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
    const is_available = true;
    const orders = req.body;
    for (const item of orders.cart) {
      //console.log(`สินค้าชิ้นที่ ${index + 1}:`, item.productId,`สาขาที่ :`, orders.selectedBranchId);
      const [rows] = await pool.query(
        "SELECT bp.stock_qty FROM branch_container bp WHERE product_id = ? AND branch_id = ?",
        [item.productId, orders.selectedBranchId]
      );
      if (rows[0].stock_qty <= 0) {
        is_available = false;
      }
      
      // console.log(`ผลลัพธ์สินค้าคงเหลือที่:`, rows[0].stock_qty);
      // if (rows[0].stock_qty <= 0) {
      //   is_available = false;
      //   break
      // }
      };
    return res.json({ is_available : is_available });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
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