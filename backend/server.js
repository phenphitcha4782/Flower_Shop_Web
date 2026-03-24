require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;


const multer = require("multer");
const { is } = require('express/lib/request');

const upload = multer(); // memory storage

const floristUploadDir = path.join(__dirname, 'uploads', 'florist');
fs.mkdirSync(floristUploadDir, { recursive: true });
const riderUploadDir = path.join(__dirname, 'uploads', 'rider');
fs.mkdirSync(riderUploadDir, { recursive: true });

const floristPhotoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, floristUploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const safeExt = ext || '.jpg';
      cb(null, `florist_${Date.now()}_${Math.round(Math.random() * 1e9)}${safeExt}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image files are allowed'));
  },
});

const riderPhotoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, riderUploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const safeExt = ext || '.jpg';
      cb(null, `rider_${Date.now()}_${Math.round(Math.random() * 1e9)}${safeExt}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image files are allowed'));
  },
});

// Enable CORS
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
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

const getExistingColumnName = async (tableName, candidateNames) => {
  for (const columnName of candidateNames) {
    const [rows] = await pool.query(
      `SHOW COLUMNS FROM ${tableName} LIKE ?`,
      [columnName]
    );
    if (Array.isArray(rows) && rows.length > 0) {
      return columnName;
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

// All products (for manager product management page)
app.get('/api/products', async (_req, res) => {
  try {
    const productCostColumn = await getExistingColumnName('product', ['cost_price', 'product_cost_price']);
    const productSellColumn = await getExistingColumnName('product', ['product_price', 'sell_price', 'price']);

    const [rows] = await pool.query(
      `
      SELECT
        p.product_id,
        p.product_name,
        ${productSellColumn ? `p.\`${productSellColumn}\`` : '0'} AS product_price,
        ${productCostColumn ? `p.\`${productCostColumn}\`` : (productSellColumn ? `p.\`${productSellColumn}\`` : '0')} AS cost_price,
        p.product_img,
        p.product_type_id,
        pt.product_type_name
      FROM product p
      LEFT JOIN product_type pt ON pt.product_type_id = p.product_type_id
      ORDER BY p.product_name
      `
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ Products API Error:', err.message);
    res.status(500).json({ error: 'Failed to load products', detail: err.message });
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

// All vase shapes (for manager product management page)
app.get('/api/vase-shapes/all', async (_req, res) => {
  try {
    const costColumn = await getExistingColumnName('vase', ['cost_price', 'vase_cost_price']);
    const sellColumn = await getExistingColumnName('vase', ['vase_price', 'sell_price', 'price']);

    const [rows] = await pool.query(
      `
      SELECT
        vase_id,
        product_id,
        vase_name,
        vase_img,
        ${sellColumn ? `\`${sellColumn}\`` : '0'} AS vase_price,
        ${costColumn ? `\`${costColumn}\`` : (sellColumn ? `\`${sellColumn}\`` : '0')} AS cost_price
      FROM vase
      ORDER BY vase_name
      `
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ All Vase Shapes API Error:', err.message);
    res.status(500).json({ error: 'Failed to load all vase shapes', detail: err.message });
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
    const nameColumn = await getExistingColumnName('flower', ['flower_name', 'name']);
    const priceColumn = await getExistingColumnName('flower', ['flower_price', 'price', 'sell_price']);
    const costColumn = await getExistingColumnName('flower', ['cost_price', 'flower_cost_price']);
    const imageColumn = await getExistingColumnName('flower', ['flower_img', 'image', 'img', 'flower_image_url']);
    const importDateColumn = await getExistingColumnName('flower', ['import_date', 'date_imported', 'imported_at', 'received_date', 'entry_date', 'created_at']);
    const expiryDateColumn = await getExistingColumnName('flower', ['expiry_date', 'expire_date', 'expiration_date', 'expired_at', 'best_before']);

    const nameSelectSql = nameColumn ? nameColumn : "CONCAT('ดอกหลัก #', flower_id)";
    const priceSelectSql = priceColumn ? priceColumn : '0';
    const costSelectSql = costColumn ? costColumn : '0';
    const imageSelectSql = imageColumn ? imageColumn : 'NULL';
    const importDateSelectSql = importDateColumn ? importDateColumn : 'NULL';
    const expiryDateSelectSql = expiryDateColumn ? expiryDateColumn : 'NULL';

    const [rows] = await pool.query(
      `
      SELECT
        flower_id,
        ${nameSelectSql} AS flower_name,
        ${priceSelectSql} AS flower_price,
        ${costSelectSql} AS cost_price,
        ${imageSelectSql} AS flower_img,
        ${importDateSelectSql} AS import_date,
        ${expiryDateSelectSql} AS expiry_date
      FROM flower
      ORDER BY flower_name
      `
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ Main Flowers API Error:', err.message);
    res.status(500).json({ error: 'Failed to load main flowers', detail: err.message });
  }
});

// Filler flowers (from filler_flower table)
app.get('/api/filler-flowers', async (_req, res) => {
  try {
    const nameColumn = await getExistingColumnName('filler_flower', ['filler_flower_name', 'flower_name', 'name']);
    const priceColumn = await getExistingColumnName('filler_flower', ['filler_flower_price', 'flower_price', 'price', 'sell_price']);
    const costColumn = await getExistingColumnName('filler_flower', ['cost_price', 'filler_flower_cost_price']);
    const imageColumn = await getExistingColumnName('filler_flower', ['filler_flower_img', 'flower_img', 'image', 'img', 'filler_image_url']);
    const importDateColumn = await getExistingColumnName('filler_flower', ['import_date', 'date_imported', 'imported_at', 'received_date', 'entry_date', 'created_at']);
    const expiryDateColumn = await getExistingColumnName('filler_flower', ['expiry_date', 'expire_date', 'expiration_date', 'expired_at', 'best_before']);

    const nameSelectSql = nameColumn ? nameColumn : "CONCAT('ดอกแซม #', filler_flower_id)";
    const priceSelectSql = priceColumn ? priceColumn : '0';
    const costSelectSql = costColumn ? costColumn : (priceColumn ? priceColumn : '0');
    const imageSelectSql = imageColumn ? imageColumn : 'NULL';
    const importDateSelectSql = importDateColumn ? importDateColumn : 'NULL';
    const expiryDateSelectSql = expiryDateColumn ? expiryDateColumn : 'NULL';

    const [rows] = await pool.query(
      `
      SELECT
        filler_flower_id AS flower_id,
        ${nameSelectSql} AS flower_name,
        ${priceSelectSql} AS flower_price,
        ${costSelectSql} AS cost_price,
        ${imageSelectSql} AS filler_flower_img,
        ${imageSelectSql} AS flower_img,
        ${importDateSelectSql} AS import_date,
        ${expiryDateSelectSql} AS expiry_date
      FROM filler_flower
      ORDER BY flower_name
      `
    );
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

// Update flower price (main flowers)
app.put('/api/main-flowers/:flowerId', async (req, res) => {
  try {
    const flowerId = Number(req.params.flowerId || 0);
    const { costPrice, sellPrice } = req.body;
    if (!Number.isFinite(flowerId) || flowerId <= 0) {
      return res.status(400).json({ error: 'Invalid flower ID' });
    }

    const priceColumn = await getExistingColumnName('flower', ['flower_price', 'price', 'sell_price']);
    const costColumn = await getExistingColumnName('flower', ['cost_price', 'flower_cost_price']);
    
    console.log(`📝 Updating flower ${flowerId}: sellPrice=${sellPrice}, costPrice=${costPrice}, priceColumn=${priceColumn}, costColumn=${costColumn}`);

    const updates = [];
    const values = [];

    if (Number.isFinite(sellPrice)) {
      if (priceColumn) {
        updates.push(`\`${priceColumn}\` = ?`);
        values.push(sellPrice);
      }
    }

    if (Number.isFinite(costPrice)) {
      if (costColumn) {
        updates.push(`\`${costColumn}\` = ?`);
        values.push(costPrice);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid price fields to update' });
    }

    values.push(flowerId);
    const sql = `UPDATE flower SET ${updates.join(', ')} WHERE flower_id = ?`;
    await pool.query(sql, values);

    res.json({ success: true, flowerId, costPrice, sellPrice });
  } catch (err) {
    console.error('❌ Update Main Flower Price Error:', err.message);
    res.status(500).json({ error: 'Failed to update flower price', detail: err.message });
  }
});

// Update filler flower price
app.put('/api/filler-flowers/:flowerId', async (req, res) => {
  try {
    const flowerId = Number(req.params.flowerId || 0);
    const { costPrice, sellPrice } = req.body;
    if (!Number.isFinite(flowerId) || flowerId <= 0) {
      return res.status(400).json({ error: 'Invalid filler flower ID' });
    }

    const priceColumn = await getExistingColumnName('filler_flower', ['filler_flower_price', 'flower_price', 'price', 'sell_price']);
    const costColumn = await getExistingColumnName('filler_flower', ['cost_price', 'filler_flower_cost_price']);

    const updates = [];
    const values = [];

    if (Number.isFinite(sellPrice)) {
      if (priceColumn) {
        updates.push(`\`${priceColumn}\` = ?`);
        values.push(sellPrice);
      }
    }

    if (Number.isFinite(costPrice)) {
      if (costColumn) {
        updates.push(`\`${costColumn}\` = ?`);
        values.push(costPrice);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid price fields to update' });
    }

    values.push(flowerId);
    const sql = `UPDATE filler_flower SET ${updates.join(', ')} WHERE filler_flower_id = ?`;
    await pool.query(sql, values);

    res.json({ success: true, flowerId, costPrice, sellPrice });
  } catch (err) {
    console.error('❌ Update Filler Flower Price Error:', err.message);
    res.status(500).json({ error: 'Failed to update filler flower price', detail: err.message });
  }
});

// Update vase price
app.put('/api/vases/:vaseId', async (req, res) => {
  try {
    const vaseId = Number(req.params.vaseId || 0);
    const { costPrice, sellPrice } = req.body;
    if (!Number.isFinite(vaseId) || vaseId <= 0) {
      return res.status(400).json({ error: 'Invalid vase ID' });
    }

    const priceColumn = await getExistingColumnName('vase', ['vase_price', 'sell_price', 'price']);
    const costColumn = await getExistingColumnName('vase', ['cost_price', 'vase_cost_price']);

    const updates = [];
    const values = [];

    if (Number.isFinite(sellPrice) && priceColumn) {
      updates.push(`\`${priceColumn}\` = ?`);
      values.push(sellPrice);
    }

    if (Number.isFinite(costPrice) && costColumn) {
      updates.push(`\`${costColumn}\` = ?`);
      values.push(costPrice);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid price fields to update' });
    }

    values.push(vaseId);
    await pool.query(`UPDATE vase SET ${updates.join(', ')} WHERE vase_id = ?`, values);

    res.json({ success: true, vaseId, costPrice, sellPrice });
  } catch (err) {
    console.error('❌ Update Vase Price Error:', err.message);
    res.status(500).json({ error: 'Failed to update vase price', detail: err.message });
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
    const costColumn = await getExistingColumnName('card', ['cost_price', 'card_cost_price']);
    const sellColumn = await getExistingColumnName('card', ['card_price', 'sell_price', 'price']);

    const [rows] = await pool.query(
      `
      SELECT
        card_id,
        card_name,
        card_img,
        ${sellColumn ? `\`${sellColumn}\`` : '0'} AS card_price,
        ${costColumn ? `\`${costColumn}\`` : (sellColumn ? `\`${sellColumn}\`` : '0')} AS cost_price
      FROM card
      ORDER BY card_name
      `
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ Cards API Error:', err.message);
    res.status(500).json({ error: 'Failed to load cards', detail: err.message });
  }
});

// Update card price
app.put('/api/cards/:cardId', async (req, res) => {
  try {
    const cardId = Number(req.params.cardId || 0);
    const { costPrice, sellPrice } = req.body;
    if (!Number.isFinite(cardId) || cardId <= 0) {
      return res.status(400).json({ error: 'Invalid card ID' });
    }

    const priceColumn = await getExistingColumnName('card', ['card_price', 'sell_price', 'price']);
    const costColumn = await getExistingColumnName('card', ['cost_price', 'card_cost_price']);

    const updates = [];
    const values = [];

    if (Number.isFinite(sellPrice) && priceColumn) {
      updates.push(`\`${priceColumn}\` = ?`);
      values.push(sellPrice);
    }

    if (Number.isFinite(costPrice) && costColumn) {
      updates.push(`\`${costColumn}\` = ?`);
      values.push(costPrice);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid price fields to update' });
    }

    values.push(cardId);
    await pool.query(`UPDATE card SET ${updates.join(', ')} WHERE card_id = ?`, values);

    res.json({ success: true, cardId, costPrice, sellPrice });
  } catch (err) {
    console.error('❌ Update Card Price Error:', err.message);
    res.status(500).json({ error: 'Failed to update card price', detail: err.message });
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

    const imageColumn = await getExistingColumnName(wrappingTable, [
      'wrapping_material_img',
      'wrapping_img',
      'image',
      'img',
      'material_img',
    ]);

    const [rows] = await pool.query(
      `
      SELECT
        wrapping_id,
        wrapping_type_id,
        wrapping_name,
        ${imageColumn ? `${imageColumn} AS wrapping_material_img, ${imageColumn} AS wrapping_img` : 'NULL AS wrapping_material_img, NULL AS wrapping_img'},
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

// All wrappings (for manager product management page)
app.get('/api/wrappings/all', async (_req, res) => {
  try {
    const wrappingTable = await getExistingTableName(['wrapping_material', 'wrapping']);
    if (!wrappingTable) {
      return res.status(404).json({ error: 'Wrapping material table not found' });
    }

    const imageColumn = await getExistingColumnName(wrappingTable, [
      'wrapping_material_img',
      'wrapping_img',
      'image',
      'img',
      'material_img',
    ]);
    const costColumn = await getExistingColumnName(wrappingTable, ['cost_price', 'wrapping_cost_price']);
    const sellColumn = await getExistingColumnName(wrappingTable, ['wrapping_price', 'sell_price', 'price']);

    const [rows] = await pool.query(
      `
      SELECT
        wrapping_id,
        wrapping_type_id,
        wrapping_name,
        ${imageColumn ? `${imageColumn} AS wrapping_material_img, ${imageColumn} AS wrapping_img` : 'NULL AS wrapping_material_img, NULL AS wrapping_img'},
        ${sellColumn ? `\`${sellColumn}\`` : '0'} AS wrapping_price,
        ${costColumn ? `\`${costColumn}\`` : (sellColumn ? `\`${sellColumn}\`` : '0')} AS cost_price
      FROM ${wrappingTable}
      ORDER BY wrapping_name
      `
    );

    res.json(rows);
  } catch (err) {
    console.error('❌ All Wrappings API Error:', err.message);
    res.status(500).json({ error: 'Failed to load all wrapping materials', detail: err.message });
  }
});

// Update wrapping price
app.put('/api/wrappings/:wrappingId', async (req, res) => {
  try {
    const wrappingId = Number(req.params.wrappingId || 0);
    const { costPrice, sellPrice } = req.body;
    if (!Number.isFinite(wrappingId) || wrappingId <= 0) {
      return res.status(400).json({ error: 'Invalid wrapping ID' });
    }

    const wrappingTable = await getExistingTableName(['wrapping_material', 'wrapping']);
    if (!wrappingTable) {
      return res.status(404).json({ error: 'Wrapping material table not found' });
    }

    const priceColumn = await getExistingColumnName(wrappingTable, ['wrapping_price', 'sell_price', 'price']);
    const costColumn = await getExistingColumnName(wrappingTable, ['cost_price', 'wrapping_cost_price']);

    const updates = [];
    const values = [];

    if (Number.isFinite(sellPrice) && priceColumn) {
      updates.push(`\`${priceColumn}\` = ?`);
      values.push(sellPrice);
    }

    if (Number.isFinite(costPrice) && costColumn) {
      updates.push(`\`${costColumn}\` = ?`);
      values.push(costPrice);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid price fields to update' });
    }

    values.push(wrappingId);
    await pool.query(`UPDATE ${wrappingTable} SET ${updates.join(', ')} WHERE wrapping_id = ?`, values);

    res.json({ success: true, wrappingId, costPrice, sellPrice });
  } catch (err) {
    console.error('❌ Update Wrapping Price Error:', err.message);
    res.status(500).json({ error: 'Failed to update wrapping price', detail: err.message });
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

    const costColumn = await getExistingColumnName('ribbon_color', ['cost_price', 'ribbon_color_cost_price', 'ribbon_cost_price']);
    const sellColumn = await getExistingColumnName('ribbon_color', ['ribbon_color_price', 'ribbon_price', 'sell_price', 'price']);

    const [rows] = await pool.query(
      `
      SELECT
        ribbon_color_id,
        ribbon_id,
        ribbon_color_name,
        ${sellColumn ? `\`${sellColumn}\`` : '0'} AS ribbon_price,
        ${costColumn ? `\`${costColumn}\`` : (sellColumn ? `\`${sellColumn}\`` : '0')} AS cost_price
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

// Update ribbon color price
app.put('/api/ribbon-colors/:ribbonColorId', async (req, res) => {
  try {
    const ribbonColorId = Number(req.params.ribbonColorId || 0);
    const { costPrice, sellPrice } = req.body;
    if (!Number.isFinite(ribbonColorId) || ribbonColorId <= 0) {
      return res.status(400).json({ error: 'Invalid ribbon color ID' });
    }

    const priceColumn = await getExistingColumnName('ribbon_color', ['ribbon_color_price', 'ribbon_price', 'sell_price', 'price']);
    const costColumn = await getExistingColumnName('ribbon_color', ['cost_price', 'ribbon_color_cost_price', 'ribbon_cost_price']);

    const updates = [];
    const values = [];

    if (Number.isFinite(sellPrice) && priceColumn) {
      updates.push(`\`${priceColumn}\` = ?`);
      values.push(sellPrice);
    }

    if (Number.isFinite(costPrice) && costColumn) {
      updates.push(`\`${costColumn}\` = ?`);
      values.push(costPrice);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid price fields to update' });
    }

    values.push(ribbonColorId);
    await pool.query(`UPDATE ribbon_color SET ${updates.join(', ')} WHERE ribbon_color_id = ?`, values);

    res.json({ success: true, ribbonColorId, costPrice, sellPrice });
  } catch (err) {
    console.error('❌ Update Ribbon Color Price Error:', err.message);
    res.status(500).json({ error: 'Failed to update ribbon color price', detail: err.message });
  }
});

const resolveBranchStockConfig = async (sourceRaw) => {
  const source = String(sourceRaw || '').trim().toLowerCase();
  const sourceMap = {
    product: {
      tableCandidates: ['branch_product_container'],
      itemColumnCandidates: ['product_id'],
      stockColumnCandidates: ['product_stock_qty'],
      supportsDates: false,
    },
    vase: {
      tableCandidates: ['branch_vase_container', 'branch_product_container'],
      itemColumnCandidates: ['vase_id', 'product_id'],
      stockColumnCandidates: ['vase_stock_qty', 'product_stock_qty'],
      supportsDates: false,
    },
    card: {
      tableCandidates: ['branch_card_container'],
      itemColumnCandidates: ['card_id'],
      stockColumnCandidates: ['card_stock_qty'],
      supportsDates: false,
    },
    flower: {
      tableCandidates: ['branch_flower_container'],
      itemColumnCandidates: ['flower_id'],
      stockColumnCandidates: ['flower_stock_qty'],
      supportsDates: true,
    },
    filler_flower: {
      tableCandidates: ['branch_filler_container'],
      itemColumnCandidates: ['filler_flower_id'],
      stockColumnCandidates: ['filler_flower_stock_qty'],
      supportsDates: true,
    },
    wrapping: {
      tableCandidates: ['branch_wrapping_container'],
      itemColumnCandidates: ['wrapping_id'],
      stockColumnCandidates: ['wrapping_stock_qty'],
      supportsDates: false,
    },
    ribbon: {
      tableCandidates: ['branch_ribbon_container'],
      itemColumnCandidates: ['ribbon_color_id', 'ribbon_id'],
      stockColumnCandidates: ['ribbon_stock_qty'],
      supportsDates: false,
    },
  };

  const base = sourceMap[source];
  if (!base) return null;

  const tableName = await getExistingTableName(base.tableCandidates);
  if (!tableName) return null;

  const itemColumn = await getExistingColumnName(tableName, base.itemColumnCandidates);
  const stockColumn = await getExistingColumnName(tableName, base.stockColumnCandidates);
  const branchColumn = await getExistingColumnName(tableName, ['branch_id']);
  const isActiveColumn = await getExistingColumnName(tableName, ['is_active']);
  const receivedDateColumn = base.supportsDates
    ? await getExistingColumnName(tableName, ['received_date', 'import_date'])
    : null;
  const expiryDateColumn = base.supportsDates
    ? await getExistingColumnName(tableName, ['expiry_date'])
    : null;
  const ribbonIdColumn = source === 'ribbon'
    ? await getExistingColumnName(tableName, ['ribbon_id'])
    : null;

  if (!itemColumn || !stockColumn || !branchColumn) return null;

  return {
    source,
    tableName,
    itemColumn,
    stockColumn,
    branchColumn,
    isActiveColumn,
    receivedDateColumn,
    expiryDateColumn,
    ribbonIdColumn,
  };
};

const getPrimaryKeyColumn = async (tableName) => {
  const [rows] = await pool.query(`SHOW COLUMNS FROM ${tableName}`);
  const pkRow = (Array.isArray(rows) ? rows : []).find((row) => String(row.Key || '').toUpperCase() === 'PRI');
  return pkRow ? String(pkRow.Field || '') : null;
};

const sanitizePositiveInt = (value, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const normalized = Math.floor(parsed);
  return normalized > 0 ? normalized : fallback;
};

const addStockRequirement = (bucket, source, itemId, qty, label) => {
  const normalizedItemId = sanitizePositiveInt(itemId);
  const normalizedQty = sanitizePositiveInt(qty);
  if (!normalizedItemId || !normalizedQty) {
    return;
  }

  const key = `${source}:${normalizedItemId}`;
  const existing = bucket.get(key);
  if (existing) {
    existing.quantity += normalizedQty;
    return;
  }

  bucket.set(key, {
    source,
    itemId: normalizedItemId,
    quantity: normalizedQty,
    label: String(label || `${source} #${normalizedItemId}`),
  });
};

const resolveOrderStockRequirements = async (conn, rawItems) => {
  const requirementMap = new Map();
  const items = Array.isArray(rawItems) ? rawItems : [];

  const flowerByNameCache = new Map();
  const fillerByNameCache = new Map();
  const wrappingByNameCache = new Map();
  const cardByNameCache = new Map();
  const ribbonByNameCache = new Map();
  const ribbonColorByKeyCache = new Map();
  const vaseByNameAndProductCache = new Map();

  const resolveFlowerIdByName = async (flowerName) => {
    const key = String(flowerName || '').trim().toLowerCase();
    if (!key) return null;
    if (flowerByNameCache.has(key)) return flowerByNameCache.get(key);
    const [rows] = await conn.query('SELECT flower_id FROM flower WHERE flower_name = ? LIMIT 1', [flowerName]);
    const resolvedId = Array.isArray(rows) && rows.length > 0 ? sanitizePositiveInt(rows[0].flower_id) : null;
    flowerByNameCache.set(key, resolvedId || null);
    return resolvedId || null;
  };

  const resolveFillerIdByName = async (fillerName) => {
    const key = String(fillerName || '').trim().toLowerCase();
    if (!key) return null;
    if (fillerByNameCache.has(key)) return fillerByNameCache.get(key);
    const [rows] = await conn.query(
      'SELECT filler_flower_id FROM filler_flower WHERE filler_flower_name = ? LIMIT 1',
      [fillerName]
    );
    const resolvedId = Array.isArray(rows) && rows.length > 0 ? sanitizePositiveInt(rows[0].filler_flower_id) : null;
    fillerByNameCache.set(key, resolvedId || null);
    return resolvedId || null;
  };

  const resolveWrappingIdByName = async (wrappingName) => {
    const key = String(wrappingName || '').trim().toLowerCase();
    if (!key) return null;
    if (wrappingByNameCache.has(key)) return wrappingByNameCache.get(key);
    const [rows] = await conn.query(
      'SELECT wrapping_id FROM wrapping_material WHERE wrapping_name = ? LIMIT 1',
      [wrappingName]
    );
    const resolvedId = Array.isArray(rows) && rows.length > 0 ? sanitizePositiveInt(rows[0].wrapping_id) : null;
    wrappingByNameCache.set(key, resolvedId || null);
    return resolvedId || null;
  };

  const resolveCardIdByName = async (cardName) => {
    const key = String(cardName || '').trim().toLowerCase();
    if (!key) return null;
    if (cardByNameCache.has(key)) return cardByNameCache.get(key);
    const [rows] = await conn.query('SELECT card_id FROM card WHERE card_name = ? LIMIT 1', [cardName]);
    const resolvedId = Array.isArray(rows) && rows.length > 0 ? sanitizePositiveInt(rows[0].card_id) : null;
    cardByNameCache.set(key, resolvedId || null);
    return resolvedId || null;
  };

  const resolveRibbonIds = async (ribbonName, ribbonColorName) => {
    const ribbonKey = String(ribbonName || '').trim().toLowerCase();
    if (!ribbonKey) {
      return { ribbonId: null, ribbonColorId: null };
    }

    let ribbonId = ribbonByNameCache.get(ribbonKey);
    if (!ribbonByNameCache.has(ribbonKey)) {
      const [ribbonRows] = await conn.query('SELECT ribbon_id FROM ribbon WHERE ribbon_name = ? LIMIT 1', [ribbonName]);
      ribbonId = Array.isArray(ribbonRows) && ribbonRows.length > 0 ? sanitizePositiveInt(ribbonRows[0].ribbon_id) : null;
      ribbonByNameCache.set(ribbonKey, ribbonId || null);
    }

    if (!ribbonId) {
      return { ribbonId: null, ribbonColorId: null };
    }

    const colorKey = `${ribbonId}:${String(ribbonColorName || '').trim().toLowerCase()}`;
    if (ribbonColorByKeyCache.has(colorKey)) {
      return { ribbonId, ribbonColorId: ribbonColorByKeyCache.get(colorKey) || null };
    }

    let ribbonColorId = null;
    if (ribbonColorName) {
      const [colorRows] = await conn.query(
        'SELECT ribbon_color_id FROM ribbon_color WHERE ribbon_id = ? AND ribbon_color_name = ? LIMIT 1',
        [ribbonId, ribbonColorName]
      );
      ribbonColorId = Array.isArray(colorRows) && colorRows.length > 0
        ? sanitizePositiveInt(colorRows[0].ribbon_color_id)
        : null;
    }

    ribbonColorByKeyCache.set(colorKey, ribbonColorId || null);
    return { ribbonId, ribbonColorId: ribbonColorId || null };
  };

  const resolveVaseIdByNameAndProduct = async (vaseName, productId) => {
    const nameKey = String(vaseName || '').trim().toLowerCase();
    const productKey = sanitizePositiveInt(productId);
    if (!nameKey) return null;

    const cacheKey = `${nameKey}:${productKey || 0}`;
    if (vaseByNameAndProductCache.has(cacheKey)) {
      return vaseByNameAndProductCache.get(cacheKey);
    }

    let rows = [];
    if (productKey > 0) {
      const [matchedRows] = await conn.query(
        'SELECT vase_id FROM vase WHERE vase_name = ? AND product_id = ? LIMIT 1',
        [vaseName, productKey]
      );
      rows = Array.isArray(matchedRows) ? matchedRows : [];
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      const [fallbackRows] = await conn.query('SELECT vase_id FROM vase WHERE vase_name = ? LIMIT 1', [vaseName]);
      rows = Array.isArray(fallbackRows) ? fallbackRows : [];
    }

    const resolvedId = rows.length > 0 ? sanitizePositiveInt(rows[0].vase_id) : null;
    vaseByNameAndProductCache.set(cacheKey, resolvedId || null);
    return resolvedId || null;
  };

  for (const item of items) {
    const qty = sanitizePositiveInt(item?.qty, 1);
    const productId = sanitizePositiveInt(item?.product_id || item?.productId);
    const customization = item?.customization || {};

    if (productId > 0) {
      addStockRequirement(requirementMap, 'product', productId, qty, `สินค้า #${productId}`);
    }

    if (Array.isArray(customization.mainFlowers) && customization.mainFlowers.length > 0) {
      for (const flowerItem of customization.mainFlowers) {
        let flowerId = sanitizePositiveInt(flowerItem?.id);
        if (!flowerId && flowerItem?.name) {
          flowerId = sanitizePositiveInt(await resolveFlowerIdByName(flowerItem.name));
        }
        const flowerQty = sanitizePositiveInt(flowerItem?.count, 1) * qty;
        if (flowerId > 0) {
          addStockRequirement(requirementMap, 'flower', flowerId, flowerQty, String(flowerItem?.name || `ดอกไม้ #${flowerId}`));
        }
      }
    } else if (Array.isArray(item?.flowers) && item.flowers.length > 0) {
      for (const flowerIdRaw of item.flowers) {
        const flowerId = sanitizePositiveInt(flowerIdRaw);
        if (flowerId > 0) {
          addStockRequirement(requirementMap, 'flower', flowerId, qty, `ดอกไม้ #${flowerId}`);
        }
      }
    }

    if (customization.fillerFlower) {
      const fillerId = sanitizePositiveInt(await resolveFillerIdByName(customization.fillerFlower));
      if (fillerId > 0) {
        addStockRequirement(requirementMap, 'filler_flower', fillerId, qty, String(customization.fillerFlower));
      }
    }

    if (customization.wrapperKraftPattern) {
      const wrappingId = sanitizePositiveInt(await resolveWrappingIdByName(customization.wrapperKraftPattern));
      if (wrappingId > 0) {
        addStockRequirement(requirementMap, 'wrapping', wrappingId, qty, String(customization.wrapperKraftPattern));
      }
    }

    if (customization.ribbonStyle) {
      const { ribbonId, ribbonColorId } = await resolveRibbonIds(customization.ribbonStyle, customization.ribbonColor);
      if (ribbonColorId > 0) {
        addStockRequirement(
          requirementMap,
          'ribbon',
          ribbonColorId,
          qty,
          `${String(customization.ribbonStyle)} ${String(customization.ribbonColor || '')}`.trim()
        );
      } else if (ribbonId > 0) {
        addStockRequirement(requirementMap, 'ribbon', ribbonId, qty, String(customization.ribbonStyle));
      }
    }

    if (customization.hasCard && customization.cardTemplate) {
      const cardId = sanitizePositiveInt(await resolveCardIdByName(customization.cardTemplate));
      if (cardId > 0) {
        addStockRequirement(requirementMap, 'card', cardId, qty, String(customization.cardTemplate));
      }
    }

    if (customization.vaseShape) {
      const vaseId = sanitizePositiveInt(await resolveVaseIdByNameAndProduct(customization.vaseShape, productId));
      if (vaseId > 0) {
        addStockRequirement(requirementMap, 'vase', vaseId, qty, String(customization.vaseShape));
      }
    }
  }

  return Array.from(requirementMap.values());
};

const getStockAvailabilityForRequirements = async (conn, branchIdRaw, requirements, options = {}) => {
  const branchId = sanitizePositiveInt(branchIdRaw);
  const forUpdate = Boolean(options.forUpdate);
  const normalizedRequirements = Array.isArray(requirements) ? requirements : [];
  const insufficient = [];
  const entries = [];

  for (const requirement of normalizedRequirements) {
    const config = await resolveBranchStockConfig(requirement.source);
    if (!config) {
      continue;
    }

    const primaryKeyColumn = await getPrimaryKeyColumn(config.tableName);
    const selectedColumns = [];
    if (primaryKeyColumn) {
      selectedColumns.push(`${primaryKeyColumn} AS row_id`);
    }
    selectedColumns.push(`COALESCE(${config.stockColumn}, 0) AS stock_qty`);
    if (config.receivedDateColumn) {
      selectedColumns.push(`${config.receivedDateColumn} AS received_date`);
    }
    if (config.expiryDateColumn) {
      selectedColumns.push(`${config.expiryDateColumn} AS expiry_date`);
    }

    const whereClauses = [`${config.branchColumn} = ?`, `${config.itemColumn} = ?`];
    const queryParams = [branchId, requirement.itemId];
    if (config.isActiveColumn) {
      whereClauses.push(`COALESCE(${config.isActiveColumn}, 1) = 1`);
    }
    if (config.expiryDateColumn) {
      whereClauses.push(`(${config.expiryDateColumn} IS NULL OR ${config.expiryDateColumn} >= CURDATE())`);
    }

    const orderClauses = [];
    if (config.expiryDateColumn) {
      orderClauses.push(`${config.expiryDateColumn} IS NULL`, `${config.expiryDateColumn} ASC`);
    }
    if (config.receivedDateColumn) {
      orderClauses.push(`${config.receivedDateColumn} ASC`);
    }
    if (primaryKeyColumn) {
      orderClauses.push(`${primaryKeyColumn} ASC`);
    }

    const lockClause = forUpdate ? ' FOR UPDATE' : '';
    const [stockRows] = await conn.query(
      `
      SELECT ${selectedColumns.join(', ')}
      FROM ${config.tableName}
      WHERE ${whereClauses.join(' AND ')}
      ${orderClauses.length > 0 ? `ORDER BY ${orderClauses.join(', ')}` : ''}
      ${lockClause}
      `,
      queryParams
    );

    const rows = Array.isArray(stockRows)
      ? stockRows.map((row) => ({
          rowId: sanitizePositiveInt(row.row_id),
          stockQty: Number(row.stock_qty || 0),
          receivedDate: row.received_date || null,
          expiryDate: row.expiry_date || null,
        }))
      : [];
    const available = rows.reduce((sum, row) => sum + Math.max(0, Number(row.stockQty || 0)), 0);

    const entry = {
      requirement,
      config: {
        ...config,
        primaryKeyColumn,
      },
      rows,
      available,
    };
    entries.push(entry);

    if (available < requirement.quantity) {
      insufficient.push({
        source: requirement.source,
        itemId: requirement.itemId,
        label: requirement.label,
        requiredQty: requirement.quantity,
        availableQty: available,
      });
    }
  }

  return {
    isAvailable: insufficient.length === 0,
    insufficient,
    entries,
  };
};

const applyStockDeductions = async (conn, branchIdRaw, stockEntries) => {
  const branchId = sanitizePositiveInt(branchIdRaw);
  for (const entry of stockEntries) {
    let remaining = sanitizePositiveInt(entry?.requirement?.quantity);
    if (remaining <= 0) continue;

    const config = entry.config;
    const rows = Array.isArray(entry.rows) ? entry.rows : [];

    for (const row of rows) {
      if (remaining <= 0) break;

      const rowStock = Math.max(0, Number(row.stockQty || 0));
      if (rowStock <= 0) continue;

      const deductQty = Math.min(rowStock, remaining);
      if (deductQty <= 0) continue;

      let result;
      if (config.primaryKeyColumn && row.rowId > 0) {
        [result] = await conn.query(
          `
          UPDATE ${config.tableName}
          SET ${config.stockColumn} = ${config.stockColumn} - ?
          WHERE ${config.primaryKeyColumn} = ?
            AND COALESCE(${config.stockColumn}, 0) >= ?
          `,
          [deductQty, row.rowId, deductQty]
        );
      } else {
        const fallbackWhere = [`${config.branchColumn} = ?`, `${config.itemColumn} = ?`, `COALESCE(${config.stockColumn}, 0) >= ?`];
        const fallbackParams = [branchId, entry.requirement.itemId, deductQty];
        if (config.isActiveColumn) {
          fallbackWhere.push(`COALESCE(${config.isActiveColumn}, 1) = 1`);
        }
        [result] = await conn.query(
          `
          UPDATE ${config.tableName}
          SET ${config.stockColumn} = ${config.stockColumn} - ?
          WHERE ${fallbackWhere.join(' AND ')}
          LIMIT 1
          `,
          [deductQty, ...fallbackParams]
        );
      }

      if (!result || Number(result.affectedRows || 0) === 0) {
        throw new Error(`ตัดสต๊อกไม่สำเร็จสำหรับ ${entry.requirement.label}`);
      }

      remaining -= deductQty;
    }

    if (remaining > 0) {
      throw new Error(`สต๊อกไม่พอสำหรับ ${entry.requirement.label}`);
    }
  }
};

app.post('/api/branches/:branchId/stock/check', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const branchId = sanitizePositiveInt(req.params.branchId);
    if (!branchId) {
      return res.status(400).json({ isAvailable: false, message: 'branchId ไม่ถูกต้อง' });
    }

    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (items.length === 0) {
      return res.json({ isAvailable: true, insufficient: [] });
    }

    const requirements = await resolveOrderStockRequirements(conn, items);
    const stockCheck = await getStockAvailabilityForRequirements(conn, branchId, requirements, { forUpdate: false });

    if (!stockCheck.isAvailable) {
      return res.json({
        isAvailable: false,
        message: 'สาขานี้มีสินค้าบางรายการไม่เพียงพอ',
        insufficient: stockCheck.insufficient,
      });
    }

    return res.json({
      isAvailable: true,
      insufficient: [],
    });
  } catch (err) {
    console.error('❌ Branch Stock Check API Error:', err.message);
    return res.status(500).json({
      isAvailable: false,
      message: 'ตรวจสอบสต๊อกไม่สำเร็จ',
      detail: err.message,
    });
  } finally {
    conn.release();
  }
});

