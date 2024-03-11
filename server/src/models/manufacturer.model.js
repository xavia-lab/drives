const { Sequelize, DataTypes } = require("sequelize");

const db = require("../configs/database.config");

const Manufacturer = db.define(
  "manufacturer",
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
    },
    address: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    country: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    phone: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: true,
      // validate: {
      //   isEmail: true,
      // },
    },
    website: {
      type: Sequelize.STRING,
      allowNull: true,
      // validate: {
      //   isUrl: true,
      // },
    },
    title: {
      type: DataTypes.VIRTUAL,
      get() {
        const x = [this.name, this.country];
        return `${x.filter(Boolean).join(", ")}`;
      },
      set(value) {
        throw new Error("Do not try to set the `title` value!");
      },
    },
  },
  {
    indexes: [{ unique: true, fields: ["name", "country"] }],
  },
);

module.exports = Manufacturer;
