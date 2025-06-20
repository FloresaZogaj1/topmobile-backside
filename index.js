const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Import databazën dhe modelet
const sequelize = require('./db');
const Product = require('./models/Product');
const User = require('./models/User');
const Order = require('./models/Order');   // Importo modelin Order

// Importo middleware për admin
const verifyAdmin = require('./middleware/verifyAdmin');

// (Opsionale) Importo admin routes nëse ke ndonjë rruge tjetër për admin
const adminRoutes = require("./routes/admin");
app.use("/api/admin", adminRoutes);

// Rruga bazë për test
app.get('/', (req, res) => {
  res.send('API po funksionon!');
});

// GET të gjitha produktet (publike)
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Gabim në marrjen e produkteve' });
  }
});

// GET një produkt sipas ID (publike)
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Produkti nuk u gjet' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Gabim në marrjen e produktit' });
  }
});

// POST (Shto produkt) - VETËM ADMIN
app.post('/api/products', verifyAdmin, async (req, res) => {
  try {
    const { name, price, description, category, image } = req.body;
    const product = await Product.create({ name, price, description, category, image });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: 'Gabim në shtim të produktit' });
  }
});

// PUT (Përditëso produkt) - VETËM ADMIN
app.put('/api/products/:id', verifyAdmin, async (req, res) => {
  try {
    const { name, price, description, category, image } = req.body;
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Produkti nuk u gjet' });
    }
    await product.update({ name, price, description, category, image });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Gabim në përditësim' });
  }
});

// DELETE (Fshi produkt) - VETËM ADMIN
app.delete('/api/products/:id', verifyAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await Product.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ error: 'Produkti nuk u gjet' });
    }
    res.json({ message: 'Produkti u fshi me sukses' });
  } catch (err) {
    res.status(500).json({ error: 'Gabim në fshirje' });
  }
});

// REGISTER
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const ekziston = await User.findOne({ where: { username } });
    if (ekziston) {
      return res.status(400).json({ error: "Username ekziston!" });
    }
    const hashed = await bcrypt.hash(password, 10);
    // Default role: user
    const user = await User.create({ username, password: hashed, role: 'user' });
    res.status(201).json({ message: "User u regjistrua!" });
  } catch (err) {
    res.status(500).json({ error: "Gabim gjatë regjistrimit" });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(400).json({ error: "Username ose password gabim!" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Username ose password gabim!" });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      "sekretiYT",
      { expiresIn: "1d" }
    );
    res.json({ token, username: user.username, role: user.role });
  } catch (err) {
    res.status(500).json({ error: "Gabim gjatë login-it" });
  }
});


// ============ ORDERS ===============

// Shto porosi të re
app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, phone, address, items, total } = req.body;
    if (!customerName || !phone || !address || !Array.isArray(items) || !total)
      return res.status(400).json({ error: "Të gjitha fushat janë të detyrueshme!" });
    const order = await Order.create({ customerName, phone, address, items, total });
    res.status(201).json({ message: "Porosia u ruajt me sukses!", order });
  } catch (err) {
    res.status(500).json({ error: "Gabim gjatë ruajtjes së porosisë" });
  }
});


// Merr të gjitha porositë (vetëm për admin)
app.get('/api/orders', verifyAdmin, async (req, res) => {
  try {
    const orders = await Order.findAll({ order: [['createdAt', 'DESC']] });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Gabim gjatë marrjes së porosive" });
  }
});

// ====================================

// Sinkronizo databazën dhe nise serverin NJËHERË!
sequelize.sync()
  .then(() => {
    console.log('DB u sinkronizua');
    app.listen(PORT, () => {
      console.log(`Serveri po dëgjon në portin ${PORT}`);
    });
  })
  .catch(err => console.log('Gabim në lidhje me DB:', err));
