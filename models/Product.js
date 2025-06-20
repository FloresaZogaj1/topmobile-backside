const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Product = sequelize.define('Product', {
  name: DataTypes.STRING,
  price: DataTypes.FLOAT,
  description: DataTypes.STRING,
  category: DataTypes.STRING,
  image: DataTypes.STRING
});

module.exports = Product;
