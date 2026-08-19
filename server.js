// Brand Vista POS - Backend Server with Neon Database
// Connects to Neon PostgreSQL database for persistent data storage

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Neon Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Test database connection
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Initialize database tables
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number INT UNIQUE NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        cashier VARCHAR(255),
        items JSONB,
        subtotal DECIMAL(10, 2),
        tax DECIMAL(10, 2),
        discount DECIMAL(10, 2),
        total DECIMAL(10, 2),
        payment_method VARCHAR(50),
        customer VARCHAR(255)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        barcode VARCHAR(50),
        category VARCHAR(100),
        price DECIMAL(10, 2),
        stock INT,
        low INT,
        status VARCHAR(50),
        color VARCHAR(50),
        image BYTEA
      );
    `);

    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

// API Endpoints

// Get all settings
app.get('/api/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM settings');
    const settings = {};
    result.rows.forEach(row => {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch (e) {
        settings[row.key] = row.value;
      }
    });
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Save settings
app.post('/api/settings', async (req, res) => {
  try {
    const settings = req.body;
    
    for (const [key, value] of Object.entries(settings)) {
      const jsonValue = JSON.stringify(value);
      await pool.query(
        'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP',
        [key, jsonValue]
      );
    }
    
    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Get all orders
app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY date DESC LIMIT 100');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Save order
app.post('/api/orders', async (req, res) => {
  try {
    const { order_number, cashier, items, subtotal, tax, discount, total, payment_method, customer } = req.body;
    
    const result = await pool.query(
      `INSERT INTO orders (order_number, cashier, items, subtotal, tax, discount, total, payment_method, customer)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [order_number, cashier, JSON.stringify(items), subtotal, tax, discount, total, payment_method, customer]
    );
    
    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error('Error saving order:', error);
    res.status(500).json({ error: 'Failed to save order' });
  }
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Save products
app.post('/api/products', async (req, res) => {
  try {
    const products = req.body;
    
    for (const product of products) {
      await pool.query(
        `INSERT INTO products (id, name, barcode, category, price, stock, low, status, color, image)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
         name = $2, barcode = $3, category = $4, price = $5, stock = $6, low = $7, status = $8, color = $9, image = $10`,
        [product.id, product.name, product.barcode, product.category, product.price, product.stock, product.low, product.status, product.color, product.image]
      );
    }
    
    res.json({ success: true, message: 'Products saved successfully' });
  } catch (error) {
    console.error('Error saving products:', error);
    res.status(500).json({ error: 'Failed to save products' });
  }
});

// Database connection test
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', database: 'connected', time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 Brand Vista POS Server running on port ${PORT}`);
  await initializeDatabase();
});

module.exports = app;
