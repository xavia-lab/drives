const { Sequelize, DataTypes } = require('sequelize');

const db = require('../util/database')

const StorageType = db.define("storageType", {
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
});
  
module.exports = StorageType;
