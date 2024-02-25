const { Sequelize, DataTypes } = require('sequelize');

const db = require('../util/database')

const Interface = db.define("interface", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  form: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  speed: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});
  
module.exports = Interface;
