const express = require("express");
const router = express.Router();
const verifyAdmin = require("../middleware/verifyAdmin");

// const Order = require("../models/Order"); // Ç'komentoj nëse ke model Order

// Shembull endpoint që kthen të gjitha porositë
router.get("/orders", verifyAdmin, async (req, res) => {
  // Merr të gjitha porositë nga databaza
  // const orders = await Order.find();
  // res.json(orders);

  // Shembull statik, ndërron me kodin real
  res.json([
    {
      _id: "123",
      customerName: "Test User",
      phone: "044123456",
      address: "Prishtinë",
      items: [{ name: "iPhone 14" }],
      total: 1099,
    }
  ]);
});

module.exports = router;
