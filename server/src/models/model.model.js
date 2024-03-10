const { Sequelize, DataTypes } = require("sequelize");

const Capacity = require("./capacity.model");
const Interface = require("./interface.model");
const Manufacturer = require("./manufacturer.model");
const StorageType = require("./storageType.model");

const db = require("../configs/database.config");

const Model = db.define(
  "model",
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
    number: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.VIRTUAL,
      get() {
        return `${this.name} | ${this.number}`;
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
          "number",
          "capacityId",
          // "interfaceId",
          // "manufacturerId",
          "storageTypeId",
        ],
      },
    ],
  },
);

Capacity.hasMany(Model, {
  foreignKey: {
    allowNull: false,
  },
  onDelete: "RESTRICT",
  onUpdate: "RESTRICT",
});
Model.belongsTo(Capacity);

Interface.hasMany(Model, {
  foreignKey: {
    allowNull: false,
  },
  onDelete: "RESTRICT",
  onUpdate: "RESTRICT",
});
Model.belongsTo(Interface);

Manufacturer.hasMany(Model, {
  foreignKey: {
    allowNull: false,
  },
  onDelete: "RESTRICT",
  onUpdate: "RESTRICT",
});
Model.belongsTo(Manufacturer);

StorageType.hasMany(Model, {
  foreignKey: {
    allowNull: false,
  },
  onDelete: "RESTRICT",
  onUpdate: "RESTRICT",
});
Model.belongsTo(StorageType);

module.exports = Model;
