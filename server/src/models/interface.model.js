const { Sequelize, DataTypes } = require("sequelize");

const db = require(".");

const Interface = db.sequelize.define("interface", {
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
  throughput: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  managed: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  title: {
    type: DataTypes.VIRTUAL,
    get() {
      return `${this.name} ${this.throughput}`;
    },
    set(value) {
      throw new Error("Do not try to set the `title` value!");
    },
  },
});

module.exports = Interface;
