const { Sequelize } = require('sequelize');
require('dotenv').config(); // që të lexojë variablat nga .env

const sequelize = new Sequelize(
  process.env.DB_NAME,      // Emri i databazës
  process.env.DB_USER,      // Useri
  process.env.DB_PASSWORD,  // Password-i
  {
    host: process.env.DB_HOST, // Host-i
    dialect: 'mysql',
    port: process.env.DB_PORT  // Porti (zakonisht 3306)
  }
);

module.exports = sequelize;
