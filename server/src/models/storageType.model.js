const { Sequelize, DataTypes } = require("sequelize");

const db = require(".");

const StorageType = db.sequelize.define("storageType", {
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

module.exports = StorageType;
