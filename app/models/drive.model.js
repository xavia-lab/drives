const { Sequelize, DataTypes } = require('sequelize');

const Model = require("./model.model");
const Retailer = require("./retailer.model");

const db = require('../util/database')

const Drive = db.define("drive", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  label: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  serial: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  datePurchased: {
    type: Sequelize.DATEONLY,
    allowNull: true,
  },
});

Model.hasMany(Drive, {
  foreignKey: {
    allowNull: false
  },
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
});
Drive.belongsTo(Model);

Retailer.hasMany(Drive, {
  foreignKey: {
    allowNull: false
  },
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
});
Drive.belongsTo(Retailer);

module.exports = Drive;
