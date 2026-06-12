const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', db: err.message });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Hello from node-express-pg' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
