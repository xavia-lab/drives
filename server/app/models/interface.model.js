const { Sequelize, DataTypes } = require("sequelize");

const db = require("../configs/database.config");

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
  title: {
    type: DataTypes.VIRTUAL,
    get() {
      return `${this.name} ${this.speed} | ${this.form}`;
    },
    set(value) {
      throw new Error("Do not try to set the `title` value!");
    },
  },
});

module.exports = Interface;
