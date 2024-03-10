const { Sequelize, DataTypes } = require("sequelize");

const db = require("../configs/database.config");

const Capacity = db.define(
  "capacity",
  {
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
          args: [["MB", "GB", "TB", "PB"]],
          msg: "Must be a valid storage capacity unit.",
        },
      },
    },
    title: {
      type: DataTypes.VIRTUAL,
      get() {
        return `${this.name}`;
      },
      set(value) {
        throw new Error("Do not try to set the `title` value!");
      },
    },
  },
  {
    indexes: [{ unique: true, fields: ["value", "unit"] }],
  },
);

module.exports = Capacity;
