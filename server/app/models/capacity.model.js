const { Sequelize, DataTypes } = require('sequelize');

const db = require('../util/database')

const Capacity = db.define("capacity", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  value: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: {
        msg: "The capacity value must be in decimal.",
      },
      min: 1,
    },
  },
  unit: {
    type: Sequelize.STRING(3),
    allowNull: false,
    validate: {
      isIn: {
        args: [['MB', 'GB', 'TB', 'PB']],
        msg: "Must be a valid storage capacity unit.",
      },
    },
  },
});
  
module.exports = Capacity;
