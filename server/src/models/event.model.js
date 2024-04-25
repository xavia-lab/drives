const { Sequelize, DataTypes } = require("sequelize");

const Drive = require("./drive.model");

const db = require(".");

const Event = db.sequelize.define("event", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  eventDate: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  heading: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  content: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
  title: {
    type: DataTypes.VIRTUAL,
    get() {
      return `${this.eventDate} | ${this.heading}`;
    },
    set(value) {
      throw new Error("Do not try to set the `title` value!");
    },
  },
});

Drive.hasMany(Event, {
  foreignKey: {
    allowNull: false,
  },
  onDelete: "RESTRICT",
  onUpdate: "RESTRICT",
});
Event.belongsTo(Drive);

module.exports = Event;
