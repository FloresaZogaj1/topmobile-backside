require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');

const app        = express();
const PORT       = process.env.PORT || 5000;

// Database & Models
const sequelize  = require('./db');
const Product    = require('./models/Product');
const User       = require('./models/User');
const Order      = require('./models/Order');

// Middleware & Routes
const verifyAdmin  = require('./middleware/verifyAdmin');
const adminRoutes  = require('./routes/admin');

app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use('/api/admin', adminRoutes);

// ========== PRODUCTS ==========
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Gabim në marrjen e produkteve' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const p = await Product.findByPk(req.params.id);
    if (!p) return res.status(404).json({ error: 'Produkti nuk u gjet' });
    res.json(p);
  } catch {
    res.status(500).json({ error: 'Gabim në marrjen e produktit' });
  }
});

app.post('/api/products', verifyAdmin, async (req, res) => {
  try {
    const prod = await Product.create(req.body);
    res.status(201).json(prod);
  } catch {
    res.status(500).json({ error: 'Gabim në shtim të produktit' });
  }
});

app.put('/api/products/:id', verifyAdmin, async (req, res) => {
  try {
    const prod = await Product.findByPk(req.params.id);
    if (!prod) return res.status(404).json({ error: 'Produkti nuk u gjet' });
    await prod.update(req.body);
    res.json(prod);
  } catch {
    res.status(500).json({ error: 'Gabim në përditësim' });
  }
});

app.delete('/api/products/:id', verifyAdmin, async (req, res) => {
  try {
    const deleted = await Product.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Produkti nuk u gjet' });
    res.json({ message: 'Produkti u fshi me sukses' });
  } catch {
    res.status(500).json({ error: 'Gabim në fshirje' });
  }
});

// ========== AUTH ==========
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    if (await User.findOne({ where: { username } })) {
      return res.status(400).json({ error: 'Username ekziston!' });
    }
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashed, role: 'user' });
    res.status(201).json({ message: 'User u regjistrua!' });
  } catch {
    res.status(500).json({ error: 'Gabim gjatë regjistrimit' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Username ose password gabim!' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'sekretiYT',
      { expiresIn: '1d' }
    );
    res.json({ token, username: user.username, role: user.role });
  } catch {
    res.status(500).json({ error: 'Gabim gjatë login-it' });
  }
});

// ========== ORDERS ==========
app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, phone, address, items, total } = req.body;
    if (!customerName || !phone || !address || !items?.length || isNaN(total)) {
      return res.status(400).json({ error: 'Fushat e porosisë nuk janë valide.' });
    }
    const ord = await Order.create({ customerName, phone, address, items, total });
    res.status(201).json(ord);
  } catch (err) {
    res.status(500).json({ error: 'Gabim gjatë krijimit të porosisë.' });
  }
});

app.get('/api/orders', verifyAdmin, async (req, res) => {
  try {
    const all = await Order.findAll({ order: [['createdAt', 'DESC']] });
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: 'Gabim gjatë marrjes së porosive.' });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const ord = await Order.findByPk(req.params.id);
    if (!ord) return res.status(404).json({ error: 'Porosia nuk u gjet.' });
    const { status } = req.body;
    if (!['Në pritje','Në dërgesë','Kryer','Refuzuar'].includes(status)) {
      return res.status(400).json({ error: 'Status i pavlefshëm.' });
    }
    await ord.update({ status });
    res.json(ord);
  } catch (err) {
    res.status(500).json({ error: 'Gabim gjatë ndryshimit të statusit.' });
  }
});

app.delete('/api/orders/:id', verifyAdmin, async (req, res) => {
  try {
    const deleted = await Order.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Porosia nuk u gjet.' });
    res.json({ message: 'Porosia u fshi me sukses.' });
  } catch (err) {
    res.status(500).json({ error: 'Gabim gjatë fshirjes së porosisë.' });
  }
});

// ========== SYNC & ADMIN SEED ==========
(async () => {
  try {
    await sequelize.sync();
    // Krijo admin nëse nuk ekziston
    const [admin, created] = await User.findOrCreate({
      where: { username: 'superadmin' },
      defaults: {
        password: await bcrypt.hash('Password123!', 10),
        role: 'admin'
      }
    });
    if (created) console.log('✅ Admin i parë u krijua:', admin.username);
    else        console.log('ℹ️ Admin ekziston tashmë:', admin.username);

    app.listen(PORT, () => console.log(`Server po dëgjon në port ${PORT}`));
  } catch (err) {
    console.error('DB sync error:', err);
  }
})();
