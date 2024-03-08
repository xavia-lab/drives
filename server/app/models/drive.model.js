const { Sequelize, DataTypes } = require("sequelize");

const Model = require("./model.model");
const Retailer = require("./retailer.model");

const db = require("../configs/database.config");

const Drive = db.define("drive", {
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
    allowNull: false,
  },
  onDelete: "RESTRICT",
  onUpdate: "RESTRICT",
});
Drive.belongsTo(Model);

Retailer.hasMany(Drive, {
  foreignKey: {
    allowNull: false,
  },
  onDelete: "RESTRICT",
  onUpdate: "RESTRICT",
});
Drive.belongsTo(Retailer);

module.exports = Drive;