app.get('/api/manager/branch-stocks/:branchId', async (req, res) => {
  try {
    const branchId = Number(req.params.branchId);
    if (!Number.isFinite(branchId) || branchId <= 0) {
      return res.status(400).json({ error: 'invalid branchId' });
    }

    const sources = ['product', 'vase', 'card', 'flower', 'filler_flower', 'wrapping', 'ribbon'];
    const result = {};

    for (const source of sources) {
      const config = await resolveBranchStockConfig(source);
      if (!config) {
        result[source] = [];
        continue;
      }

      const activeFilter = config.isActiveColumn
        ? ` AND COALESCE(${config.isActiveColumn}, 1) = 1`
        : '';

      const [rows] = await pool.query(
        `
        SELECT
          ${config.itemColumn} AS item_id,
          COALESCE(${config.stockColumn}, 0) AS stock_qty,
          ${config.receivedDateColumn ? config.receivedDateColumn : 'NULL'} AS received_date,
          ${config.expiryDateColumn ? config.expiryDateColumn : 'NULL'} AS expiry_date
        FROM ${config.tableName}
        WHERE ${config.branchColumn} = ?${activeFilter}
        `,
        [branchId]
      );

      result[source] = Array.isArray(rows)
        ? rows.map((row) => ({
            item_id: Number(row.item_id || 0),
            stock_qty: Number(row.stock_qty || 0),
            received_date: row.received_date || null,
            expiry_date: row.expiry_date || null,
          }))
        : [];
    }

    return res.json(result);
  } catch (err) {
    console.error('❌ Branch stocks API Error:', err.message);
    return res.status(500).json({ error: 'Failed to load branch stocks', detail: err.message });
  }
});

