// routes/admin.js
const express      = require('express');
const router       = express.Router();
const bcrypt       = require('bcryptjs');
const User         = require('../models/User');
const verifyAdmin  = require('../middleware/verifyAdmin');

// 🛠️ 1) Krijo user/admin të ri
router.post(
  '/create-user',
  verifyAdmin,
  async (req, res) => {
    try {
      const { username, password, role } = req.body;
      if (!username || !password || !['user','admin'].includes(role)) {
        return res.status(400).json({ error: 'Të dhëna të pavlefshme.' });
      }
      if (await User.findOne({ where: { username } })) {
        return res.status(400).json({ error: 'Username ekziston.' });
      }
      const hash = await bcrypt.hash(password, 10);
      const newUser = await User.create({ username, password: hash, role });
      return res.status(201).json({ message: 'User u krijua', userId: newUser.id });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

// 🔄 2) Ndrysho rolin e një përdoruesi ekzistues
router.put(
  '/users/:id/role',
  verifyAdmin,
  async (req, res) => {
    try {
      const { role } = req.body;
      if (!['user','admin'].includes(role)) {
        return res.status(400).json({ error: 'Roli i pavlefshëm.' });
      }
      const user = await User.findByPk(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'Përdoruesi nuk u gjet.' });
      }
      user.role = role;
      await user.save();
      return res.json({ message: `Roli u përditësua në ${role}` });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

// 📦 3) Shembull i thjeshtë për marrjen e porosive (vetëm ADMIN)
router.get(
  '/orders',
  verifyAdmin,
  async (req, res) => {
    // Zëvendëso me logjikën real për t’i marrë nga DB
    res.json([{
      _id: "123",
      customerName: "Test User",
      phone: "044123456",
      address: "Prishtinë",
      items: [{ name: "iPhone 14" }],
      total: 1099
    }]);
  }
);

module.exports = router;
