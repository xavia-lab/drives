const { Sequelize, DataTypes } = require("sequelize");

const db = require("../configs/database.config");

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
    unique: true,
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