app.put('/api/manager/branch-stocks/:branchId', async (req, res) => {
  try {
    const branchId = Number(req.params.branchId);
    const source = String(req.body?.source || '').trim().toLowerCase();
    const itemId = Number(req.body?.item_id);
    const stockQty = Number(req.body?.stock_qty);
    const receivedDate = req.body?.received_date || null;
    const expiryDate = req.body?.expiry_date || null;

    if (!Number.isFinite(branchId) || branchId <= 0) {
      return res.status(400).json({ error: 'invalid branchId' });
    }
    if (!source) {
      return res.status(400).json({ error: 'source is required' });
    }
    if (!Number.isFinite(itemId) || itemId <= 0) {
      return res.status(400).json({ error: 'item_id is required' });
    }
    if (!Number.isFinite(stockQty) || stockQty < 0) {
      return res.status(400).json({ error: 'stock_qty must be >= 0' });
    }

    const config = await resolveBranchStockConfig(source);
    if (!config) {
      return res.status(400).json({ error: `unsupported source: ${source}` });
    }

    const [existingRows] = await pool.query(
      `
      SELECT 1
      FROM ${config.tableName}
      WHERE ${config.branchColumn} = ? AND ${config.itemColumn} = ?
      LIMIT 1
      `,
      [branchId, itemId]
    );

    let resolvedRibbonId = null;
    if (source === 'ribbon' && config.ribbonIdColumn && config.itemColumn === 'ribbon_color_id') {
      const colorRibbonIdColumn = await getExistingColumnName('ribbon_color', ['ribbon_id']);
      if (colorRibbonIdColumn) {
        const [ribbonRows] = await pool.query(
          `SELECT ${colorRibbonIdColumn} AS ribbon_id FROM ribbon_color WHERE ribbon_color_id = ? LIMIT 1`,
          [itemId]
        );
        resolvedRibbonId = Number(ribbonRows?.[0]?.ribbon_id || 0) || null;
      }
    }

    if (Array.isArray(existingRows) && existingRows.length > 0) {
      const updateClauses = [`${config.stockColumn} = ?`];
      const updateParams = [Math.trunc(stockQty)];

      if (config.receivedDateColumn) {
        updateClauses.push(`${config.receivedDateColumn} = ?`);
        updateParams.push(receivedDate || null);
      }
      if (config.expiryDateColumn) {
        updateClauses.push(`${config.expiryDateColumn} = ?`);
        updateParams.push(expiryDate || null);
      }
      if (config.ribbonIdColumn && resolvedRibbonId) {
        updateClauses.push(`${config.ribbonIdColumn} = ?`);
        updateParams.push(resolvedRibbonId);
      }
      if (config.isActiveColumn) {
        updateClauses.push(`${config.isActiveColumn} = 1`);
      }

      updateParams.push(branchId, itemId);

      await pool.query(
        `
        UPDATE ${config.tableName}
        SET ${updateClauses.join(', ')}
        WHERE ${config.branchColumn} = ? AND ${config.itemColumn} = ?
        `,
        updateParams
      );
    } else {
      const insertColumns = [config.branchColumn, config.itemColumn, config.stockColumn];
      const insertValues = [branchId, itemId, Math.trunc(stockQty)];

      if (config.receivedDateColumn) {
        insertColumns.push(config.receivedDateColumn);
        insertValues.push(receivedDate || null);
      }
      if (config.expiryDateColumn) {
        insertColumns.push(config.expiryDateColumn);
        insertValues.push(expiryDate || null);
      }
      if (config.ribbonIdColumn && resolvedRibbonId) {
        insertColumns.push(config.ribbonIdColumn);
        insertValues.push(resolvedRibbonId);
      }
      if (config.isActiveColumn) {
        insertColumns.push(config.isActiveColumn);
        insertValues.push(1);
      }

      const placeholders = insertColumns.map(() => '?').join(', ');
      await pool.query(
        `INSERT INTO ${config.tableName} (${insertColumns.join(', ')}) VALUES (${placeholders})`,
        insertValues
      );
    }

    return res.json({
      ok: true,
      source,
      branch_id: branchId,
      item_id: itemId,
      stock_qty: Math.trunc(stockQty),
      received_date: config.receivedDateColumn ? (receivedDate || null) : null,
      expiry_date: config.expiryDateColumn ? (expiryDate || null) : null,
    });
  } catch (err) {
    console.error('❌ Update branch stock API Error:', err.message);
    return res.status(500).json({ error: 'Failed to update branch stock', detail: err.message });
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

app.put('/api/customers/profile', async (req, res) => {
  try {
    const payload = req.body || {};
    const normalizedPhone = String(payload.phone || '').replace(/\D/g, '');
    if (!normalizedPhone) {
      return res.status(400).json({ error: 'phone is required' });
    }

    const [customerRows] = await pool.query(
      `
      SELECT customer_id
      FROM customer
      WHERE REPLACE(REPLACE(REPLACE(phone, '-', ''), ' ', ''), '+', '') = ?
      ORDER BY customer_id DESC
      LIMIT 1
      `,
      [normalizedPhone]
    );

    if (!Array.isArray(customerRows) || customerRows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customerId = Number(customerRows[0].customer_id);
    const firstName = String(payload.first_name || '-').trim() || '-';
    const lastName = String(payload.last_name || '-').trim() || '-';
    const emailRaw = String(payload.email || '').trim();
    const email = emailRaw || null;
    const profileImageUrlRaw = String(payload.profile_image_url || '').trim();
    const profileImageUrl = profileImageUrlRaw || null;

    const rawDate = String(payload.date_of_birth || '').trim();
    const dateOfBirth = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : null;

    const genderNameRaw = String(payload.gender_name || '').trim();
    let genderId = null;
    if (genderNameRaw) {
      const normalizedGenderName = genderNameRaw === 'อื่น ๆ' ? 'ไม่ระบุ' : genderNameRaw;
      const [genderRows] = await pool.query(
        'SELECT gender_id FROM gender WHERE gender_name = ? LIMIT 1',
        [normalizedGenderName]
      );
      if (Array.isArray(genderRows) && genderRows.length > 0) {
        genderId = Number(genderRows[0].gender_id);
      }
    }

    await pool.query(
      `
      UPDATE customer
      SET
        customer_name = ?,
        customer_surname = ?,
        email = ?,
        gender_id = ?,
        date_of_birth = ?,
        profile_image_url = ?
      WHERE customer_id = ?
      `,
      [firstName, lastName, email, genderId, dateOfBirth, profileImageUrl, customerId]
    );

    const [updatedRows] = await pool.query(
      `
      SELECT
        c.customer_id,
        c.customer_name,
        c.customer_surname,
        c.email,
        c.phone,
        c.gender_id,
        g.gender_name,
        c.date_of_birth,
        c.profile_image_url,
        c.total_point,
        c.member_level_id,
        ml.member_level_name
      FROM customer c
      LEFT JOIN gender g ON g.gender_id = c.gender_id
      LEFT JOIN member_level ml ON ml.member_level_id = c.member_level_id
      WHERE c.customer_id = ?
      LIMIT 1
      `,
      [customerId]
    );

    const updated = updatedRows?.[0] || {};
    return res.json({
      customer_id: Number(updated.customer_id || customerId),
      customer_name: updated.customer_name || '-',
      customer_surname: updated.customer_surname || '-',
      email: updated.email || null,
      phone: updated.phone || normalizedPhone,
      gender_id: updated.gender_id ? Number(updated.gender_id) : null,
      gender_name: updated.gender_name || null,
      date_of_birth: updated.date_of_birth || null,
      profile_image_url: updated.profile_image_url || null,
      points: Math.max(0, Math.floor(Number(updated.total_point || 0))),
      member_level_id: Number(updated.member_level_id || 1),
      member_level_name: updated.member_level_name || `ระดับ ${Number(updated.member_level_id || 1)}`,
    });
  } catch (err) {
    console.error('❌ Update Customer Profile API Error:', err.message);
    return res.status(500).json({ error: 'Failed to update customer profile', detail: err.message });
  }
});

app.get('/api/customers/dashboard', async (req, res) => {
  try {
    const normalizedPhone = String(req.query.phone || '').replace(/\D/g, '');
    if (!normalizedPhone) {
      return res.status(400).json({ error: 'phone is required' });
    }

    const [customerRows] = await pool.query(
      `
      SELECT
        c.customer_id,
        c.customer_name,
        c.customer_surname,
        c.email,
        c.phone,
        c.gender_id,
        g.gender_name,
        c.date_of_birth,
        c.profile_image_url,
        c.total_point,
        c.created_at,
        c.member_level_id,
        ml.member_level_name
      FROM customer c
      LEFT JOIN gender g ON g.gender_id = c.gender_id
      LEFT JOIN member_level ml ON ml.member_level_id = c.member_level_id
      WHERE REPLACE(REPLACE(REPLACE(c.phone, '-', ''), ' ', ''), '+', '') = ?
      ORDER BY c.customer_id DESC
      LIMIT 1
      `,
      [normalizedPhone]
    );

    if (!Array.isArray(customerRows) || customerRows.length === 0) {
      return res.json({
        profile: {
          customer_id: null,
          first_name: '-',
          last_name: '-',
          email: null,
          phone: normalizedPhone,
          gender_name: null,
          date_of_birth: null,
          profile_image_url: null,
          loyalty_points: 0,
          member_since: null,
          member_level: '-',
          level_progress: {
            current_level_name: '-',
            current_level_min_spending: 0,
            next_level_name: null,
            next_level_min_spending: null,
            current_spending: 0,
            spending_to_next_level: 0,
            progress_percent: 0,
            is_max_level: false,
          },
        },
        stats: {
          total_orders: 0,
          completed_orders: 0,
          total_spending: 0,
          average_order_value: 0,
          total_promo_usage: 0,
          redeemed_points: 0,
          redeemed_discount: 0,
        },
        orders: [],
        promotions: [],
      });
    }

    const customer = customerRows[0];
    const customerId = Number(customer.customer_id);

    const [statRows] = await pool.query(
      `
      SELECT
        COUNT(*) AS total_orders,
        SUM(CASE WHEN o.order_status IN ('delivered', 'success') THEN 1 ELSE 0 END) AS completed_orders,
        COALESCE(SUM(o.total_amount), 0) AS total_spending,
        COALESCE(AVG(o.total_amount), 0) AS average_order_value
      FROM orders o
      WHERE o.customer_id = ?
      `,
      [customerId]
    );

    const stats = statRows[0] || {};
    const customerSpending = Number(stats.total_spending || 0);

    const [memberLevelRows] = await pool.query(
      `
      SELECT member_level_id, member_level_name, min_point
      FROM member_level
      ORDER BY min_point ASC
      `
    );

    const levels = Array.isArray(memberLevelRows)
      ? memberLevelRows
          .map((level) => ({
            ...level,
            min_point: Number(level.min_point || 0),
          }))
          .sort((a, b) => a.min_point - b.min_point)
      : [];

    const fallbackLevel = {
      member_level_id: customer.member_level_id,
      member_level_name: customer.member_level_name || '-',
      min_point: 0,
    };

    let currentLevelIndex = 0;
    if (levels.length > 0) {
      currentLevelIndex = levels.findIndex((level, index) => {
        const min = Number(level.min_point || 0);
        const next = levels[index + 1];
        const nextMin = next ? Number(next.min_point || 0) : Number.POSITIVE_INFINITY;
        return customerSpending >= min && customerSpending < nextMin;
      });

      if (currentLevelIndex < 0) {
        currentLevelIndex = customerSpending >= Number(levels[levels.length - 1].min_point || 0)
          ? levels.length - 1
          : 0;
      }
    }

    const currentLevel = levels[currentLevelIndex] || fallbackLevel;
    const nextLevel = levels.length > 0 ? levels[currentLevelIndex + 1] || null : null;
    const currentLevelMinSpending = Number(currentLevel.min_point || 0);
    const nextLevelMinSpending = nextLevel ? Number(nextLevel.min_point || 0) : null;
    const spendingToNextLevel = nextLevelMinSpending !== null ? Math.max(nextLevelMinSpending - customerSpending, 0) : 0;
    const progressPercent =
      nextLevelMinSpending !== null && nextLevelMinSpending > currentLevelMinSpending
        ? Math.min(
            100,
            Math.max(
              0,
              ((customerSpending - currentLevelMinSpending) / (nextLevelMinSpending - currentLevelMinSpending)) * 100
            )
          )
        : 100;

    const [orderRows] = await pool.query(
      `
      SELECT
        o.order_id,
        o.order_code,
        o.order_status,
        o.total_amount,
        o.created_at,
        b.branch_name
      FROM orders o
      LEFT JOIN branch b ON b.branch_id = o.branch_id
      WHERE o.customer_id = ?
      ORDER BY o.created_at DESC
      LIMIT 20
      `,
      [customerId]
    );

    const orderIds = Array.isArray(orderRows)
      ? orderRows.map((row) => Number(row.order_id)).filter((id) => Number.isFinite(id) && id > 0)
      : [];

    let orderItemsByOrderId = new Map();
    if (orderIds.length > 0) {
      const cartQtyColumn = await getExistingColumnName('shopping_cart', ['quantity', 'qty']);
      const cartTotalPriceColumn =
        (await getExistingColumnName('shopping_cart', ['total_price', 'price_total'])) ||
        'price_total';
      const qtyExpr = cartQtyColumn ? `sc.${cartQtyColumn}` : '1';
      const placeholders = orderIds.map(() => '?').join(',');
      const [orderItemRows] = await pool.query(
        `
        SELECT
          sc.order_id,
          sc.shopping_cart_id,
          ${qtyExpr} AS item_qty,
          sc.${cartTotalPriceColumn} AS item_total,
          pr.product_name,
          pr.product_img,
          pt.product_type_name,
          GROUP_CONCAT(DISTINCT CONCAT(f.flower_name, ' x', fd.quantity) ORDER BY f.flower_name SEPARATOR ', ') AS flowers,
          ff.filler_flower_name,
          wm.wrapping_name,
          r.ribbon_name,
          rc.ribbon_color_name,
          c.card_name,
          cd.message AS card_message,
          v.vase_name,
          mb.monetary_bouquet_name,
          fs.folding_style_name,
          mbd.amount AS money_amount
        FROM shopping_cart sc
        JOIN product pr ON pr.product_id = sc.product_id
        LEFT JOIN product_type pt ON pt.product_type_id = pr.product_type_id
        LEFT JOIN flower_detail fd ON fd.shopping_cart_id = sc.shopping_cart_id
        LEFT JOIN flower f ON f.flower_id = fd.flower_id
        LEFT JOIN filler_flower_detail ffd ON ffd.shopping_cart_id = sc.shopping_cart_id
        LEFT JOIN filler_flower ff ON ff.filler_flower_id = ffd.filler_flower_id
        LEFT JOIN wrapping_detail wd ON wd.shopping_cart_id = sc.shopping_cart_id
        LEFT JOIN wrapping_material wm ON wm.wrapping_id = wd.wrapping_id
        LEFT JOIN ribbon_detail rd ON rd.shopping_cart_id = sc.shopping_cart_id
        LEFT JOIN ribbon r ON r.ribbon_id = rd.ribbon_id
        LEFT JOIN ribbon_color rc ON rc.ribbon_color_id = rd.ribbon_color_id
        LEFT JOIN card_detail cd ON cd.shopping_cart_id = sc.shopping_cart_id
        LEFT JOIN card c ON c.card_id = cd.card_id
        LEFT JOIN vase_customization vc ON vc.shopping_cart_id = sc.shopping_cart_id
        LEFT JOIN vase v ON v.vase_id = vc.vase_id
        LEFT JOIN monetary_bouquet_detail mbd ON mbd.shopping_cart_id = sc.shopping_cart_id
        LEFT JOIN monetary_bouquet mb ON mb.monetary_bouquet_id = mbd.monetary_bouquet_id
        LEFT JOIN folding_style fs ON fs.folding_style_id = mbd.folding_style_id
        WHERE sc.order_id IN (${placeholders})
        GROUP BY
          sc.order_id,
          sc.shopping_cart_id,
          sc.${cartTotalPriceColumn},
          pr.product_name,
          pr.product_img,
          pt.product_type_name,
          ff.filler_flower_name,
          wm.wrapping_name,
          r.ribbon_name,
          rc.ribbon_color_name,
          c.card_name,
          cd.message,
          v.vase_name,
          mb.monetary_bouquet_name,
          fs.folding_style_name,
          mbd.amount
        ORDER BY sc.order_id DESC, sc.shopping_cart_id ASC
        `,
        orderIds
      );

      orderItemsByOrderId = orderItemRows.reduce((map, row) => {
        const orderId = Number(row.order_id);
        const items = map.get(orderId) || [];
        items.push({
          shopping_cart_id: Number(row.shopping_cart_id || 0),
          product_name: row.product_name || '-',
          product_img: row.product_img || null,
          product_type_name: row.product_type_name || null,
          qty: Number(row.item_qty || 0),
          price_total: Number(row.item_total || 0),
          flowers: row.flowers || '-',
          filler_flower_name: row.filler_flower_name || null,
          wrapping_name: row.wrapping_name || null,
          ribbon_name: row.ribbon_name || null,
          ribbon_color_name: row.ribbon_color_name || null,
          card_name: row.card_name || null,
          card_message: row.card_message || null,
          vase_name: row.vase_name || null,
          monetary_bouquet_name: row.monetary_bouquet_name || null,
          folding_style_name: row.folding_style_name || null,
          money_amount: row.money_amount ? Number(row.money_amount) : null,
        });
        map.set(orderId, items);
        return map;
      }, new Map());
    }

    const [promotionRows] = await pool.query(
      `
      SELECT
        o.order_code,
        o.created_at,
        p.promotion_code,
        p.promotion_name
      FROM orders o
      JOIN promotion p ON p.promotion_id = o.promotion_id
      WHERE o.customer_id = ?
      ORDER BY o.created_at DESC
      LIMIT 20
      `,
      [customerId]
    );

    const [redeemRows] = await pool.query(
      `
      SELECT COALESCE(SUM(pt.point), 0) AS redeemed_points
      FROM point_transaction pt
      WHERE pt.customer_id = ? AND LOWER(pt.type) = 'redeem'
      `,
      [customerId]
    );

    const redeemedPoints = Number(redeemRows?.[0]?.redeemed_points || 0);

    return res.json({
      profile: {
        customer_id: customerId,
        first_name: customer.customer_name || '-',
        last_name: customer.customer_surname || '-',
        email: customer.email || null,
        phone: customer.phone || normalizedPhone,
        gender_name: customer.gender_name || null,
        date_of_birth: customer.date_of_birth || null,
        profile_image_url: customer.profile_image_url || null,
        loyalty_points: Number(customer.total_point || 0),
        member_since: customer.created_at || null,
        member_level: currentLevel.member_level_name || customer.member_level_name || '-',
        level_progress: {
          current_level_name: currentLevel.member_level_name || '-',
          current_level_min_spending: currentLevelMinSpending,
          next_level_name: nextLevel ? nextLevel.member_level_name : null,
          next_level_min_spending: nextLevelMinSpending,
          current_spending: customerSpending,
          spending_to_next_level: spendingToNextLevel,
          progress_percent: progressPercent,
          is_max_level: !nextLevel,
        },
      },
      stats: {
        total_orders: Number(stats.total_orders || 0),
        completed_orders: Number(stats.completed_orders || 0),
        total_spending: Number(stats.total_spending || 0),
        average_order_value: Number(stats.average_order_value || 0),
        total_promo_usage: Array.isArray(promotionRows) ? promotionRows.length : 0,
        redeemed_points: redeemedPoints,
        redeemed_discount: Math.floor(redeemedPoints / 10),
      },
      orders: Array.isArray(orderRows)
        ? orderRows.map((row) => ({
            order_id: row.order_id,
            order_code: row.order_code,
            order_status: row.order_status,
            total_amount: Number(row.total_amount || 0),
            created_at: row.created_at,
            branch_name: row.branch_name || '-',
            items: orderItemsByOrderId.get(Number(row.order_id)) || [],
          }))
        : [],
      promotions: Array.isArray(promotionRows)
        ? promotionRows.map((row, index) => ({
            id: `${row.order_code || 'order'}-${index}`,
            code: row.promotion_code || '-',
            label: row.promotion_name || 'โปรโมชั่น',
            date: row.created_at,
          }))
        : [],
    });
  } catch (err) {
    console.error('❌ Customer Dashboard API Error:', err.message);
    return res.status(500).json({ error: 'Failed to load dashboard', detail: err.message });
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
        p.is_allflower,
        p.promotion_type_id,
        pt.promotion_type_name,
        COUNT(DISTINCT o.order_id) AS used_count,
        GROUP_CONCAT(DISTINCT pf.flower_id ORDER BY pf.flower_id) AS flower_ids,
        GROUP_CONCAT(DISTINCT pml.member_level_id ORDER BY pml.member_level_id) as member_level_ids,
        GROUP_CONCAT(DISTINCT ml.member_level_name ORDER BY pml.member_level_id SEPARATOR '|') as member_level_names
      FROM promotion p
      LEFT JOIN promotion_type pt ON p.promotion_type_id = pt.promotion_type_id
      LEFT JOIN orders o ON o.promotion_id = p.promotion_id
      LEFT JOIN promotion_flower pf ON pf.promotion_id = p.promotion_id
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
      const flowerIds = row.flower_ids
        ? String(row.flower_ids)
            .split(',')
            .map((id) => Number(id))
            .filter((id) => Number.isInteger(id) && id > 0)
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
        usedCount: Number(row.used_count || 0),
        isAllFlower: Number(row.is_allflower || 0) === 1,
        flowerIds,
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

app.post('/api/promotions/validate', async (req, res) => {
  try {
    const payload = req.body || {};
    const code = String(payload.code || '').trim().toUpperCase();
    const subtotal = Number(payload.subtotal || 0);
    const deliveryType = String(payload.deliveryType || 'delivery').toLowerCase();
    const memberLevelName = String(payload.memberLevelName || '').trim().toLowerCase();
    const customerPhone = String(payload.customerPhone || '').trim();
    const cartFlowerIds = parseIdArray(payload.flowerIds);

    if (!code) {
      return res.status(400).json({ valid: false, message: 'กรุณาระบุโค้ดโปรโมชั่น' });
    }

    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return res.status(400).json({ valid: false, message: 'ยอดสั่งซื้อไม่ถูกต้อง' });
    }

    const [promotionRows] = await pool.query(
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
        p.is_allbranch,
        p.is_allflower,
        p.is_active,
        pt.promotion_type_name
      FROM promotion p
      LEFT JOIN promotion_type pt ON p.promotion_type_id = pt.promotion_type_id
      WHERE UPPER(TRIM(p.promotion_code)) = UPPER(TRIM(?))
      LIMIT 1
      `,
      [code]
    );

    const promotion = Array.isArray(promotionRows) ? promotionRows[0] : null;
    if (!promotion) {
      return res.json({ valid: false, message: 'ไม่พบโค้ดโปรโมชั่นนี้' });
    }

    if (Number(promotion.is_active || 0) !== 1) {
      return res.json({ valid: false, message: 'โค้ดนี้ถูกปิดใช้งานแล้ว' });
    }

    const now = new Date();
    const startDate = promotion.start_date ? new Date(promotion.start_date) : null;
    const endDate = promotion.end_date ? new Date(promotion.end_date) : null;

    if (startDate && now < startDate) {
      return res.json({ valid: false, message: 'โค้ดยังไม่ถึงวันเริ่มใช้งาน' });
    }

    if (endDate && now > endDate) {
      return res.json({ valid: false, message: 'โค้ดหมดอายุแล้ว' });
    }

    const minSubtotal = Number(promotion.minimum_order_amount || 0);
    if (subtotal < minSubtotal) {
      return res.json({
        valid: false,
        message: `โค้ดนี้ใช้ได้เมื่อยอดซื้อขั้นต่ำ ฿${minSubtotal.toLocaleString()}`,
      });
    }

    const [usageRows] = await pool.query(
      'SELECT COUNT(*) AS used_count FROM orders WHERE promotion_id = ?',
      [promotion.promotion_id]
    );
    const usedCount = Number((Array.isArray(usageRows) ? usageRows[0]?.used_count : 0) || 0);
    const usageLimit = promotion.usage_limit === null ? null : Number(promotion.usage_limit || 0);
    if (usageLimit !== null && usageLimit > 0 && usedCount >= usageLimit) {
      return res.json({ valid: false, message: 'โค้ดนี้ถูกใช้ครบจำนวนแล้ว' });
    }

    const promotionMemberTable = await getExistingTableName(['promotion_member', 'promotion_member_level']);
    const memberLevelIdCol = promotionMemberTable
      ? await getExistingColumnName(promotionMemberTable, ['member_level_id'])
      : null;

    let memberLevelIds = [];
    let memberLevelNames = [];
    if (promotionMemberTable && memberLevelIdCol) {
      const [memberRows] = await pool.query(
        `
        SELECT pm.\`${memberLevelIdCol}\` AS member_level_id, ml.member_level_name
        FROM \`${promotionMemberTable}\` pm
        LEFT JOIN member_level ml ON ml.member_level_id = pm.\`${memberLevelIdCol}\`
        WHERE pm.promotion_id = ?
        `,
        [promotion.promotion_id]
      );
      memberLevelIds = (Array.isArray(memberRows) ? memberRows : [])
        .map((row) => Number(row.member_level_id))
        .filter((v) => Number.isInteger(v) && v > 0);
      memberLevelNames = (Array.isArray(memberRows) ? memberRows : [])
        .map((row) => String(row.member_level_name || '').trim())
        .filter(Boolean);
    }

    if (memberLevelNames.length > 0) {
      if (!memberLevelName) {
        return res.json({ valid: false, message: 'โค้ดนี้จำกัดระดับสมาชิก' });
      }
      const allowed = memberLevelNames.some((name) => name.toLowerCase() === memberLevelName);
      if (!allowed) {
        return res.json({ valid: false, message: 'ระดับสมาชิกของคุณไม่สามารถใช้โค้ดนี้ได้' });
      }
    }

    const [flowerRows] = await pool.query(
      `
      SELECT pf.flower_id, f.flower_name
      FROM promotion_flower pf
      LEFT JOIN flower f ON f.flower_id = pf.flower_id
      WHERE pf.promotion_id = ?
      ORDER BY pf.flower_id
      `,
      [promotion.promotion_id]
    );
    const normalizedFlowerRows = Array.isArray(flowerRows) ? flowerRows : [];
    const promotionFlowerIds = normalizedFlowerRows
      .map((row) => Number(row.flower_id))
      .filter((v) => Number.isInteger(v) && v > 0);
    const promotionFlowerNames = normalizedFlowerRows
      .map((row) => String(row.flower_name || '').trim())
      .filter(Boolean);
    const isFlowerRestricted = Number(promotion.is_allflower || 0) !== 1 && promotionFlowerIds.length > 0;

    if (isFlowerRestricted) {
      if (cartFlowerIds.length === 0) {
        return res.json({ valid: false, message: 'โค้ดนี้ใช้ได้เฉพาะดอกไม้ที่ร่วมรายการเท่านั้น' });
      }

      const hasMatchingFlower = cartFlowerIds.some((flowerId) => promotionFlowerIds.includes(flowerId));
      if (!hasMatchingFlower) {
        return res.json({
          valid: false,
          message: 'สินค้าในตะกร้าไม่มีดอกไม้ที่ร่วมรายการของโค้ดนี้',
        });
      }
    }

    const perUserLimit = promotion.per_user_limit === null ? null : Number(promotion.per_user_limit || 0);
    if (perUserLimit !== null && perUserLimit > 0 && customerPhone) {
      const [customerRows] = await pool.query(
        'SELECT customer_id FROM customer WHERE phone = ? LIMIT 1',
        [customerPhone]
      );
      const customerId = Array.isArray(customerRows) ? customerRows[0]?.customer_id : null;
      if (customerId) {
        const [customerUsageRows] = await pool.query(
          'SELECT COUNT(*) AS used_count FROM orders WHERE promotion_id = ? AND customer_id = ?',
          [promotion.promotion_id, customerId]
        );
        const customerUsed = Number((Array.isArray(customerUsageRows) ? customerUsageRows[0]?.used_count : 0) || 0);
        if (customerUsed >= perUserLimit) {
          return res.json({ valid: false, message: 'คุณใช้โค้ดนี้ครบสิทธิ์แล้ว' });
        }
      }
    }

    const [branchRows] = await pool.query(
      `
      SELECT pb.branch_id, b.branch_name
      FROM promotion_branch pb
      LEFT JOIN branch b ON b.branch_id = pb.branch_id
      WHERE pb.promotion_id = ?
      ORDER BY pb.branch_id
      `,
      [promotion.promotion_id]
    );
    const normalizedBranchRows = Array.isArray(branchRows) ? branchRows : [];
    const branchIds = normalizedBranchRows
      .map((row) => Number(row.branch_id))
      .filter((v) => Number.isInteger(v) && v > 0);
    const branchNames = normalizedBranchRows
      .map((row) => String(row.branch_name || '').trim())
      .filter(Boolean);

    const discount = Number(promotion.discount || 0);
    const maxDiscount = promotion.max_discount === null ? null : Number(promotion.max_discount || 0);
    let benefitType = 'amount';
    const description = String(promotion.description || '').toLowerCase();
    const name = String(promotion.promotion_name || '').toLowerCase();
    const typeName = String(promotion.promotion_type_name || '').toLowerCase();

    if (discount > 0 && discount <= 100) {
      benefitType = 'percent';
    } else if (discount > 100) {
      benefitType = 'amount';
    }

    if (
      description.includes('ฟรี') ||
      name.includes('ฟรี') ||
      description.includes('shipping') ||
      name.includes('shipping') ||
      typeName.includes('ส่วนลดจัดส่ง')
    ) {
      benefitType = 'shipping';
    }

    if (benefitType === 'shipping' && deliveryType === 'pickup') {
      return res.json({
        valid: false,
        message: 'โค้ดส่วนลดค่าจัดส่งใช้ไม่ได้กับการรับหน้าร้าน (ไม่มีค่าส่ง)',
      });
    }

    let discountAmount = 0;
    if (benefitType === 'amount') {
      discountAmount = Math.min(discount, subtotal);
    } else if (benefitType === 'percent') {
      const percentDiscount = Math.floor((subtotal * discount) / 100);
      const cappedDiscount = maxDiscount !== null && maxDiscount > 0
        ? Math.min(percentDiscount, maxDiscount)
        : percentDiscount;
      discountAmount = Math.min(cappedDiscount, subtotal);
    }

    return res.json({
      valid: true,
      message: 'ใช้โค้ดโปรโมชั่นสำเร็จ',
      promotionId: Number(promotion.promotion_id),
      code: String(promotion.promotion_code || code),
      label: String(promotion.promotion_name || ''),
      benefitType,
      discountAmount,
      maxDiscount,
      minSubtotal,
      usageLimit,
      usedCount,
      perUserLimit,
      memberLevelIds,
      memberLevelNames,
      flowerIds: promotionFlowerIds,
      flowerNames: promotionFlowerNames,
      isFlowerRestricted,
      branchIds,
      branchNames,
      isBranchRestricted: Number(promotion.is_allbranch || 0) !== 1 && branchIds.length > 0,
    });
  } catch (err) {
    console.error('❌ Promotion Validate API Error:', err.message);
    return res.status(500).json({
      valid: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบโค้ดโปรโมชั่น',
      detail: err.message,
    });
  }
});

// Executive promotion management APIs
const parseIdArray = (raw) => {
  if (Array.isArray(raw)) {
    return raw
      .map((v) => Number(v))
      .filter((v) => Number.isInteger(v) && v > 0);
  }

  if (raw === null || raw === undefined || raw === '') {
    return [];
  }

  return String(raw)
    .split(',')
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isInteger(v) && v > 0);
};

app.get('/api/executive/promotions/options', async (_req, res) => {
  try {
    const [promotionTypes, channels, branches] = await Promise.all([
      pool
        .query('SELECT promotion_type_id, promotion_type_name FROM promotion_type ORDER BY promotion_type_id')
        .then(([rows]) => (Array.isArray(rows) ? rows : []))
        .catch(() => []),
      pool
        .query('SELECT channel_id, channel_name FROM channel ORDER BY channel_id')
        .then(([rows]) => (Array.isArray(rows) ? rows : []))
        .catch(() => []),
      pool
        .query('SELECT branch_id, branch_name FROM branch ORDER BY branch_name')
        .then(([rows]) => (Array.isArray(rows) ? rows : []))
        .catch(() => []),
    ]);

    const flowerNameColumn = await getExistingColumnName('flower', ['flower_name', 'name']);
    const flowerIdColumn = await getExistingColumnName('flower', ['flower_id']);
    const flowerRows = flowerIdColumn
      ? await pool
          .query(
            `SELECT \`${flowerIdColumn}\` AS flower_id, ${flowerNameColumn ? `\`${flowerNameColumn}\`` : `CONCAT('ดอกไม้ #', \`${flowerIdColumn}\`)`} AS flower_name FROM flower ORDER BY flower_name`
          )
          .then(([rows]) => (Array.isArray(rows) ? rows : []))
          .catch(() => [])
      : [];

    const memberRows = await pool
      .query('SELECT member_level_id, member_level_name FROM member_level ORDER BY member_level_id')
      .then(([rows]) => (Array.isArray(rows) ? rows : []))
      .catch(() => []);

    return res.json({
      promotionTypes: promotionTypes.map((row) => ({
        promotion_type_id: Number(row.promotion_type_id),
        promotion_type_name: String(row.promotion_type_name || ''),
      })),
      channels: channels.map((row) => ({
        channel_id: Number(row.channel_id),
        channel_name: String(row.channel_name || ''),
      })),
      branches: branches.map((row) => ({
        branch_id: Number(row.branch_id),
        branch_name: String(row.branch_name || ''),
      })),
      flowers: flowerRows.map((row) => ({
        flower_id: Number(row.flower_id),
        flower_name: String(row.flower_name || ''),
      })),
      memberLevels: memberRows.map((row) => ({
        member_level_id: Number(row.member_level_id),
        member_level_name: String(row.member_level_name || ''),
      })),
    });
  } catch (err) {
    console.error('❌ Executive Promotions Options API Error:', err.message);
    return res.status(500).json({
      error: 'Failed to load executive promotions options',
      detail: err.message,
    });
  }
});

app.get('/api/executive/promotions', async (_req, res) => {
  try {
    const promotionMemberTable = await getExistingTableName(['promotion_member', 'promotion_member_level']);
    const memberLevelIdCol = promotionMemberTable
      ? await getExistingColumnName(promotionMemberTable, ['member_level_id'])
      : null;

    const [rows] = await pool.query(
      `
      SELECT
        p.promotion_id,
        p.promotion_type_id,
        pt.promotion_type_name,
        p.promotion_code,
        p.promotion_name,
        p.description,
        p.discount,
        p.max_discount,
        p.minimum_order_amount,
        p.usage_limit,
        p.per_user_limit,
        p.start_date,
        p.end_date,
        p.is_allbranch,
        p.is_allflower,
        p.is_active,
        COUNT(DISTINCT o.order_id) AS total_usage,
        GROUP_CONCAT(DISTINCT pb.branch_id ORDER BY pb.branch_id) AS branch_ids,
        GROUP_CONCAT(DISTINCT b.branch_name ORDER BY b.branch_name SEPARATOR '|') AS branch_names,
        GROUP_CONCAT(DISTINCT pc.channel_id ORDER BY pc.channel_id) AS channel_ids,
        GROUP_CONCAT(DISTINCT ch.channel_name ORDER BY ch.channel_name SEPARATOR '|') AS channel_names,
        GROUP_CONCAT(DISTINCT pf.flower_id ORDER BY pf.flower_id) AS flower_ids,
        GROUP_CONCAT(DISTINCT f.flower_name ORDER BY f.flower_name SEPARATOR '|') AS flower_names,
        ${promotionMemberTable && memberLevelIdCol ? `GROUP_CONCAT(DISTINCT pm.\`${memberLevelIdCol}\` ORDER BY pm.\`${memberLevelIdCol}\`)` : 'NULL'} AS member_level_ids,
        ${promotionMemberTable && memberLevelIdCol ? `GROUP_CONCAT(DISTINCT ml.member_level_name ORDER BY ml.member_level_name SEPARATOR '|')` : 'NULL'} AS member_level_names
      FROM promotion p
      LEFT JOIN promotion_type pt ON pt.promotion_type_id = p.promotion_type_id
      LEFT JOIN orders o ON o.promotion_id = p.promotion_id
      LEFT JOIN promotion_branch pb ON pb.promotion_id = p.promotion_id
      LEFT JOIN branch b ON b.branch_id = pb.branch_id
      LEFT JOIN promotion_channel pc ON pc.promotion_id = p.promotion_id
      LEFT JOIN channel ch ON ch.channel_id = pc.channel_id
      LEFT JOIN promotion_flower pf ON pf.promotion_id = p.promotion_id
      LEFT JOIN flower f ON f.flower_id = pf.flower_id
      ${promotionMemberTable && memberLevelIdCol ? `LEFT JOIN \`${promotionMemberTable}\` pm ON pm.promotion_id = p.promotion_id` : ''}
      ${promotionMemberTable && memberLevelIdCol ? `LEFT JOIN member_level ml ON ml.member_level_id = pm.\`${memberLevelIdCol}\`` : ''}
      WHERE COALESCE(p.is_active, 1) = 1
      GROUP BY p.promotion_id
      ORDER BY p.start_date DESC, p.promotion_id DESC
      `
    );

    const promotions = Array.isArray(rows)
      ? rows.map((row) => ({
          id: Number(row.promotion_id),
          promotionTypeId: row.promotion_type_id ? Number(row.promotion_type_id) : null,
          promotionTypeName: String(row.promotion_type_name || ''),
          code: String(row.promotion_code || ''),
          name: String(row.promotion_name || ''),
          description: String(row.description || ''),
          startDate: row.start_date,
          endDate: row.end_date,
          minAmount: Number(row.minimum_order_amount || 0),
          discount: Number(row.discount || 0),
          maxDiscount: row.max_discount !== null ? Number(row.max_discount) : null,
          usageLimit: row.usage_limit !== null ? Number(row.usage_limit) : null,
          perUserLimit: row.per_user_limit !== null ? Number(row.per_user_limit) : null,
          isAllBranch: Number(row.is_allbranch || 0) === 1,
          isAllFlower: Number(row.is_allflower || 0) === 1,
          isActive: Number(row.is_active || 0) === 1,
          totalUsage: Number(row.total_usage || 0),
          branchIds: parseIdArray(row.branch_ids),
          branchNames: row.branch_names ? String(row.branch_names).split('|').filter(Boolean) : [],
          channelIds: parseIdArray(row.channel_ids),
          channelNames: row.channel_names ? String(row.channel_names).split('|').filter(Boolean) : [],
          flowerIds: parseIdArray(row.flower_ids),
          flowerNames: row.flower_names ? String(row.flower_names).split('|').filter(Boolean) : [],
          memberLevelIds: parseIdArray(row.member_level_ids),
          memberLevelNames: row.member_level_names ? String(row.member_level_names).split('|').filter(Boolean) : [],
        }))
      : [];

    return res.json(promotions);
  } catch (err) {
    console.error('❌ Executive Promotions List API Error:', err.message);
    return res.status(500).json({
      error: 'Failed to load executive promotions',
      detail: err.message,
    });
  }
});

app.post('/api/executive/promotions', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const payload = req.body || {};
    const code = String(payload.code || '').trim().toUpperCase();
    const name = String(payload.name || '').trim();
    const description = String(payload.description || '').trim();
    const startDate = payload.startDate || null;
    const endDate = payload.endDate || null;
    const minAmount = Number(payload.minAmount || 0);
    const discount = Number(payload.discount || 0);
    const maxDiscount = payload.maxDiscount === '' || payload.maxDiscount === null || payload.maxDiscount === undefined
      ? null
      : Number(payload.maxDiscount);
    const usageLimit = payload.usageLimit === '' || payload.usageLimit === null || payload.usageLimit === undefined
      ? null
      : Number(payload.usageLimit);
    const perUserLimit = payload.perUserLimit === '' || payload.perUserLimit === null || payload.perUserLimit === undefined
      ? null
      : Number(payload.perUserLimit);
    const promotionTypeId = Number(payload.promotionTypeId || 0);
    const isAllBranch = payload.isAllBranch === false ? 0 : 1;
    const isAllFlower = payload.isAllFlower === false ? 0 : 1;
    const isActive = payload.isActive === false ? 0 : 1;

    const branchIds = parseIdArray(payload.branchIds);
    const channelIds = parseIdArray(payload.channelIds);
    const flowerIds = parseIdArray(payload.flowerIds);
    const memberLevelIds = parseIdArray(payload.memberLevelIds);

    if (!code || !name) {
      return res.status(400).json({ error: 'Promotion code and name are required' });
    }
    if (!Number.isFinite(promotionTypeId) || promotionTypeId <= 0) {
      return res.status(400).json({ error: 'promotionTypeId is required' });
    }
    if (!Number.isFinite(minAmount) || minAmount < 0) {
      return res.status(400).json({ error: 'minimum_order_amount must be a non-negative number' });
    }
    if (!Number.isFinite(discount) || discount < 0) {
      return res.status(400).json({ error: 'discount must be a non-negative number' });
    }
    if (maxDiscount !== null && (!Number.isFinite(maxDiscount) || maxDiscount < 0)) {
      return res.status(400).json({ error: 'max_discount must be a non-negative number' });
    }
    if (usageLimit !== null && (!Number.isFinite(usageLimit) || usageLimit < 0)) {
      return res.status(400).json({ error: 'usage_limit must be a non-negative number' });
    }
    if (perUserLimit !== null && (!Number.isFinite(perUserLimit) || perUserLimit < 0)) {
      return res.status(400).json({ error: 'per_user_limit must be a non-negative number' });
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ error: 'startDate must be earlier than or equal to endDate' });
    }
    if (!isAllBranch && branchIds.length === 0) {
      return res.status(400).json({ error: 'Please select at least one branch when isAllBranch is false' });
    }
    if (!isAllFlower && flowerIds.length === 0) {
      return res.status(400).json({ error: 'Please select at least one flower when isAllFlower is false' });
    }

    const [existsRows] = await conn.query(
      'SELECT promotion_id FROM promotion WHERE UPPER(TRIM(promotion_code)) = UPPER(TRIM(?)) LIMIT 1',
      [code]
    );
    if (Array.isArray(existsRows) && existsRows.length > 0) {
      return res.status(409).json({ error: 'Promotion code already exists' });
    }

    const [result] = await conn.query(
      `
      INSERT INTO promotion
        (promotion_type_id, promotion_code, promotion_name, description, discount, max_discount, minimum_order_amount, usage_limit, per_user_limit, start_date, end_date, is_allbranch, is_allflower, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [promotionTypeId, code, name, description || null, discount, maxDiscount, minAmount, usageLimit, perUserLimit, startDate, endDate, isAllBranch, isAllFlower, isActive]
    );

    const promotionId = Number(result.insertId);

    if (!isAllBranch && branchIds.length > 0) {
      const values = branchIds.map((branchId) => [promotionId, branchId]);
      await conn.query('INSERT INTO promotion_branch (promotion_id, branch_id) VALUES ?', [values]);
    }

    if (channelIds.length > 0) {
      const values = channelIds.map((channelId) => [promotionId, channelId]);
      await conn.query('INSERT INTO promotion_channel (promotion_id, channel_id) VALUES ?', [values]);
    }

    if (!isAllFlower && flowerIds.length > 0) {
      const values = flowerIds.map((flowerId) => [promotionId, flowerId]);
      await conn.query('INSERT INTO promotion_flower (promotion_id, flower_id) VALUES ?', [values]);
    }

    const promotionMemberTable = await getExistingTableName(['promotion_member', 'promotion_member_level']);
    const memberLevelIdCol = promotionMemberTable
      ? await getExistingColumnName(promotionMemberTable, ['member_level_id'])
      : null;

    if (promotionMemberTable && memberLevelIdCol && memberLevelIds.length > 0) {
      const values = memberLevelIds.map((memberLevelId) => [promotionId, memberLevelId]);
      await conn.query(
        `INSERT INTO \`${promotionMemberTable}\` (promotion_id, \`${memberLevelIdCol}\`) VALUES ?`,
        [values]
      );
    }

    await conn.commit();
    return res.status(201).json({
      message: 'Promotion created',
      promotion_id: promotionId,
    });
  } catch (err) {
    await conn.rollback();
    console.error('❌ Executive Promotion Create API Error:', err.message);
    return res.status(500).json({
      error: 'Failed to create promotion',
      detail: err.message,
    });
  } finally {
    conn.release();
  }
});

app.put('/api/executive/promotions/:promotionId', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const promotionId = Number(req.params.promotionId);
    if (!Number.isInteger(promotionId) || promotionId <= 0) {
      return res.status(400).json({ error: 'Invalid promotion id' });
    }

    const payload = req.body || {};
    const code = String(payload.code || '').trim().toUpperCase();
    const name = String(payload.name || '').trim();
    const description = String(payload.description || '').trim();
    const startDate = payload.startDate || null;
    const endDate = payload.endDate || null;
    const minAmount = Number(payload.minAmount || 0);
    const discount = Number(payload.discount || 0);
    const maxDiscount = payload.maxDiscount === '' || payload.maxDiscount === null || payload.maxDiscount === undefined
      ? null
      : Number(payload.maxDiscount);
    const usageLimit = payload.usageLimit === '' || payload.usageLimit === null || payload.usageLimit === undefined
      ? null
      : Number(payload.usageLimit);
    const perUserLimit = payload.perUserLimit === '' || payload.perUserLimit === null || payload.perUserLimit === undefined
      ? null
      : Number(payload.perUserLimit);
    const promotionTypeId = Number(payload.promotionTypeId || 0);
    const isAllBranch = payload.isAllBranch === false ? 0 : 1;
    const isAllFlower = payload.isAllFlower === false ? 0 : 1;
    const isActive = payload.isActive === false ? 0 : 1;

    const branchIds = parseIdArray(payload.branchIds);
    const channelIds = parseIdArray(payload.channelIds);
    const flowerIds = parseIdArray(payload.flowerIds);
    const memberLevelIds = parseIdArray(payload.memberLevelIds);

    if (!code || !name) {
      return res.status(400).json({ error: 'Promotion code and name are required' });
    }
    if (!Number.isFinite(promotionTypeId) || promotionTypeId <= 0) {
      return res.status(400).json({ error: 'promotionTypeId is required' });
    }
    if (!Number.isFinite(minAmount) || minAmount < 0) {
      return res.status(400).json({ error: 'minimum_order_amount must be a non-negative number' });
    }
    if (!Number.isFinite(discount) || discount < 0) {
      return res.status(400).json({ error: 'discount must be a non-negative number' });
    }
    if (maxDiscount !== null && (!Number.isFinite(maxDiscount) || maxDiscount < 0)) {
      return res.status(400).json({ error: 'max_discount must be a non-negative number' });
    }
    if (usageLimit !== null && (!Number.isFinite(usageLimit) || usageLimit < 0)) {
      return res.status(400).json({ error: 'usage_limit must be a non-negative number' });
    }
    if (perUserLimit !== null && (!Number.isFinite(perUserLimit) || perUserLimit < 0)) {
      return res.status(400).json({ error: 'per_user_limit must be a non-negative number' });
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ error: 'startDate must be earlier than or equal to endDate' });
    }
    if (!isAllBranch && branchIds.length === 0) {
      return res.status(400).json({ error: 'Please select at least one branch when isAllBranch is false' });
    }
    if (!isAllFlower && flowerIds.length === 0) {
      return res.status(400).json({ error: 'Please select at least one flower when isAllFlower is false' });
    }

    const [existsRows] = await conn.query(
      'SELECT promotion_id FROM promotion WHERE UPPER(TRIM(promotion_code)) = UPPER(TRIM(?)) AND promotion_id <> ? LIMIT 1',
      [code, promotionId]
    );
    if (Array.isArray(existsRows) && existsRows.length > 0) {
      return res.status(409).json({ error: 'Promotion code already exists' });
    }

    const [result] = await conn.query(
      `
      UPDATE promotion
      SET
        promotion_type_id = ?,
        promotion_code = ?,
        promotion_name = ?,
        description = ?,
        discount = ?,
        max_discount = ?,
        minimum_order_amount = ?,
        usage_limit = ?,
        per_user_limit = ?,
        start_date = ?,
        end_date = ?,
        is_allbranch = ?,
        is_allflower = ?,
        is_active = ?
      WHERE promotion_id = ?
      `,
      [promotionTypeId, code, name, description || null, discount, maxDiscount, minAmount, usageLimit, perUserLimit, startDate, endDate, isAllBranch, isAllFlower, isActive, promotionId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    await conn.query('DELETE FROM promotion_branch WHERE promotion_id = ?', [promotionId]);
    await conn.query('DELETE FROM promotion_channel WHERE promotion_id = ?', [promotionId]);
    await conn.query('DELETE FROM promotion_flower WHERE promotion_id = ?', [promotionId]);

    const promotionMemberTable = await getExistingTableName(['promotion_member', 'promotion_member_level']);
    const memberLevelIdCol = promotionMemberTable
      ? await getExistingColumnName(promotionMemberTable, ['member_level_id'])
      : null;
    if (promotionMemberTable) {
      await conn.query(`DELETE FROM \`${promotionMemberTable}\` WHERE promotion_id = ?`, [promotionId]);
    }

    if (!isAllBranch && branchIds.length > 0) {
      const values = branchIds.map((branchId) => [promotionId, branchId]);
      await conn.query('INSERT INTO promotion_branch (promotion_id, branch_id) VALUES ?', [values]);
    }

    if (channelIds.length > 0) {
      const values = channelIds.map((channelId) => [promotionId, channelId]);
      await conn.query('INSERT INTO promotion_channel (promotion_id, channel_id) VALUES ?', [values]);
    }

    if (!isAllFlower && flowerIds.length > 0) {
      const values = flowerIds.map((flowerId) => [promotionId, flowerId]);
      await conn.query('INSERT INTO promotion_flower (promotion_id, flower_id) VALUES ?', [values]);
    }

    if (promotionMemberTable && memberLevelIdCol && memberLevelIds.length > 0) {
      const values = memberLevelIds.map((memberLevelId) => [promotionId, memberLevelId]);
      await conn.query(
        `INSERT INTO \`${promotionMemberTable}\` (promotion_id, \`${memberLevelIdCol}\`) VALUES ?`,
        [values]
      );
    }

    await conn.commit();
    return res.json({ message: 'Promotion updated' });
  } catch (err) {
    await conn.rollback();
    console.error('❌ Executive Promotion Update API Error:', err.message);
    return res.status(500).json({
      error: 'Failed to update promotion',
      detail: err.message,
    });
  } finally {
    conn.release();
  }
});

app.delete('/api/executive/promotions/:promotionId', async (req, res) => {
  try {
    const promotionId = Number(req.params.promotionId);
    if (!Number.isInteger(promotionId) || promotionId <= 0) {
      return res.status(400).json({ error: 'Invalid promotion id' });
    }

    const [existsRows] = await pool.query(
      'SELECT promotion_id, is_active FROM promotion WHERE promotion_id = ? LIMIT 1',
      [promotionId]
    );

    if (!Array.isArray(existsRows) || existsRows.length === 0) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    if (Number(existsRows[0].is_active || 0) !== 1) {
      return res.json({ message: 'Promotion already deleted' });
    }

    // Soft delete to keep order history references valid.
    const [result] = await pool.query(
      'UPDATE promotion SET is_active = 0 WHERE promotion_id = ?',
      [promotionId]
    );

    if (!result.affectedRows) {
      return res.status(500).json({ error: 'Failed to delete promotion' });
    }

    return res.json({ message: 'Promotion deleted' });
  } catch (err) {
    console.error('❌ Executive Promotion Delete API Error:', err.message);
    return res.status(500).json({
      error: 'Failed to delete promotion',
      detail: err.message,
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

    if (!sanitizePositiveInt(branchId)) {
      throw new Error('กรุณาเลือกสาขาก่อนชำระเงิน');
    }

    const stockRequirements = await resolveOrderStockRequirements(conn, payload.items || []);
    const stockCheck = await getStockAvailabilityForRequirements(conn, branchId, stockRequirements, { forUpdate: true });
    if (!stockCheck.isAvailable) {
      const detail = stockCheck.insufficient
        .map((item) => `${item.label} (ต้องการ ${item.requiredQty}, คงเหลือ ${item.availableQty})`)
        .join(', ');
      throw new Error(`สต๊อกสินค้าไม่เพียงพอในสาขาที่เลือก: ${detail}`);
    }
    await applyStockDeductions(conn, branchId, stockCheck.entries);

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

    const pointsUsed = Math.max(0, Math.floor(Number(payload.points_used || 0)));
    if (pointsUsed > 0 && customerId) {
      const [pointRows] = await conn.query(
        'SELECT total_point FROM customer WHERE customer_id = ? LIMIT 1 FOR UPDATE',
        [customerId]
      );

      if (!Array.isArray(pointRows) || pointRows.length === 0) {
        throw new Error('Customer not found for point redemption');
      }

      const currentPoints = Math.max(0, Math.floor(Number(pointRows[0].total_point || 0)));
      if (currentPoints < pointsUsed) {
        throw new Error(`Insufficient points: requested ${pointsUsed}, available ${currentPoints}`);
      }

      await conn.query(
        'UPDATE customer SET total_point = total_point - ? WHERE customer_id = ?',
        [pointsUsed, customerId]
      );

      await conn.query(
        'INSERT INTO point_transaction (customer_id, order_id, type, point) VALUES (?, ?, ?, ?)',
        [customerId, orderId, 'Redeem', pointsUsed]
      );
    }

    if (customerId) {
      const [spendingRows] = await conn.query(
        'SELECT COALESCE(SUM(total_amount), 0) AS total_spending FROM orders WHERE customer_id = ?',
        [customerId]
      );
      const totalSpending = Number(spendingRows?.[0]?.total_spending || 0);

      const [memberLevelRows] = await conn.query(
        'SELECT member_level_id, min_point FROM member_level ORDER BY min_point ASC'
      );

      if (Array.isArray(memberLevelRows) && memberLevelRows.length > 0) {
        let targetLevelId = Number(memberLevelRows[0].member_level_id);
        for (const level of memberLevelRows) {
          if (totalSpending >= Number(level.min_point || 0)) {
            targetLevelId = Number(level.member_level_id);
          }
        }

        await conn.query(
          'UPDATE customer SET member_level_id = ? WHERE customer_id = ? AND (member_level_id IS NULL OR member_level_id <> ?)',
          [targetLevelId, customerId, targetLevelId]
        );
      }
    }

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
    GROUP_CONCAT(DISTINCT CONCAT(f.flower_name, ' x', fd.quantity) ORDER BY f.flower_name SEPARATOR ', ') AS flowers,
    ff.filler_flower_name,
    wm.wrapping_name,
    r.ribbon_name,
    rc.ribbon_color_name,
    c.card_name,
    cd.message AS card_message,
    v.vase_name,
    mb.monetary_bouquet_name,
    fs.folding_style_name,
    mbd.amount AS money_amount
  FROM shopping_cart sc
  JOIN product pr ON pr.product_id = sc.product_id
  JOIN product_type pt ON pt.product_type_id = pr.product_type_id
  LEFT JOIN flower_detail fd ON fd.shopping_cart_id = sc.shopping_cart_id
  LEFT JOIN flower f ON f.flower_id = fd.flower_id
  LEFT JOIN filler_flower_detail ffd ON ffd.shopping_cart_id = sc.shopping_cart_id
  LEFT JOIN filler_flower ff ON ff.filler_flower_id = ffd.filler_flower_id
  LEFT JOIN wrapping_detail wd ON wd.shopping_cart_id = sc.shopping_cart_id
  LEFT JOIN wrapping_material wm ON wm.wrapping_id = wd.wrapping_id
  LEFT JOIN ribbon_detail rd ON rd.shopping_cart_id = sc.shopping_cart_id
  LEFT JOIN ribbon r ON r.ribbon_id = rd.ribbon_id
  LEFT JOIN ribbon_color rc ON rc.ribbon_color_id = rd.ribbon_color_id
  LEFT JOIN card_detail cd ON cd.shopping_cart_id = sc.shopping_cart_id
  LEFT JOIN card c ON c.card_id = cd.card_id
  LEFT JOIN vase_customization vc ON vc.shopping_cart_id = sc.shopping_cart_id
  LEFT JOIN vase v ON v.vase_id = vc.vase_id
  LEFT JOIN monetary_bouquet_detail mbd ON mbd.shopping_cart_id = sc.shopping_cart_id
  LEFT JOIN monetary_bouquet mb ON mb.monetary_bouquet_id = mbd.monetary_bouquet_id
  LEFT JOIN folding_style fs ON fs.folding_style_id = mbd.folding_style_id
  WHERE sc.order_id = ?
  GROUP BY 
    sc.shopping_cart_id,
    sc.order_id,
    sc.product_id,
    sc.total_price,
    pr.product_name,
    pr.product_img,
    pt.product_type_name,
    ff.filler_flower_name,
    wm.wrapping_name,
    r.ribbon_name,
    rc.ribbon_color_name,
    c.card_name,
    cd.message,
    v.vase_name,
    mb.monetary_bouquet_name,
    fs.folding_style_name,
    mbd.amount;
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
      flowers: row.flowers || '-',
      filler_flower_name: row.filler_flower_name || null,
      wrapping_name: row.wrapping_name || null,
      ribbon_name: row.ribbon_name || null,
      ribbon_color_name: row.ribbon_color_name || null,
      card_name: row.card_name || null,
      card_message: row.card_message || null,
      vase_name: row.vase_name || null,
      monetary_bouquet_name: row.monetary_bouquet_name || null,
      folding_style_name: row.folding_style_name || null,
      money_amount: row.money_amount ? Number(row.money_amount) : null,
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

// Employees for branch manager page (current branch only)
app.get('/api/manager/branch-employees/:branchId', async (req, res) => {
  try {
    const branchId = Number(req.params.branchId);
    if (Number.isNaN(branchId) || branchId <= 0) {
      return res.status(400).json({ error: 'Invalid branch ID' });
    }

    const roleTable = await getExistingTableName(['role', 'roles']);
    const roleNameColumn = roleTable ? await getExistingColumnName(roleTable, ['role_name', 'name']) : null;
    const phoneColumn = await getExistingColumnName('employee', ['phone', 'phone_number', 'mobile', 'tel']);
    const salaryColumn = await getExistingColumnName('employee', ['salary', 'base_salary', 'monthly_salary']);
    const createdAtColumn = await getExistingColumnName('employee', ['created_at', 'createdAt', 'join_date', 'hired_at']);
    const profileUrlColumn = await getExistingColumnName('employee', ['employee_profile_url', 'profile_url', 'profile_image_url']);

    const roleJoinSql = roleTable ? `LEFT JOIN ${roleTable} r ON r.role_id = e.role_id` : '';
    const roleNameSelectSql = roleNameColumn ? `r.${roleNameColumn}` : 'NULL';
    const phoneSelectSql = phoneColumn ? `e.${phoneColumn}` : 'NULL';
    const salarySelectSql = salaryColumn ? `e.${salaryColumn}` : '0';
    const createdAtSelectSql = createdAtColumn ? `e.${createdAtColumn}` : 'NULL';
    const profileUrlSelectSql = profileUrlColumn ? `e.${profileUrlColumn}` : 'NULL';

    const sql = `
      SELECT
        e.employee_id,
        e.username,
        e.role_id,
        e.branch_id,
        e.name,
        e.surname,
        ${profileUrlSelectSql} AS employee_profile_url,
        ${phoneSelectSql} AS phone,
        ${salarySelectSql} AS salary,
        ${createdAtSelectSql} AS created_at,
        b.branch_name,
        ${roleNameSelectSql} AS role_name
      FROM employee e
      LEFT JOIN branch b ON b.branch_id = e.branch_id
      ${roleJoinSql}
      WHERE e.branch_id = ?
      ORDER BY e.role_id ASC, e.employee_id ASC
    `;

    const [rows] = await pool.query(sql, [branchId]);
    return res.json(rows);
  } catch (err) {
    console.error('❌ Branch employees error:', err.message);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// Employee performance metrics for branch manager outstanding cards
app.get('/api/manager/employee-performance/:branchId', async (req, res) => {
  try {
    const branchId = Number(req.params.branchId);
    const month = String(req.query.month || '').trim();
    if (Number.isNaN(branchId) || branchId <= 0) {
      return res.status(400).json({ error: 'Invalid branch ID' });
    }

    const monthFilterSql = /^\d{4}-\d{2}$/.test(month)
      ? " AND DATE_FORMAT(o.created_at, '%Y-%m') = ?"
      : '';
    const monthParams = monthFilterSql ? [month] : [];

    const [rows] = await pool.query(
      `
      SELECT
        e.employee_id,
        COALESCE(e.average_rating, 0) AS average_rating,
        COALESCE(cashier.orders_count, 0) AS cashier_orders,
        COALESCE(florist.orders_count, 0) AS florist_orders,
        COALESCE(florist.avg_minutes, 0) AS florist_avg_minutes,
        COALESCE(rider.orders_count, 0) AS rider_orders,
        COALESCE(rider.avg_minutes, 0) AS rider_avg_minutes
      FROM employee e
      LEFT JOIN (
        SELECT
          p.employee_id,
          COUNT(DISTINCT p.order_id) AS orders_count
        FROM payment p
        JOIN orders o ON o.order_id = p.order_id
        WHERE o.branch_id = ? AND p.employee_id IS NOT NULL${monthFilterSql}
        GROUP BY p.employee_id
      ) cashier ON cashier.employee_id = e.employee_id
      LEFT JOIN (
        SELECT
          p.employee_id,
          COUNT(DISTINCT p.order_id) AS orders_count,
          AVG(
            CASE
              WHEN p.assigned_at IS NOT NULL AND p.completed_at IS NOT NULL
                THEN TIMESTAMPDIFF(MINUTE, p.assigned_at, p.completed_at)
              ELSE NULL
            END
          ) AS avg_minutes
        FROM prepare p
        JOIN orders o ON o.order_id = p.order_id
        WHERE o.branch_id = ? AND p.employee_id IS NOT NULL${monthFilterSql}
        GROUP BY p.employee_id
      ) florist ON florist.employee_id = e.employee_id
      LEFT JOIN (
        SELECT
          d.employee_id,
          COUNT(DISTINCT d.order_id) AS orders_count,
          AVG(
            CASE
              WHEN d.assigned_at IS NOT NULL AND d.completed_at IS NOT NULL
                THEN TIMESTAMPDIFF(MINUTE, d.assigned_at, d.completed_at)
              ELSE NULL
            END
          ) AS avg_minutes
        FROM delivery d
        JOIN orders o ON o.order_id = d.order_id
        WHERE o.branch_id = ? AND d.employee_id IS NOT NULL${monthFilterSql}
        GROUP BY d.employee_id
      ) rider ON rider.employee_id = e.employee_id
      WHERE e.branch_id = ?
      `,
      [
        branchId,
        ...monthParams,
        branchId,
        ...monthParams,
        branchId,
        ...monthParams,
        branchId,
      ]
    );

    return res.json(
      Array.isArray(rows)
        ? rows.map((row) => ({
            employee_id: Number(row.employee_id || 0),
            average_rating: Number(row.average_rating || 0),
            cashier_orders: Number(row.cashier_orders || 0),
            florist_orders: Number(row.florist_orders || 0),
            florist_avg_minutes: Number(row.florist_avg_minutes || 0),
            rider_orders: Number(row.rider_orders || 0),
            rider_avg_minutes: Number(row.rider_avg_minutes || 0),
          }))
        : []
    );
  } catch (err) {
    console.error('❌ Employee performance error:', err.message);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// Manager Dashboard Stats endpoint
app.get('/api/manager/dashboard-stats/:branchId', async (req, res) => {
  try {
    const { branchId } = req.params;
    const { date_range, product_type_id, member_level } = req.query || {};
    const params = [Number(branchId)];
    const ordersTable = 'orders';

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

    // Build member level filter condition
    let memberLevelCondition = '';
    const memberLevelParams = [];
    const memberLevelRaw = String(member_level || '').trim();
    if (memberLevelRaw && memberLevelRaw.toLowerCase() !== 'all') {
      const normalizedMemberLevel = memberLevelRaw.toLowerCase();
      const levelIdMap = {
        member: 1,
        silver: 2,
        gold: 3,
        platinum: 4,
      };
      const mappedId = levelIdMap[normalizedMemberLevel];
      if (Number.isFinite(mappedId)) {
        memberLevelCondition = ' AND c.member_level_id = ?';
        memberLevelParams.push(mappedId);
      } else if (/^\d+$/.test(memberLevelRaw)) {
        memberLevelCondition = ' AND c.member_level_id = ?';
        memberLevelParams.push(Number(memberLevelRaw));
      } else {
        memberLevelCondition = ' AND LOWER(COALESCE(ml.member_level_name, "")) = ?';
        memberLevelParams.push(normalizedMemberLevel);
      }
    }

    // Total revenue with date and product type filter
    const revenueSql = `
      SELECT IFNULL(SUM(total_amount), 0) AS total_revenue
      FROM ${ordersTable} o
      JOIN customer c ON c.customer_id = o.customer_id
      LEFT JOIN member_level ml ON ml.member_level_id = c.member_level_id
      WHERE o.branch_id = ?${dateCondition}${productTypeCondition}${memberLevelCondition}
    `;
    const revenueParams = [...params, ...dateParams, ...productTypeParams, ...memberLevelParams];
    const [[revenueRow]] = await pool.query(revenueSql, revenueParams);

    // Order count with date and product type filter
    const orderCountSql = `
      SELECT COUNT(*) AS total_orders
      FROM ${ordersTable} o
      JOIN customer c ON c.customer_id = o.customer_id
      LEFT JOIN member_level ml ON ml.member_level_id = c.member_level_id
      WHERE o.branch_id = ?${dateCondition}${productTypeCondition}${memberLevelCondition}
    `;
    const orderCountParams = [...params, ...dateParams, ...productTypeParams, ...memberLevelParams];
    const [[orderCountRow]] = await pool.query(orderCountSql, orderCountParams);

    // Orders in progress (order_status IN 'received', 'preparing', 'shipping') with date and product type filter
    const inProgressSql = `
      SELECT COUNT(*) AS in_progress_orders
      FROM ${ordersTable} o
      JOIN customer c ON c.customer_id = o.customer_id
      LEFT JOIN member_level ml ON ml.member_level_id = c.member_level_id
      WHERE o.branch_id = ?${dateCondition} AND o.order_status IN ('received', 'preparing', 'shipping')${productTypeCondition}${memberLevelCondition}
    `;
    const inProgressParams = [...params, ...dateParams, ...productTypeParams, ...memberLevelParams];
    const [[inProgressRow]] = await pool.query(inProgressSql, inProgressParams);

    // Available products (distinct products sold under current filters)
    const availableProductsSql = `
      SELECT COUNT(DISTINCT pr.product_id) AS available_products
      FROM ${ordersTable} o
      JOIN customer c ON c.customer_id = o.customer_id
      LEFT JOIN member_level ml ON ml.member_level_id = c.member_level_id
      JOIN shopping_cart sc ON sc.order_id = o.order_id
      JOIN product pr ON pr.product_id = sc.product_id
      WHERE o.branch_id = ?${dateCondition}${productTypeCondition}${memberLevelCondition}
    `;
    const availableProductsParams = [...params, ...dateParams, ...productTypeParams, ...memberLevelParams];
    const [[availableProductsRow]] = await pool.query(availableProductsSql, availableProductsParams);

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
    const statusFilter = String(req.query.status || 'all').trim().toLowerCase();

    const ordersTable = 'orders';
    const customerNoteColumn = await getExistingColumnName(ordersTable, ['customer_note']);
    const customerNoteSelect = customerNoteColumn ? `o.${customerNoteColumn}` : 'NULL';
    const statusSql = statusFilter === 'all' ? '' : ' AND o.order_status = ?';
    const shippingAvailabilitySql = statusFilter === 'shipping'
      ? " AND NOT EXISTS (SELECT 1 FROM delivery d_active WHERE d_active.order_id = o.order_id AND d_active.delivery_status IN ('assigning', 'delivering'))"
      : '';
    const params = statusFilter === 'all' ? [branchId] : [branchId, statusFilter];

    const [r] = await pool.query(
      `SELECT 
        o.order_id,
        o.order_code,
        o.branch_id,
        o.customer_id,
        c.customer_name,
        c.phone,
        c.member_level_id,
        ml.member_level_name,
        oa.receiver_name,
        oa.receiver_phone,
        oa.receiver_address,
        o.total_amount,
        o.order_status,
        o.created_at,
        ${customerNoteSelect} AS customer_note,
        oi.ordered_items,
        p.employee_id AS verified_employee_id,
        p.verified_at,
        p.verified_result,
        TRIM(CONCAT(COALESCE(verifier.name, ''), ' ', COALESCE(verifier.surname, ''))) AS verified_by_name,
        prep.employee_id AS florist_employee_id,
        TRIM(CONCAT(COALESCE(florist.name, ''), ' ', COALESCE(florist.surname, ''))) AS florist_name,
        pm.payment_method_name
      FROM ${ordersTable} o
      JOIN customer c ON o.customer_id = c.customer_id
      LEFT JOIN member_level ml ON c.member_level_id = ml.member_level_id
      LEFT JOIN order_address oa ON oa.order_id = o.order_id
      LEFT JOIN (
        SELECT
          sc.order_id,
          GROUP_CONCAT(
            DISTINCT CONCAT_WS(
              ' | ',
              CONCAT('สินค้า: ', COALESCE(pr.product_name, '-')),
              CONCAT('ประเภท: ', COALESCE(pt.product_type_name, '-')),
              CASE
                WHEN flowers.main_flowers IS NOT NULL AND flowers.main_flowers <> ''
                  THEN CONCAT('ดอกหลัก: ', flowers.main_flowers)
                ELSE NULL
              END,
              CASE
                WHEN ff.filler_flower_name IS NOT NULL AND ff.filler_flower_name <> ''
                  THEN CONCAT('ดอกแซม: ', ff.filler_flower_name)
                ELSE NULL
              END,
              CASE
                WHEN wm.wrapping_name IS NOT NULL AND wm.wrapping_name <> ''
                  THEN CONCAT('ช่อ/ห่อ: ', wm.wrapping_name)
                ELSE NULL
              END,
              CASE
                WHEN r.ribbon_name IS NOT NULL OR rc.ribbon_color_name IS NOT NULL
                  THEN CONCAT('ริบบิ้น: ', COALESCE(r.ribbon_name, '-'), IF(rc.ribbon_color_name IS NOT NULL, CONCAT(' (', rc.ribbon_color_name, ')'), ''))
                ELSE NULL
              END,
              CASE
                WHEN v.vase_name IS NOT NULL AND v.vase_name <> ''
                  THEN CONCAT('ทรงแจกัน: ', v.vase_name)
                ELSE NULL
              END,
              CASE
                WHEN c.card_name IS NOT NULL AND c.card_name <> ''
                  THEN CONCAT('การ์ด: ', c.card_name)
                ELSE NULL
              END,
              CASE
                WHEN cd.message IS NOT NULL AND cd.message <> ''
                  THEN CONCAT('ข้อความ: ', cd.message)
                ELSE NULL
              END,
              CASE
                WHEN mb.monetary_bouquet_name IS NOT NULL AND mb.monetary_bouquet_name <> ''
                  THEN CONCAT('ช่อเงิน: ', mb.monetary_bouquet_name)
                ELSE NULL
              END,
              CASE
                WHEN fs.folding_style_name IS NOT NULL AND fs.folding_style_name <> ''
                  THEN CONCAT('ทรงพับเงิน: ', fs.folding_style_name)
                ELSE NULL
              END,
              CASE
                WHEN mbd.amount IS NOT NULL THEN CONCAT('จำนวนเงิน: ', mbd.amount)
                ELSE NULL
              END
            )
            ORDER BY sc.shopping_cart_id
            SEPARATOR ' || '
          ) AS ordered_items
        FROM shopping_cart sc
        JOIN product pr ON pr.product_id = sc.product_id
        LEFT JOIN product_type pt ON pt.product_type_id = pr.product_type_id
        LEFT JOIN (
          SELECT
            fd.shopping_cart_id,
            GROUP_CONCAT(CONCAT(f.flower_name, ' x', fd.quantity) ORDER BY f.flower_name SEPARATOR ', ') AS main_flowers
          FROM flower_detail fd
          JOIN flower f ON f.flower_id = fd.flower_id
          GROUP BY fd.shopping_cart_id
        ) flowers ON flowers.shopping_cart_id = sc.shopping_cart_id
        LEFT JOIN filler_flower_detail ffd ON ffd.shopping_cart_id = sc.shopping_cart_id
        LEFT JOIN filler_flower ff ON ff.filler_flower_id = ffd.filler_flower_id
        LEFT JOIN wrapping_detail wd ON wd.shopping_cart_id = sc.shopping_cart_id
        LEFT JOIN wrapping_material wm ON wm.wrapping_id = wd.wrapping_id
        LEFT JOIN ribbon_detail rd ON rd.shopping_cart_id = sc.shopping_cart_id
        LEFT JOIN ribbon r ON r.ribbon_id = rd.ribbon_id
        LEFT JOIN ribbon_color rc ON rc.ribbon_color_id = rd.ribbon_color_id
        LEFT JOIN card_detail cd ON cd.shopping_cart_id = sc.shopping_cart_id
        LEFT JOIN card c ON c.card_id = cd.card_id
        LEFT JOIN vase_customization vc ON vc.shopping_cart_id = sc.shopping_cart_id
        LEFT JOIN vase v ON v.vase_id = vc.vase_id
        LEFT JOIN monetary_bouquet_detail mbd ON mbd.shopping_cart_id = sc.shopping_cart_id
        LEFT JOIN monetary_bouquet mb ON mb.monetary_bouquet_id = mbd.monetary_bouquet_id
        LEFT JOIN folding_style fs ON fs.folding_style_id = mbd.folding_style_id
        GROUP BY sc.order_id
      ) oi ON oi.order_id = o.order_id
      LEFT JOIN payment p ON o.order_id = p.order_id
      LEFT JOIN payment_method pm ON p.payment_method_id = pm.payment_method_id
      LEFT JOIN employee verifier ON p.employee_id = verifier.employee_id
      LEFT JOIN prepare prep ON prep.order_id = o.order_id
      LEFT JOIN employee florist ON prep.employee_id = florist.employee_id
      WHERE o.branch_id = ?${statusSql}${shippingAvailabilitySql}
      ORDER BY o.created_at DESC`,
      params
    );

    res.json(r);

  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});

// Get full order details with shopping cart items (for cashier detail expansion)
app.get('/api/order/:orderId', async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    if (Number.isNaN(orderId) || orderId <= 0) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const ordersTable = 'orders';
    const customerNoteColumn = await getExistingColumnName(ordersTable, ['customer_note']);
    const customerNoteSelect = customerNoteColumn ? `o.${customerNoteColumn}` : 'NULL';

    // Fetch order details
    const [orderRows] = await pool.query(
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
        ${customerNoteSelect} AS customer_note,
        pm.payment_method_name,
        b.branch_name,
        oa.receiver_name,
        oa.receiver_phone,
        oa.receiver_address
      FROM ${ordersTable} o
      JOIN customer c ON o.customer_id = c.customer_id
      LEFT JOIN payment p ON o.order_id = p.order_id
      LEFT JOIN payment_method pm ON p.payment_method_id = pm.payment_method_id
      LEFT JOIN branch b ON o.branch_id = b.branch_id
      LEFT JOIN order_address oa ON o.order_id = oa.order_id
      WHERE o.order_id = ?
      LIMIT 1`,
      [orderId]
    );

    if (!orderRows || orderRows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Fetch shopping cart items with all customization details
    const [cartItems] = await pool.query(
      `SELECT 
        sc.*,
        pr.product_name,
        pr.product_img,
        pt.product_type_name,
        GROUP_CONCAT(DISTINCT CONCAT(f.flower_name, ' x', fd.quantity) ORDER BY f.flower_name SEPARATOR ', ') AS flowers,
        ff.filler_flower_name,
        wm.wrapping_name,
        r.ribbon_name,
        rc.ribbon_color_name,
        c.card_name,
        cd.message AS card_message,
        v.vase_name,
        mb.monetary_bouquet_name,
        fs.folding_style_name,
        mbd.amount AS money_amount
      FROM shopping_cart sc
      JOIN product pr ON pr.product_id = sc.product_id
      LEFT JOIN product_type pt ON pt.product_type_id = pr.product_type_id
      LEFT JOIN flower_detail fd ON fd.shopping_cart_id = sc.shopping_cart_id
      LEFT JOIN flower f ON f.flower_id = fd.flower_id
      LEFT JOIN filler_flower_detail ffd ON ffd.shopping_cart_id = sc.shopping_cart_id
      LEFT JOIN filler_flower ff ON ff.filler_flower_id = ffd.filler_flower_id
      LEFT JOIN wrapping_detail wd ON wd.shopping_cart_id = sc.shopping_cart_id
      LEFT JOIN wrapping_material wm ON wm.wrapping_id = wd.wrapping_id
      LEFT JOIN ribbon_detail rd ON rd.shopping_cart_id = sc.shopping_cart_id
      LEFT JOIN ribbon r ON r.ribbon_id = rd.ribbon_id
      LEFT JOIN ribbon_color rc ON rc.ribbon_color_id = rd.ribbon_color_id
      LEFT JOIN card_detail cd ON cd.shopping_cart_id = sc.shopping_cart_id
      LEFT JOIN card c ON c.card_id = cd.card_id
      LEFT JOIN vase_customization vc ON vc.shopping_cart_id = sc.shopping_cart_id
      LEFT JOIN vase v ON v.vase_id = vc.vase_id
      LEFT JOIN monetary_bouquet_detail mbd ON mbd.shopping_cart_id = sc.shopping_cart_id
      LEFT JOIN monetary_bouquet mb ON mb.monetary_bouquet_id = mbd.monetary_bouquet_id
      LEFT JOIN folding_style fs ON fs.folding_style_id = mbd.folding_style_id
      WHERE sc.order_id = ?
      GROUP BY 
        sc.shopping_cart_id,
        sc.order_id,
        sc.product_id,
        sc.total_price,
        pr.product_name,
        pr.product_img,
        pt.product_type_name,
        ff.filler_flower_name,
        wm.wrapping_name,
        r.ribbon_name,
        rc.ribbon_color_name,
        c.card_name,
        cd.message,
        v.vase_name,
        mb.monetary_bouquet_name,
        fs.folding_style_name,
        mbd.amount
      ORDER BY sc.shopping_cart_id ASC`,
      [orderId]
    );

    const order = orderRows[0];
    const items = cartItems.map((row) => ({
      ...row,
      price_total: Number(row.total_price || 0),
      flowers: row.flowers || '-',
      filler_flower_name: row.filler_flower_name || null,
      wrapping_name: row.wrapping_name || null,
      ribbon_name: row.ribbon_name || null,
      ribbon_color_name: row.ribbon_color_name || null,
      card_name: row.card_name || null,
      card_message: row.card_message || null,
      vase_name: row.vase_name || null,
      monetary_bouquet_name: row.monetary_bouquet_name || null,
      folding_style_name: row.folding_style_name || null,
      money_amount: row.money_amount ? Number(row.money_amount) : null,
    }));

    return res.json({
      order,
      items
    });
  } catch (err) {
    console.error('❌ Get Order Details Error:', err.message);
    return res.status(500).json({ error: 'Failed to load order details', detail: err.message });
  }
});



app.listen(PORT, () => console.log(`✅ API listening on http://localhost:${PORT}`));

// Update order status (by order_id or order_code)
app.put('/api/order/:orderIdentifier/status', async (req, res) => {
  try {
    const { orderIdentifier } = req.params;
    const { status, employee_id, verified_result } = req.body || {};
    if (!status) return res.status(400).json({ message: 'status is required' });

    // Normalize status aliases to match enum definitions across environments
    const requestedStatus = String(status).toLowerCase().trim();
    const [statusColumnRows] = await pool.query("SHOW COLUMNS FROM orders LIKE 'order_status'");
    const statusColumn = statusColumnRows?.[0]?.Type || '';
    const enumBodyMatch = statusColumn.match(/enum\((.*)\)/i);
    const enumBody = enumBodyMatch?.[1] || '';
    const allowedStatuses = Array.from(enumBody.matchAll(/'([^']+)'/g)).map((m) => m[1]);

    let normalizedStatus = requestedStatus;
    if (requestedStatus === 'canceled' && allowedStatuses.includes('cancelled')) {
      normalizedStatus = 'cancelled';
    }
    if (requestedStatus === 'cancelled' && allowedStatuses.includes('canceled')) {
      normalizedStatus = 'canceled';
    }
    if (requestedStatus === 'rejected' && allowedStatuses.includes('cancelled')) {
      normalizedStatus = 'cancelled';
    }
    if (requestedStatus === 'rejected' && allowedStatuses.includes('canceled')) {
      normalizedStatus = 'canceled';
    }

    if (allowedStatuses.length > 0 && !allowedStatuses.includes(normalizedStatus)) {
      return res.status(400).json({
        message: 'Invalid status value',
        allowedStatuses
      });
    }

    // Try to treat identifier as numeric order_id, otherwise use order_code
    const maybeId = Number(orderIdentifier);
    let orderId;
    let result;
    if (!Number.isNaN(maybeId)) {
      [result] = await pool.query('UPDATE orders SET order_status = ? WHERE order_id = ?', [normalizedStatus, maybeId]);
      orderId = maybeId;
    } else {
      [result] = await pool.query('UPDATE orders SET order_status = ? WHERE order_code = ?', [normalizedStatus, orderIdentifier]);
      // Get order_id from order_code
      const [orderRows] = await pool.query('SELECT order_id FROM orders WHERE order_code = ?', [orderIdentifier]);
      orderId = orderRows[0]?.order_id || null;
    }

    // Update payment table with verification details
    if (orderId && verified_result) {
      // Get Thailand timezone (GMT+7)
      const now = new Date();
      const thaiTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
      const verifiedAt = thaiTime.toISOString().slice(0, 19).replace('T', ' ');
      await pool.query(
        'UPDATE payment SET employee_id = ?, verified_at = ?, verified_result = ? WHERE order_id = ?',
        [employee_id || null, verifiedAt, verified_result, orderId]
      );
    }

    return res.json({ success: true, changedRows: result.affectedRows || 0, status: normalizedStatus });
  } catch (err) {
    console.error('❌ Update order status error:', err);
    return res.status(500).json({ message: 'Server error', detail: err.message });
  }
});

// Create prepare record when florist accepts order
app.post('/api/prepare', async (req, res) => {
  try {
    const { order_id, employee_id } = req.body || {};
    if (!order_id || !employee_id) {
      return res.status(400).json({ message: 'order_id and employee_id are required' });
    }

    // Check if prepare record already exists
    const [existing] = await pool.query('SELECT * FROM prepare WHERE order_id = ? LIMIT 1', [order_id]);
    if (existing && existing.length > 0) {
      const row = existing[0];
      const isActiveTask = ['assigning', 'preparing'].includes(String(row.prepare_status || '').toLowerCase());
      const sameEmployee = Number(row.employee_id) === Number(employee_id);

      // Idempotent behavior: if same florist clicks accept again, keep it successful and sync order status.
      if (isActiveTask && sameEmployee) {
        await pool.query('UPDATE orders SET order_status = ? WHERE order_id = ?', ['preparing', order_id]);
        return res.json({
          success: true,
          prepare_id: row.prepare_id,
          already_assigned: true,
          message: 'Order already assigned to this florist'
        });
      }

      if (isActiveTask && !sameEmployee) {
        return res.status(409).json({
          success: false,
          message: 'Order is already assigned to another florist'
        });
      }

      // Re-open/overwrite old completed row for re-assignment if needed.
      const now = new Date();
      const thaiTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
      const assignedAt = thaiTime.toISOString().slice(0, 19).replace('T', ' ');
      await pool.query(
        'UPDATE prepare SET employee_id = ?, prepare_status = ?, assigned_at = ?, completed_at = NULL WHERE prepare_id = ?',
        [employee_id, 'assigning', assignedAt, row.prepare_id]
      );
      await pool.query('UPDATE orders SET order_status = ? WHERE order_id = ?', ['preparing', order_id]);
      return res.json({ success: true, prepare_id: row.prepare_id, reassigned: true });
    }

    // Get Thailand timezone
    const now = new Date();
    const thaiTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const assignedAt = thaiTime.toISOString().slice(0, 19).replace('T', ' ');

    // Insert prepare record
    const [result] = await pool.query(
      'INSERT INTO prepare (order_id, employee_id, prepare_status, assigned_at) VALUES (?, ?, ?, ?)',
      [order_id, employee_id, 'assigning', assignedAt]
    );

    // Update order status to 'preparing'
    await pool.query('UPDATE orders SET order_status = ? WHERE order_id = ?', ['preparing', order_id]);

    return res.json({ success: true, prepare_id: result.insertId });
  } catch (err) {
    console.error('❌ Create prepare record error:', err);
    return res.status(500).json({ message: 'Server error', detail: err.message });
  }
});

// Get florist's preparing orders
app.get('/api/prepare/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    if (!employeeId) {
      return res.status(400).json({ message: 'employeeId is required' });
    }

    const [rows] = await pool.query(`
      SELECT 
        o.order_id, o.order_code, o.customer_id, c.customer_name, c.phone,
        c.member_level_id, ml.member_level_name,
        o.total_amount, o.created_at, oa.receiver_name, oa.receiver_phone, oa.receiver_address,
        pay.employee_id AS verified_employee_id,
        pay.verified_at,
        pay.verified_result,
        TRIM(CONCAT(COALESCE(verifier.name, ''), ' ', COALESCE(verifier.surname, ''))) AS verified_by_name,
        oi.ordered_items,
        p.prepare_id, p.employee_id, p.assigned_at, p.florist_photo_url, p.completed_at, p.prepare_status
      FROM orders o
      LEFT JOIN prepare p ON o.order_id = p.order_id
      LEFT JOIN customer c ON o.customer_id = c.customer_id
      LEFT JOIN member_level ml ON c.member_level_id = ml.member_level_id
      LEFT JOIN order_address oa ON oa.order_id = o.order_id
      LEFT JOIN payment pay ON pay.order_id = o.order_id
      LEFT JOIN employee verifier ON pay.employee_id = verifier.employee_id
      LEFT JOIN (
        SELECT
          sc.order_id,
          GROUP_CONCAT(
            DISTINCT CONCAT_WS(
              ' | ',
              CONCAT('สินค้า: ', COALESCE(pr.product_name, '-')),
              CONCAT('ประเภท: ', COALESCE(pt.product_type_name, '-')),
              CASE
                WHEN flowers.main_flowers IS NOT NULL AND flowers.main_flowers <> ''
                  THEN CONCAT('ดอกหลัก: ', flowers.main_flowers)
                ELSE NULL
              END,
              CASE
                WHEN ff.filler_flower_name IS NOT NULL AND ff.filler_flower_name <> ''
                  THEN CONCAT('ดอกแซม: ', ff.filler_flower_name)
                ELSE NULL
              END,
              CASE
                WHEN wm.wrapping_name IS NOT NULL AND wm.wrapping_name <> ''
                  THEN CONCAT('ช่อ/ห่อ: ', wm.wrapping_name)
                ELSE NULL
              END,
              CASE
                WHEN r.ribbon_name IS NOT NULL OR rc.ribbon_color_name IS NOT NULL
                  THEN CONCAT('ริบบิ้น: ', COALESCE(r.ribbon_name, '-'), IF(rc.ribbon_color_name IS NOT NULL, CONCAT(' (', rc.ribbon_color_name, ')'), ''))
                ELSE NULL
              END,
              CASE
                WHEN v.vase_name IS NOT NULL AND v.vase_name <> ''
                  THEN CONCAT('ทรงแจกัน: ', v.vase_name)
                ELSE NULL
              END,
              CASE
                WHEN c.card_name IS NOT NULL AND c.card_name <> ''
                  THEN CONCAT('การ์ด: ', c.card_name)
                ELSE NULL
              END,
              CASE
                WHEN cd.message IS NOT NULL AND cd.message <> ''
                  THEN CONCAT('ข้อความ: ', cd.message)
                ELSE NULL
              END,
              CASE
                WHEN mb.monetary_bouquet_name IS NOT NULL AND mb.monetary_bouquet_name <> ''
                  THEN CONCAT('ช่อเงิน: ', mb.monetary_bouquet_name)
                ELSE NULL
              END,
              CASE
                WHEN fs.folding_style_name IS NOT NULL AND fs.folding_style_name <> ''
                  THEN CONCAT('ทรงพับเงิน: ', fs.folding_style_name)
                ELSE NULL
              END,
              CASE
                WHEN mbd.amount IS NOT NULL THEN CONCAT('จำนวนเงิน: ', mbd.amount)
                ELSE NULL
              END
            )
            ORDER BY sc.shopping_cart_id
            SEPARATOR ' || '
          ) AS ordered_items
        FROM shopping_cart sc
        JOIN product pr ON pr.product_id = sc.product_id
        LEFT JOIN product_type pt ON pt.product_type_id = pr.product_type_id
        LEFT JOIN (
          SELECT
            fd.shopping_cart_id,
            GROUP_CONCAT(CONCAT(f.flower_name, ' x', fd.quantity) ORDER BY f.flower_name SEPARATOR ', ') AS main_flowers
          FROM flower_detail fd
          JOIN flower f ON f.flower_id = fd.flower_id
          GROUP BY fd.shopping_cart_id
        ) flowers ON flowers.shopping_cart_id = sc.shopping_cart_id
        LEFT JOIN filler_flower_detail ffd ON ffd.shopping_cart_id = sc.shopping_cart_id
        LEFT JOIN filler_flower ff ON ff.filler_flower_id = ffd.filler_flower_id
        LEFT JOIN wrapping_detail wd ON wd.shopping_cart_id = sc.shopping_cart_id
        LEFT JOIN wrapping_material wm ON wm.wrapping_id = wd.wrapping_id
        LEFT JOIN ribbon_detail rd ON rd.shopping_cart_id = sc.shopping_cart_id
        LEFT JOIN ribbon r ON r.ribbon_id = rd.ribbon_id
        LEFT JOIN ribbon_color rc ON rc.ribbon_color_id = rd.ribbon_color_id
        LEFT JOIN card_detail cd ON cd.shopping_cart_id = sc.shopping_cart_id
        LEFT JOIN card c ON c.card_id = cd.card_id
        LEFT JOIN vase_customization vc ON vc.shopping_cart_id = sc.shopping_cart_id
        LEFT JOIN vase v ON v.vase_id = vc.vase_id
        LEFT JOIN monetary_bouquet_detail mbd ON mbd.shopping_cart_id = sc.shopping_cart_id
        LEFT JOIN monetary_bouquet mb ON mb.monetary_bouquet_id = mbd.monetary_bouquet_id
        LEFT JOIN folding_style fs ON fs.folding_style_id = mbd.folding_style_id
        GROUP BY sc.order_id
      ) oi ON oi.order_id = o.order_id
      WHERE p.employee_id = ? AND p.prepare_status IN ('assigning', 'preparing')
      ORDER BY o.created_at DESC
    `, [employeeId]);

    return res.json(rows || []);
  } catch (err) {
    console.error('❌ Get prepare orders error:', err);
    return res.status(500).json({ message: 'Server error', detail: err.message });
  }
});

// Complete prepare task
app.put('/api/prepare/:orderId', floristPhotoUpload.single('florist_photo'), async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    const { florist_photo_url } = req.body || {};
    if (!Number.isFinite(orderId) || orderId <= 0) {
      return res.status(400).json({ message: 'orderId is required' });
    }

    const uploadedPhotoUrl = req.file
      ? `${req.protocol}://${req.get('host')}/uploads/florist/${req.file.filename}`
      : null;
    const finalPhotoUrl = uploadedPhotoUrl || florist_photo_url || null;

    // Get Thailand timezone
    const now = new Date();
    const thaiTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const completedAt = thaiTime.toISOString().slice(0, 19).replace('T', ' ');

    // Update prepare record
    const [result] = await pool.query(
      'UPDATE prepare SET florist_photo_url = ?, completed_at = ?, prepare_status = ? WHERE order_id = ?',
      [finalPhotoUrl, completedAt, 'completed', orderId]
    );

    // Pickup orders should finish at success and not be forwarded to rider.
    const [addressRows] = await pool.query(
      'SELECT receiver_address FROM order_address WHERE order_id = ? LIMIT 1',
      [orderId]
    );
    const receiverAddress = String(addressRows?.[0]?.receiver_address || '').trim();
    const isPickup = receiverAddress === 'ที่ร้าน';
    const nextOrderStatus = isPickup ? 'success' : 'shipping';

    await pool.query('UPDATE orders SET order_status = ? WHERE order_id = ?', [nextOrderStatus, orderId]);

    return res.json({ success: true, changedRows: result.affectedRows || 0, order_status: nextOrderStatus });
  } catch (err) {
    console.error('❌ Complete prepare error:', err);
    return res.status(500).json({ message: 'Server error', detail: err.message });
  }
});

// Create delivery record when rider accepts shipping order
app.post('/api/delivery', async (req, res) => {
  try {
    const { order_id, employee_id } = req.body || {};
    if (!order_id || !employee_id) {
      return res.status(400).json({ message: 'order_id and employee_id are required' });
    }

    const [existing] = await pool.query('SELECT * FROM delivery WHERE order_id = ? LIMIT 1', [order_id]);
    if (Array.isArray(existing) && existing.length > 0) {
      const row = existing[0];
      const status = String(row.delivery_status || '').toLowerCase();
      const isActiveTask = ['assigning', 'delivering'].includes(status);
      const sameEmployee = Number(row.employee_id) === Number(employee_id);

      if (isActiveTask && sameEmployee) {
        await pool.query('UPDATE orders SET order_status = ? WHERE order_id = ?', ['shipping', order_id]);
        return res.json({ success: true, delivery_id: row.delivery_id, already_assigned: true });
      }

      if (isActiveTask && !sameEmployee) {
        return res.status(409).json({ success: false, message: 'Order is already assigned to another rider' });
      }

      const now = new Date();
      const thaiTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
      const assignedAt = thaiTime.toISOString().slice(0, 19).replace('T', ' ');
      await pool.query(
        'UPDATE delivery SET employee_id = ?, delivery_status = ?, assigned_at = ?, completed_at = NULL WHERE delivery_id = ?',
        [employee_id, 'assigning', assignedAt, row.delivery_id]
      );
      await pool.query('UPDATE orders SET order_status = ? WHERE order_id = ?', ['shipping', order_id]);
      return res.json({ success: true, delivery_id: row.delivery_id, reassigned: true });
    }

    const now = new Date();
    const thaiTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const assignedAt = thaiTime.toISOString().slice(0, 19).replace('T', ' ');

    const [result] = await pool.query(
      'INSERT INTO delivery (order_id, employee_id, delivery_status, assigned_at) VALUES (?, ?, ?, ?)',
      [order_id, employee_id, 'assigning', assignedAt]
    );

    await pool.query('UPDATE orders SET order_status = ? WHERE order_id = ?', ['shipping', order_id]);

    return res.json({ success: true, delivery_id: result.insertId });
  } catch (err) {
    console.error('❌ Create delivery record error:', err);
    return res.status(500).json({ message: 'Server error', detail: err.message });
  }
});

// Get rider's active delivery tasks
app.get('/api/delivery/employee/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    if (!employeeId) {
      return res.status(400).json({ message: 'employeeId is required' });
    }

    const [rows] = await pool.query(
      `
      SELECT
        o.order_id, o.order_code, o.customer_id, c.customer_name, c.phone,
        c.member_level_id, ml.member_level_name,
        o.total_amount, o.created_at, oa.receiver_name, oa.receiver_phone, oa.receiver_address,
        oi.ordered_items,
        d.delivery_id, d.employee_id, d.assigned_at, d.rider_photo_url, d.completed_at, d.delivery_status,
        prep.employee_id AS florist_employee_id,
        TRIM(CONCAT(COALESCE(florist.name, ''), ' ', COALESCE(florist.surname, ''))) AS florist_name
      FROM orders o
      LEFT JOIN delivery d ON o.order_id = d.order_id
      LEFT JOIN customer c ON o.customer_id = c.customer_id
      LEFT JOIN member_level ml ON c.member_level_id = ml.member_level_id
      LEFT JOIN order_address oa ON oa.order_id = o.order_id
      LEFT JOIN prepare prep ON prep.order_id = o.order_id
      LEFT JOIN employee florist ON prep.employee_id = florist.employee_id
      LEFT JOIN (
        SELECT
          sc.order_id,
          GROUP_CONCAT(DISTINCT pr.product_name ORDER BY pr.product_name SEPARATOR ', ') AS ordered_items
        FROM shopping_cart sc
        JOIN product pr ON pr.product_id = sc.product_id
        GROUP BY sc.order_id
      ) oi ON oi.order_id = o.order_id
      WHERE d.employee_id = ? AND d.delivery_status IN ('assigning', 'delivering')
      ORDER BY o.created_at DESC
      `,
      [employeeId]
    );

    return res.json(rows || []);
  } catch (err) {
    console.error('❌ Get rider delivery orders error:', err);
    return res.status(500).json({ message: 'Server error', detail: err.message });
  }
});

// Get delivery detail by order for rider delivery screen
app.get('/api/delivery/order/:orderId', async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    if (!Number.isFinite(orderId) || orderId <= 0) {
      return res.status(400).json({ message: 'Invalid orderId' });
    }

    const [rows] = await pool.query(
      `
      SELECT
        o.order_id, o.order_code, o.order_status, o.total_amount, o.created_at,
        c.customer_name, c.phone,
        oa.receiver_name, oa.receiver_phone, oa.receiver_address,
        d.delivery_id, d.employee_id, d.delivery_status, d.rider_photo_url, d.assigned_at, d.completed_at
      FROM orders o
      LEFT JOIN customer c ON c.customer_id = o.customer_id
      LEFT JOIN order_address oa ON oa.order_id = o.order_id
      LEFT JOIN delivery d ON d.order_id = o.order_id
      WHERE o.order_id = ?
      LIMIT 1
      `,
      [orderId]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error('❌ Get delivery detail error:', err);
    return res.status(500).json({ message: 'Server error', detail: err.message });
  }
});

// Complete delivery with rider photo and update order to delivered
app.put('/api/delivery/:orderId/complete', riderPhotoUpload.single('rider_photo'), async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    const { rider_photo_url } = req.body || {};
    if (!Number.isFinite(orderId) || orderId <= 0) {
      return res.status(400).json({ message: 'Invalid orderId' });
    }

    const uploadedPhotoUrl = req.file
      ? `${req.protocol}://${req.get('host')}/uploads/rider/${req.file.filename}`
      : null;
    const finalPhotoUrl = uploadedPhotoUrl || rider_photo_url || null;

    if (!finalPhotoUrl) {
      return res.status(400).json({ message: 'rider photo is required' });
    }

    const now = new Date();
    const thaiTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const completedAt = thaiTime.toISOString().slice(0, 19).replace('T', ' ');

    const [result] = await pool.query(
      'UPDATE delivery SET rider_photo_url = ?, completed_at = ?, delivery_status = ? WHERE order_id = ?',
      [finalPhotoUrl, completedAt, 'completed', orderId]
    );

    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ message: 'Delivery task not found for this order' });
    }

    await pool.query('UPDATE orders SET order_status = ? WHERE order_id = ?', ['delivered', orderId]);

    return res.json({ success: true, changedRows: result.affectedRows || 0, rider_photo_url: finalPhotoUrl });
  } catch (err) {
    console.error('❌ Complete delivery error:', err);
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

app.get('/api/executive/customers-analytics', async (_req, res) => {
  try {
    const ordersTable = (await getExistingTableName(['orders', 'order'])) || 'orders';
    const genderTable = await getExistingTableName(['gender']);
    const memberLevelTable = await getExistingTableName(['member_level']);

    const customerNameCol = await getExistingColumnName('customer', ['customer_name', 'name']);
    const customerSurnameCol = await getExistingColumnName('customer', ['customer_surname', 'surname', 'last_name']);
    const customerPhoneCol = await getExistingColumnName('customer', ['phone', 'customer_phone', 'mobile']);
    const customerDobCol = await getExistingColumnName('customer', ['date_of_birth']);
    const customerGenderIdCol = await getExistingColumnName('customer', ['gender_id']);
    const customerMemberLevelIdCol = await getExistingColumnName('customer', ['member_level_id']);
    const customerPointCol = await getExistingColumnName('customer', ['total_point', 'points']);

    const genderNameCol = genderTable ? await getExistingColumnName(genderTable, ['gender_name', 'name']) : null;
    const memberLevelNameCol = memberLevelTable
      ? await getExistingColumnName(memberLevelTable, ['member_level_name', 'level_name', 'name'])
      : null;

    const selectNameSql = customerNameCol ? `c.\`${customerNameCol}\`` : "'-'";
    const selectSurnameSql = customerSurnameCol ? `c.\`${customerSurnameCol}\`` : "'-'";
    const selectPhoneSql = customerPhoneCol ? `c.\`${customerPhoneCol}\`` : "''";
    const selectDobSql = customerDobCol ? `c.\`${customerDobCol}\`` : 'NULL';
    const selectPointsSql = customerPointCol ? `c.\`${customerPointCol}\`` : '0';

    const genderJoinSql = genderTable && customerGenderIdCol
      ? `LEFT JOIN \`${genderTable}\` g ON g.gender_id = c.\`${customerGenderIdCol}\``
      : '';
    const genderSelectSql = genderTable && genderNameCol ? `g.\`${genderNameCol}\`` : 'NULL';

    const memberJoinSql = memberLevelTable && customerMemberLevelIdCol
      ? `LEFT JOIN \`${memberLevelTable}\` ml ON ml.member_level_id = c.\`${customerMemberLevelIdCol}\``
      : '';
    const memberSelectSql = memberLevelTable && memberLevelNameCol ? `ml.\`${memberLevelNameCol}\`` : 'NULL';

    const selectMemberLevelIdSql = customerMemberLevelIdCol ? `c.\`${customerMemberLevelIdCol}\`` : 'NULL';

    const [rows] = await pool.query(
      `
      SELECT
        c.customer_id,
        ${selectNameSql} AS first_name,
        ${selectSurnameSql} AS last_name,
        ${selectPhoneSql} AS phone,
        ${selectDobSql} AS birth_date,
        ${selectPointsSql} AS total_points,
        ${selectMemberLevelIdSql} AS member_level_id,
        ${genderSelectSql} AS gender_name,
        ${memberSelectSql} AS member_level_name,
        b.branch_name,
        o.created_at AS order_datetime,
        o.total_amount
      FROM customer c
      LEFT JOIN \`${ordersTable}\` o ON o.customer_id = c.customer_id
      LEFT JOIN branch b ON b.branch_id = o.branch_id
      ${genderJoinSql}
      ${memberJoinSql}
      ORDER BY c.customer_id ASC, o.created_at ASC
      `
    );

    const mapGender = (value) => {
      const text = String(value || '').trim().toLowerCase();
      if (text.includes('male') || text.includes('ชาย')) return 'ชาย';
      if (text.includes('female') || text.includes('หญิง')) return 'หญิง';
      return 'ไม่ระบุ';
    };

    const mapMemberLevel = (name, levelId) => {
      const text = String(name || '').trim().toLowerCase();
      if (text) return String(name).trim();
      const id = Number(levelId || 0);
      return id > 0 ? `ระดับ ${id}` : '-';
    };

    const toDateTimeParts = (value) => {
      const dateObj = new Date(value);
      if (!Number.isFinite(dateObj.getTime())) return null;
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      const hh = String(dateObj.getHours()).padStart(2, '0');
      const mm = String(dateObj.getMinutes()).padStart(2, '0');
      return { date: `${y}-${m}-${d}`, time: `${hh}:${mm}` };
    };

    const toDateOnly = (value) => {
      if (!value) return null;
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      const dateObj = new Date(value);
      if (!Number.isFinite(dateObj.getTime())) return null;
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const customerMap = new Map();
    for (const row of rows || []) {
      const customerId = Number(row.customer_id || 0);
      if (customerId <= 0) continue;

      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          id: `CUS-${String(customerId).padStart(3, '0')}`,
          branch: row.branch_name || '-',
          phone: row.phone || '-',
          firstName: row.first_name || '-',
          lastName: row.last_name || '-',
          gender: mapGender(row.gender_name),
          birthDate: toDateOnly(row.birth_date),
          memberLevel: mapMemberLevel(row.member_level_name, row.member_level_id),
          purchases: [],
        });
      }

      const customer = customerMap.get(customerId);
      if (row.branch_name) {
        customer.branch = row.branch_name;
      }

      const amount = Number(row.total_amount || 0);
      if (row.order_datetime && Number.isFinite(amount) && amount > 0) {
        const parts = toDateTimeParts(row.order_datetime);
        if (parts) {
          customer.purchases.push({
            date: parts.date,
            time: parts.time,
            branch: row.branch_name || '-',
            amount,
          });
        }
      }
    }

    return res.json(Array.from(customerMap.values()));
  } catch (err) {
    console.error('❌ Executive customers analytics error:', err.message);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

app.get('/api/executive/member-levels', async (_req, res) => {
  try {
    const memberLevelTable = await getExistingTableName(['member_level']);
    if (!memberLevelTable) {
      return res.json([]);
    }

    const idCol = await getExistingColumnName(memberLevelTable, ['member_level_id', 'id']);
    const nameCol = await getExistingColumnName(memberLevelTable, ['member_level_name', 'level_name', 'name']);
    if (!nameCol) {
      return res.json([]);
    }

    const [rows] = await pool.query(
      `SELECT ${idCol ? `\`${idCol}\` AS member_level_id,` : ''} \`${nameCol}\` AS member_level_name FROM \`${memberLevelTable}\` ORDER BY ${idCol ? `\`${idCol}\`` : `\`${nameCol}\``}`
    );

    return res.json(
      Array.isArray(rows)
        ? rows
            .map((row) => ({
              member_level_id: row.member_level_id ? Number(row.member_level_id) : null,
              member_level_name: String(row.member_level_name || '').trim(),
            }))
            .filter((row) => row.member_level_name)
        : []
    );
  } catch (err) {
    console.error('❌ Executive member levels error:', err.message);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

const parseExecutiveUserKey = (rawKey) => {
  const key = String(rawKey || '');
  const [scope, rawId] = key.split(':');
  const id = Number(rawId);
  if (!scope || Number.isNaN(id) || id <= 0) return null;
  if (scope !== 'employee' && scope !== 'executive') return null;
  return { scope, id };
};

app.get('/api/executive/users', async (_req, res) => {
  try {
    const roleTable = await getExistingTableName(['employee_role', 'role', 'roles']);
    const roleIdColumn = roleTable ? await getExistingColumnName(roleTable, ['role_id', 'id']) : null;
    const roleNameColumn = roleTable ? await getExistingColumnName(roleTable, ['role_name', 'name']) : null;
    const phoneColumn = await getExistingColumnName('employee', ['phone', 'phone_number', 'mobile', 'tel']);
    const salaryColumn = await getExistingColumnName('employee', ['salary', 'base_salary', 'monthly_salary']);
    const createdAtColumn = await getExistingColumnName('employee', ['created_at', 'createdAt', 'join_date', 'hired_at']);
    const profileUrlColumn = await getExistingColumnName('employee', ['employee_profile_url', 'profile_url', 'profile_image_url']);
    const ratingColumn = await getExistingColumnName('employee', ['average_rating', 'rating']);

    const roleJoinSql = roleTable && roleIdColumn ? `LEFT JOIN \`${roleTable}\` r ON r.\`${roleIdColumn}\` = e.role_id` : '';
    const roleNameSelectSql = roleNameColumn ? `r.\`${roleNameColumn}\`` : 'NULL';
    const phoneSelectSql = phoneColumn ? `e.\`${phoneColumn}\`` : 'NULL';
    const salarySelectSql = salaryColumn ? `e.\`${salaryColumn}\`` : '0';
    const createdAtSelectSql = createdAtColumn ? `e.\`${createdAtColumn}\`` : 'NULL';
    const profileUrlSelectSql = profileUrlColumn ? `e.\`${profileUrlColumn}\`` : 'NULL';
    const ratingSelectSql = ratingColumn ? `e.\`${ratingColumn}\`` : '0';

    const employeeSql = `
      SELECT
        e.employee_id AS id,
        'employee' AS scope,
        e.username,
        e.name,
        e.surname,
        ${phoneSelectSql} AS phone,
        e.branch_id,
        b.branch_name,
        e.role_id,
        ${roleNameSelectSql} AS role_name,
        ${salarySelectSql} AS salary,
        ${ratingSelectSql} AS rating,
        ${profileUrlSelectSql} AS profile_image,
        ${createdAtSelectSql} AS created_at
      FROM employee e
      LEFT JOIN branch b ON b.branch_id = e.branch_id
      ${roleJoinSql}
      ORDER BY e.employee_id DESC
    `;

    const executivePhoneColumn = await getExistingColumnName('executive', ['phone', 'phone_number', 'mobile', 'tel']);
    const executiveCreatedAtColumn = await getExistingColumnName('executive', ['created_at', 'createdAt']);
    const executivePhoneSelectSql = executivePhoneColumn ? `ex.\`${executivePhoneColumn}\`` : 'NULL';
    const executiveCreatedAtSelectSql = executiveCreatedAtColumn ? `ex.\`${executiveCreatedAtColumn}\`` : 'NULL';

    const executiveSql = `
      SELECT
        ex.executive_id AS id,
        'executive' AS scope,
        ex.username,
        ex.name,
        ex.surname,
        ${executivePhoneSelectSql} AS phone,
        NULL AS branch_id,
        'ทุกสาขา' AS branch_name,
        NULL AS role_id,
        'executive' AS role_name,
        0 AS salary,
        5 AS rating,
        NULL AS profile_image,
        ${executiveCreatedAtSelectSql} AS created_at
      FROM executive ex
      ORDER BY ex.executive_id DESC
    `;

    const normalizeRoleKey = (roleName, roleId, scope) => {
      if (scope === 'executive') return 'executive';
      const text = String(roleName || '').trim().toLowerCase();
      if (text === 'cashier' || text.includes('แคชเชียร์')) return 'cashier';
      if (text === 'florist' || text.includes('ช่างจัดดอกไม้') || text.includes('จัดดอกไม้')) return 'florist';
      if (text === 'rider' || text.includes('ไรเดอร์') || text.includes('ขนส่ง') || text.includes('ส่งของ')) return 'rider';
      if (text === 'manager' || text.includes('ผู้จัดการ')) return 'manager';
      if (text === 'executive' || text.includes('ผู้บริหาร')) return 'executive';

      const id = Number(roleId);
      if (!Number.isNaN(id)) {
        if (id === 1) return 'manager';
        if (id === 2) return 'cashier';
        if (id === 3) return 'florist';
        if (id === 4) return 'rider';
      }
      return 'unknown';
    };

    const [employeeRows] = await pool.query(employeeSql);
    const [executiveRows] = await pool.query(executiveSql);
    const rows = [...(employeeRows || []), ...(executiveRows || [])];

    return res.json(rows.map((row) => ({
      id: `${row.scope}:${row.id}`,
      raw_id: Number(row.id),
      scope: row.scope,
      username: row.username,
      first_name: row.name || '',
      last_name: row.surname || '',
      phone: row.phone || '',
      branch_id: row.branch_id ? Number(row.branch_id) : null,
      branch_name: row.branch_name || 'ทุกสาขา',
      role_id: row.role_id ? Number(row.role_id) : null,
      role_name: String(row.role_name || '').toLowerCase(),
      role_key: normalizeRoleKey(row.role_name, row.role_id, row.scope),
      salary: Number(row.salary || 0),
      rating: Number(row.rating || 0),
      assigned_jobs: 0,
      profile_image: row.profile_image || null,
      created_at: row.created_at || null,
    })));
  } catch (err) {
    console.error('❌ Executive users list error:', err.message);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

app.get('/api/executive/employee-performance', async (req, res) => {
  try {
    const month = String(req.query.month || '').trim();
    const ordersTable = (await getExistingTableName(['orders', 'order'])) || 'orders';
    const ratingColumn = await getExistingColumnName('employee', ['average_rating', 'rating']);
    const ratingSelectSql = ratingColumn ? `COALESCE(e.\`${ratingColumn}\`, 0)` : '0';

    const monthFilterSql = /^\d{4}-\d{2}$/.test(month)
      ? " AND DATE_FORMAT(o.created_at, '%Y-%m') = ?"
      : '';
    const monthParams = monthFilterSql ? [month] : [];

    const [rows] = await pool.query(
      `
      SELECT
        e.employee_id,
        ${ratingSelectSql} AS average_rating,
        COALESCE(cashier.orders_count, 0) AS cashier_orders,
        COALESCE(florist.orders_count, 0) AS florist_orders,
        COALESCE(florist.avg_minutes, 0) AS florist_avg_minutes,
        COALESCE(rider.orders_count, 0) AS rider_orders,
        COALESCE(rider.avg_minutes, 0) AS rider_avg_minutes
      FROM employee e
      LEFT JOIN (
        SELECT
          p.employee_id,
          COUNT(DISTINCT p.order_id) AS orders_count
        FROM payment p
        JOIN \`${ordersTable}\` o ON o.order_id = p.order_id
        WHERE p.employee_id IS NOT NULL${monthFilterSql}
        GROUP BY p.employee_id
      ) cashier ON cashier.employee_id = e.employee_id
      LEFT JOIN (
        SELECT
          p.employee_id,
          COUNT(DISTINCT p.order_id) AS orders_count,
          AVG(
            CASE
              WHEN p.assigned_at IS NOT NULL AND p.completed_at IS NOT NULL
                THEN TIMESTAMPDIFF(MINUTE, p.assigned_at, p.completed_at)
              ELSE NULL
            END
          ) AS avg_minutes
        FROM prepare p
        JOIN \`${ordersTable}\` o ON o.order_id = p.order_id
        WHERE p.employee_id IS NOT NULL${monthFilterSql}
        GROUP BY p.employee_id
      ) florist ON florist.employee_id = e.employee_id
      LEFT JOIN (
        SELECT
          d.employee_id,
          COUNT(DISTINCT d.order_id) AS orders_count,
          AVG(
            CASE
              WHEN d.assigned_at IS NOT NULL AND d.completed_at IS NOT NULL
                THEN TIMESTAMPDIFF(MINUTE, d.assigned_at, d.completed_at)
              ELSE NULL
            END
          ) AS avg_minutes
        FROM delivery d
        JOIN \`${ordersTable}\` o ON o.order_id = d.order_id
        WHERE d.employee_id IS NOT NULL${monthFilterSql}
        GROUP BY d.employee_id
      ) rider ON rider.employee_id = e.employee_id
      `,
      [
        ...monthParams,
        ...monthParams,
        ...monthParams,
      ]
    );

    return res.json(
      Array.isArray(rows)
        ? rows.map((row) => ({
            employee_id: Number(row.employee_id || 0),
            average_rating: Number(row.average_rating || 0),
            cashier_orders: Number(row.cashier_orders || 0),
            florist_orders: Number(row.florist_orders || 0),
            florist_avg_minutes: Number(row.florist_avg_minutes || 0),
            rider_orders: Number(row.rider_orders || 0),
            rider_avg_minutes: Number(row.rider_avg_minutes || 0),
          }))
        : []
    );
  } catch (err) {
    console.error('❌ Executive employee performance error:', err.message);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

app.post('/api/executive/users', async (req, res) => {
  try {
    const {
      username,
      password,
      first_name,
      last_name,
      phone,
      role,
      branch_id,
      salary,
    } = req.body || {};

    if (!username || !password || !first_name || !role) {
      return res.status(400).json({ error: 'username, password, first_name and role are required' });
    }

    if (String(role).toLowerCase() === 'executive') {
      await pool.query(
        'INSERT INTO executive (username, password_hash, name, surname, phone) VALUES (?, ?, ?, ?, ?)',
        [String(username), String(password), String(first_name), last_name ? String(last_name) : null, phone ? String(phone) : null]
      );
      return res.json({ success: true });
    }

    const roleTable = await getExistingTableName(['employee_role', 'role', 'roles']);
    if (!roleTable) {
      return res.status(500).json({ error: 'Role table not found' });
    }

    const roleNameColumn = await getExistingColumnName(roleTable, ['role_name', 'name']);
    const roleIdColumn = await getExistingColumnName(roleTable, ['role_id', 'id']);
    if (!roleNameColumn || !roleIdColumn) {
      return res.status(500).json({ error: 'Role table columns not found' });
    }

    const [roleRows] = await pool.query(
      `SELECT \`${roleIdColumn}\` AS role_id FROM \`${roleTable}\` WHERE LOWER(\`${roleNameColumn}\`) = LOWER(?) LIMIT 1`,
      [String(role)]
    );
    if (!Array.isArray(roleRows) || roleRows.length === 0) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const phoneColumn = await getExistingColumnName('employee', ['phone', 'phone_number', 'mobile', 'tel']);
    const salaryColumn = await getExistingColumnName('employee', ['salary', 'base_salary', 'monthly_salary']);

    const columns = ['username', 'password_hash', 'role_id', 'branch_id', 'name', 'surname'];
    const values = [
      String(username),
      String(password),
      Number(roleRows[0].role_id),
      branch_id ? Number(branch_id) : null,
      String(first_name),
      last_name ? String(last_name) : null,
    ];

    if (phoneColumn) {
      columns.push(phoneColumn);
      values.push(phone ? String(phone) : null);
    }
    if (salaryColumn) {
      columns.push(salaryColumn);
      values.push(Number(salary || 0));
    }

    await pool.query(
      `INSERT INTO employee (${columns.map((c) => `\`${c}\``).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
      values
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('❌ Executive users create error:', err.message);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

app.put('/api/executive/users/:userKey', async (req, res) => {
  try {
    const parsed = parseExecutiveUserKey(req.params.userKey);
    if (!parsed) {
      return res.status(400).json({ error: 'Invalid user key' });
    }

    const {
      password,
      first_name,
      last_name,
      phone,
      profile_url,
      role,
      branch_id,
      salary,
      rating,
    } = req.body || {};

    if (parsed.scope === 'executive') {
      const sets = ['name = ?', 'surname = ?', 'phone = ?'];
      const values = [
        first_name ? String(first_name) : '',
        last_name ? String(last_name) : null,
        phone ? String(phone) : null,
      ];
      if (password) {
        sets.push('password_hash = ?');
        values.push(String(password));
      }
      values.push(parsed.id);
      await pool.query(`UPDATE executive SET ${sets.join(', ')} WHERE executive_id = ?`, values);
      return res.json({ success: true });
    }

    const phoneColumn = await getExistingColumnName('employee', ['phone', 'phone_number', 'mobile', 'tel']);
    const salaryColumn = await getExistingColumnName('employee', ['salary', 'base_salary', 'monthly_salary']);
    const ratingColumn = await getExistingColumnName('employee', ['average_rating', 'rating']);
    const profileUrlColumn = await getExistingColumnName('employee', ['employee_profile_url', 'profile_url', 'profile_image_url']);

    const sets = ['name = ?', 'surname = ?', 'branch_id = ?'];
    const values = [
      first_name ? String(first_name) : '',
      last_name ? String(last_name) : null,
      branch_id ? Number(branch_id) : null,
    ];

    if (password) {
      sets.push('password_hash = ?');
      values.push(String(password));
    }

    if (phoneColumn) {
      sets.push(`\`${phoneColumn}\` = ?`);
      values.push(phone ? String(phone) : null);
    }
    if (salaryColumn) {
      sets.push(`\`${salaryColumn}\` = ?`);
      values.push(Number(salary || 0));
    }
    if (ratingColumn) {
      sets.push(`\`${ratingColumn}\` = ?`);
      values.push(Number(rating || 0));
    }
    if (profileUrlColumn) {
      const normalizedProfileUrl = String(profile_url || '').trim();
      sets.push(`\`${profileUrlColumn}\` = ?`);
      values.push(normalizedProfileUrl || null);
    }

    if (role) {
      const roleTable = await getExistingTableName(['employee_role', 'role', 'roles']);
      if (roleTable) {
        const roleNameColumn = await getExistingColumnName(roleTable, ['role_name', 'name']);
        const roleIdColumn = await getExistingColumnName(roleTable, ['role_id', 'id']);
        if (roleNameColumn && roleIdColumn) {
          const [roleRows] = await pool.query(
            `SELECT \`${roleIdColumn}\` AS role_id FROM \`${roleTable}\` WHERE LOWER(\`${roleNameColumn}\`) = LOWER(?) LIMIT 1`,
            [String(role)]
          );
          if (Array.isArray(roleRows) && roleRows.length > 0) {
            sets.push('role_id = ?');
            values.push(Number(roleRows[0].role_id));
          }
        }
      }
    }

    values.push(parsed.id);
    await pool.query(`UPDATE employee SET ${sets.join(', ')} WHERE employee_id = ?`, values);
    return res.json({ success: true });
  } catch (err) {
    console.error('❌ Executive users update error:', err.message);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

app.delete('/api/executive/users/:userKey', async (req, res) => {
  try {
    const parsed = parseExecutiveUserKey(req.params.userKey);
    if (!parsed) {
      return res.status(400).json({ error: 'Invalid user key' });
    }

    if (parsed.scope === 'executive') {
      await pool.query('DELETE FROM executive WHERE executive_id = ?', [parsed.id]);
    } else {
      await pool.query('DELETE FROM employee WHERE employee_id = ?', [parsed.id]);
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('❌ Executive users delete error:', err.message);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// Executive overview: totals for current year, branch list and customer count
app.get('/api/executive/overview', async (req, res) => {
  try {
    const ordersTable = (await getExistingTableName(['orders', 'order'])) || 'orders';
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

    const revSql = `SELECT IFNULL(SUM(total_amount),0) AS total_revenue FROM \`${ordersTable}\` o WHERE ${dateCondition('o.created_at')}${branchFilterSqlOrder}${productFilterSql}`;
    const revParams = start_date && end_date ? [start_date, end_date, ...params, ...productFilterParams] : [...params, ...productFilterParams];
    const [[revRow]] = await pool.query(revSql, revParams);

    // Total orders this year
    const ordersSql = `SELECT COUNT(*) AS total_orders FROM \`${ordersTable}\` o WHERE ${dateCondition('o.created_at')}${branchFilterSqlOrder}${productFilterSql}`;
    const ordersParams = start_date && end_date ? [start_date, end_date, ...params, ...productFilterParams] : [...params, ...productFilterParams];
    const [[ordersRow]] = await pool.query(ordersSql, ordersParams);

    // Branch count and list
    const [branches] = await pool.query(`SELECT branch_id, branch_name FROM branch ORDER BY branch_name`);

    // Customer count
    const [[custRow]] = await pool.query(`SELECT COUNT(*) AS customer_count FROM customer`);

    // Per-branch performance this year
    // Aggregate orders/revenue in a subquery first to avoid duplication when joining employees
    // Per-branch performance with same filters
    const employeeRatingColumn = await getExistingColumnName('employee', ['average_rating', 'rating']);
    const avgRatingSql = employeeRatingColumn
      ? `COALESCE(AVG(NULLIF(emp.\`${employeeRatingColumn}\`, 0)), 0) AS average_rating,`
      : '0 AS average_rating,';
    const branchPerfSql = `SELECT b.branch_id, b.branch_name,
              COALESCE(oa.orders,0) AS orders,
              COALESCE(oa.revenue,0) AS revenue,
              ${avgRatingSql}
              COUNT(DISTINCT emp.employee_id) AS employee_count
       FROM branch b
       LEFT JOIN (
         SELECT branch_id, COUNT(*) AS orders, SUM(total_amount) AS revenue
         FROM \`${ordersTable}\` o
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
       FROM \`${ordersTable}\` o
       JOIN branch b ON b.branch_id = o.branch_id
       WHERE ${dateCondition('o.created_at')}${branchFilterSqlO}${productFilterSql}
       GROUP BY b.branch_id, b.branch_name
       ORDER BY revenue DESC
       LIMIT 1`;
     const topBranchParams = start_date && end_date ? [start_date, end_date, ...params, ...productFilterParams] : [...params, ...productFilterParams];
     const [topBranchRows] = await pool.query(topBranchSql, topBranchParams);

    // Top flower (most sold) with schema-tolerant joins across flower/flower_type variants
    let topFlowerRows = [];
    const flowerDetailTable = await getExistingTableName(['flower_detail']);
    const flowerMasterTable = await getExistingTableName(['flower', 'flower_type']);
    if (flowerDetailTable && flowerMasterTable) {
      const detailFlowerIdColumn = await getExistingColumnName(flowerDetailTable, ['flower_id', 'flower_type_id']);
      const detailQtyColumn = await getExistingColumnName(flowerDetailTable, ['quantity', 'qty']);
      const masterIdColumn = await getExistingColumnName(
        flowerMasterTable,
        flowerMasterTable === 'flower' ? ['flower_id'] : ['flower_type_id', 'flower_id']
      );
      const masterNameColumn = await getExistingColumnName(flowerMasterTable, ['flower_name', 'name']);

      if (detailFlowerIdColumn && masterIdColumn && masterNameColumn) {
        const qtyExpr = detailQtyColumn ? `IFNULL(SUM(fd.\`${detailQtyColumn}\`),0)` : 'COUNT(*)';
        const topFlowerSql = `SELECT fm.\`${masterNameColumn}\` AS flower_name, ${qtyExpr} AS qty
          FROM shopping_cart sc
          JOIN \`${ordersTable}\` o ON sc.order_id = o.order_id
          JOIN flower_detail fd ON fd.shopping_cart_id = sc.shopping_cart_id
          JOIN \`${flowerMasterTable}\` fm ON fm.\`${masterIdColumn}\` = fd.\`${detailFlowerIdColumn}\`
          WHERE ${dateCondition('o.created_at')}${branchFilterSqlO}${productFilterSql}
          GROUP BY fm.\`${masterIdColumn}\`, fm.\`${masterNameColumn}\`
          ORDER BY qty DESC
          LIMIT 1`;
        const topFlowerParams = start_date && end_date
          ? [start_date, end_date, ...params, ...productFilterParams]
          : [...params, ...productFilterParams];
        [topFlowerRows] = await pool.query(topFlowerSql, topFlowerParams);
      }
    }

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
    const ordersTable = (await getExistingTableName(['orders', 'order'])) || 'orders';
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
       FROM \`${ordersTable}\` o
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
    const ordersTable = (await getExistingTableName(['orders', 'order'])) || 'orders';
    const cartTotalColumn = await getExistingColumnName('shopping_cart', ['price_total', 'line_total', 'total_price', 'amount']);
    const cartQtyColumn = await getExistingColumnName('shopping_cart', ['qty', 'quantity']);
    const cartUnitPriceColumn = await getExistingColumnName('shopping_cart', ['unit_price', 'price']);

    let revenueExpr = '0';
    if (cartTotalColumn) {
      revenueExpr = `IFNULL(SUM(sc.\`${cartTotalColumn}\`),0)`;
    } else if (cartQtyColumn && cartUnitPriceColumn) {
      revenueExpr = `IFNULL(SUM(sc.\`${cartQtyColumn}\` * sc.\`${cartUnitPriceColumn}\`),0)`;
    } else if (cartQtyColumn) {
      revenueExpr = `IFNULL(SUM(sc.\`${cartQtyColumn}\` * IFNULL(pr.product_price,0)),0)`;
    } else if (cartUnitPriceColumn) {
      revenueExpr = `IFNULL(SUM(sc.\`${cartUnitPriceColumn}\`),0)`;
    }

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
        ${revenueExpr} AS revenue
       FROM shopping_cart sc
       JOIN product pr ON pr.product_id = sc.product_id
       LEFT JOIN product_type pt ON pt.product_type_id = pr.product_type_id
      JOIN \`${ordersTable}\` o ON o.order_id = sc.order_id
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
    const { date_range, product_type_id, member_level } = req.query || {};
    const baseParams = [Number(branchId)];
    const ordersTable = 'orders';

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

    // Build member level filter condition
    let memberLevelCondition = '';
    const memberLevelParams = [];
    const memberLevelRaw = String(member_level || '').trim();
    if (memberLevelRaw && memberLevelRaw.toLowerCase() !== 'all') {
      const normalizedMemberLevel = memberLevelRaw.toLowerCase();
      const levelIdMap = {
        member: 1,
        silver: 2,
        gold: 3,
        platinum: 4,
      };
      const mappedId = levelIdMap[normalizedMemberLevel];
      if (Number.isFinite(mappedId)) {
        memberLevelCondition = ' AND c.member_level_id = ?';
        memberLevelParams.push(mappedId);
      } else if (/^\d+$/.test(memberLevelRaw)) {
        memberLevelCondition = ' AND c.member_level_id = ?';
        memberLevelParams.push(Number(memberLevelRaw));
      } else {
        memberLevelCondition = ' AND LOWER(COALESCE(ml.member_level_name, "")) = ?';
        memberLevelParams.push(normalizedMemberLevel);
      }
    }

    const commonWhere = `o.branch_id = ?${dateCondition}${productTypeCondition}${memberLevelCondition}`;
    const commonParams = [...baseParams, ...dateParams, ...productTypeParams, ...memberLevelParams];

    const formatLocalDate = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const toIsoDate = (value) => {
      if (!value) return null;
      if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return formatLocalDate(value);
      }
      const s = String(value);
      const m = s.match(/\d{4}-\d{2}-\d{2}/);
      if (!m) return null;
      const iso = m[0];
      const parsed = new Date(`${iso}T00:00:00`);
      if (Number.isNaN(parsed.getTime())) return null;
      return iso;
    };

    // For "all" range, anchor to latest available order date in DB for this branch/filter.
    const shouldUseLatestAnchor = !date_range || date_range === 'custom' || date_range === 'all';
    let anchorDate = null;
    if (shouldUseLatestAnchor) {
      const latestSql = `
        SELECT MAX(DATE(o.created_at)) AS latest_date
        FROM ${ordersTable} o
        JOIN customer c ON c.customer_id = o.customer_id
        LEFT JOIN member_level ml ON ml.member_level_id = c.member_level_id
        WHERE ${commonWhere}
      `;
      const [[latestRow]] = await pool.query(latestSql, commonParams);
      anchorDate = toIsoDate(latestRow?.latest_date) || null;
    }

    const anchorDateExpr = anchorDate ? '?' : 'CURDATE()';

    const sql = `
      SELECT DATE(o.created_at) AS date, IFNULL(SUM(o.total_amount),0) AS sales
      FROM ${ordersTable} o
      JOIN customer c ON c.customer_id = o.customer_id
      LEFT JOIN member_level ml ON ml.member_level_id = c.member_level_id
      WHERE ${commonWhere}
        AND DATE(o.created_at) >= DATE_SUB(${anchorDateExpr}, INTERVAL 6 DAY)
        AND DATE(o.created_at) <= ${anchorDateExpr}
      GROUP BY DATE(o.created_at)
      ORDER BY DATE(o.created_at)
    `;

    let queryParams = [...commonParams];
    if (anchorDate) {
      queryParams = [...queryParams, anchorDate, anchorDate];
    }

    const [rows] = await pool.query(sql, queryParams);

    const parsedBaseDate = anchorDate ? new Date(`${anchorDate}T00:00:00`) : new Date();
    const baseDate = Number.isNaN(parsedBaseDate.getTime()) ? new Date() : parsedBaseDate;
    const results = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const iso = formatLocalDate(d);
      const found = rows.find(r => toIsoDate(r.date) === iso);
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
    const { date_range, product_type_id, member_level } = req.query || {};
    const params = [Number(branchId)];
    const ordersTable = (await getExistingTableName(['orders', 'order'])) || 'orders';

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

    // Build member level filter condition
    let memberLevelCondition = '';
    const memberLevelParams = [];
    const memberLevelRaw = String(member_level || '').trim();
    if (memberLevelRaw && memberLevelRaw.toLowerCase() !== 'all') {
      const normalizedMemberLevel = memberLevelRaw.toLowerCase();
      const levelIdMap = {
        member: 1,
        silver: 2,
        gold: 3,
        platinum: 4,
      };
      const mappedId = levelIdMap[normalizedMemberLevel];
      if (Number.isFinite(mappedId)) {
        memberLevelCondition = ' AND c.member_level_id = ?';
        memberLevelParams.push(mappedId);
      } else if (/^\d+$/.test(memberLevelRaw)) {
        memberLevelCondition = ' AND c.member_level_id = ?';
        memberLevelParams.push(Number(memberLevelRaw));
      } else {
        memberLevelCondition = ' AND LOWER(COALESCE(ml.member_level_name, "")) = ?';
        memberLevelParams.push(normalizedMemberLevel);
      }
    }

    const cartQtyColumn = await getExistingColumnName('shopping_cart', ['quantity', 'qty']);
    const cartTotalPriceColumn =
      (await getExistingColumnName('shopping_cart', ['total_price', 'price_total'])) ||
      'price_total';
    const qtySoldExpr = cartQtyColumn ? `SUM(sc.${cartQtyColumn})` : 'COUNT(*)';

    const sql = `
      SELECT pr.product_id,
             pr.product_name,
             IFNULL(${qtySoldExpr},0) AS qty_sold,
             IFNULL(SUM(
               CASE
                 WHEN oct.cart_total > 0 THEN (o.total_amount * sc.${cartTotalPriceColumn} / oct.cart_total)
                 ELSE 0
               END
             ),0) AS revenue,
             pt.product_type_name AS product_type
      FROM shopping_cart sc
      JOIN (
        SELECT order_id, SUM(${cartTotalPriceColumn}) AS cart_total
        FROM shopping_cart
        GROUP BY order_id
      ) oct ON oct.order_id = sc.order_id
      JOIN ${ordersTable} o ON sc.order_id = o.order_id
      JOIN customer c ON c.customer_id = o.customer_id
      LEFT JOIN member_level ml ON ml.member_level_id = c.member_level_id
      JOIN product pr ON pr.product_id = sc.product_id
      LEFT JOIN product_type pt ON pt.product_type_id = pr.product_type_id
      WHERE o.branch_id = ?${dateCondition}${productTypeCondition}${memberLevelCondition}
      GROUP BY pr.product_id, pr.product_name, pt.product_type_name
      ORDER BY qty_sold DESC
      LIMIT 10
    `;

    const queryParams = [...params, ...dateParams, ...productTypeParams, ...memberLevelParams];
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
    const ordersTable = (await getExistingTableName(['orders', 'order'])) || 'orders';

    const [minmaxRows] = await pool.query(
      `SELECT MIN(DATE(created_at)) AS min_date, MAX(DATE(created_at)) AS max_date FROM ${ordersTable} WHERE branch_id = ?`,
      params
    );

    const [monthsRows] = await pool.query(
      `SELECT YEAR(created_at) AS y, MONTH(created_at) AS m, COUNT(*) AS cnt
       FROM ${ordersTable}
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

