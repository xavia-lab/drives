const { Sequelize, DataTypes } = require("sequelize");

const db = require(".");

const Interface = db.sequelize.define("formFactor", {
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
  managed: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
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
});

module.exports = Interface;
