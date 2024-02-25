const { Sequelize, DataTypes } = require('sequelize');

const Capacity = require("./capacity.model");
const Interface = require("./interface.model");
const Manufacturer = require("./manufacturer.model");
const StorageType = require('../models/storageType.model');

const db = require('../util/database')

const Model = db.define("model", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  number: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});

Capacity.hasMany(Model, {
  foreignKey: {
    allowNull: false
  },
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
});
Model.belongsTo(Capacity);

Interface.hasMany(Model, {
  foreignKey: {
    allowNull: false
  },
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
});
Model.belongsTo(Interface);

Manufacturer.hasMany(Model, {
  foreignKey: {
    allowNull: false
  },
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
});
Model.belongsTo(Manufacturer);

StorageType.hasMany(Model, {
  foreignKey: {
    allowNull: false
  },
  onDelete: 'RESTRICT',
  onUpdate: 'RESTRICT',
});
Model.belongsTo(StorageType);

module.exports = Model;
