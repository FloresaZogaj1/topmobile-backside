const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Order = sequelize.define("Order", {
  customerName: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.STRING, allowNull: false },
  items: {
    type: DataTypes.TEXT,
    allowNull: false,
    get() {
      const raw = this.getDataValue('items');
      try {
        return JSON.parse(raw || "[]");
      } catch {
        return [];
      }
    },
    set(val) {
      this.setDataValue('items', JSON.stringify(val));
    }
  },
  total: { type: DataTypes.FLOAT, allowNull: false }
});

module.exports = Order;
