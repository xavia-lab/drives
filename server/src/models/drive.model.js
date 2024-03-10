const { Sequelize, DataTypes } = require("sequelize");

const Model = require("./model.model");
const Retailer = require("./retailer.model");

const db = require("../configs/database.config");

const Drive = db.define(
  "drive",
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
    title: {
      type: DataTypes.VIRTUAL,
      get() {
        return `${this.name} | ${this.label} | ${this.serial}`;
      },
      set(value) {
        throw new Error("Do not try to set the `title` value!");
      },
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: [
          "name",
          "label",
          "serial",
          "datePurchased",
          "modelId",
          "retailerId",
        ],
      },
    ],
  },
);

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
