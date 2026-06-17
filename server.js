const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'giganet_user',
  host: 'localhost',
  database: 'giganet',
  password: 'GigaNet@2026!',
  port: 5432,
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const r = await pool.query('SELECT * FROM app_users WHERE email=$1 AND password=$2', [email, password]);
    if (!r.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    res.json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/accounts', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM giganet_accounts ORDER BY created_at');
    res.json(r.rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/accounts', async (req, res) => {
  try {
    const { label, username, password } = req.body;
    const r = await pool.query('INSERT INTO giganet_accounts (label,username,password) VALUES ($1,$2,$3) RETURNING *', [label, username, password]);
    res.json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/accounts/:id', async (req, res) => {
  try {
    const { label, username, password } = req.body;
    const r = await pool.query('UPDATE giganet_accounts SET label=$1,username=$2,password=$3 WHERE id=$4 RETURNING *', [label, username, password, req.params.id]);
    res.json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/accounts/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM giganet_accounts WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/users', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM app_users ORDER BY created_at');
    res.json(r.rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const r = await pool.query('INSERT INTO app_users (name,email,password,role) VALUES ($1,$2,$3,$4) RETURNING *', [name, email, password, role]);
    res.json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const r = await pool.query('UPDATE app_users SET name=$1,email=$2,password=$3,role=$4 WHERE id=$5 RETURNING *', [name, email, password, role, req.params.id]);
    res.json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM app_users WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/user-accounts/:userId', async (req, res) => {
  try {
    const r = await pool.query('SELECT account_id FROM user_accounts WHERE user_id=$1', [req.params.userId]);
    res.json(r.rows.map(r => r.account_id));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/user-accounts/:userId', async (req, res) => {
  try {
    const { accountIds } = req.body;
    await pool.query('DELETE FROM user_accounts WHERE user_id=$1', [req.params.userId]);
    for (const account_id of accountIds) {
      await pool.query('INSERT INTO user_accounts (user_id,account_id) VALUES ($1,$2)', [req.params.userId, account_id]);
    }
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/change-password/:id', async (req, res) => {
  try {
    const { password } = req.body;
    await pool.query('UPDATE app_users SET password=$1 WHERE id=$2', [password, req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

function proxyRequest(method, path, body, auth, res) {
  const data = body ? JSON.stringify(body) : null;
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = auth;
  if (data) headers['Content-Length'] = Buffer.byteLength(data);
  const req2 = http.request({ hostname: 'user.giganetlb.net', port: 80, path, method, headers }, r2 => {
    let d = '';
    r2.on('data', c => d += c);
    r2.on('end', () => { res.setHeader('Content-Type', 'application/json'); res.send(d); });
  });
  req2.on('error', e => res.status(500).json({ error: e.message }));
  if (data) req2.write(data);
  req2.end();
}

app.post('/proxy/auth/login', (req, res) => {
  proxyRequest('POST', '/user/api/index.php/api/auth/login', req.body, null, res);
});

app.get('/proxy/service', (req, res) => {
  proxyRequest('GET', '/user/api/index.php/api/service', null, req.headers.authorization, res);
});

app.listen(3000, () => console.log('GigaNet API running on port 3000'));
