const { validationResult } = require("express-validator");

const Event = require("../models/event.model");
const QueryParamsBuilder = require("../builders/query.params.builder");
const ColumnValidator = require("../validations/database.column.validation");

exports.findAll = (req, res) => {
  const requestQueryParams = req.query;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  } else {
    Event.describe()
      .then((tableSpec) => {
        const validationResult = ColumnValidator.validate(
          requestQueryParams,
          tableSpec,
        );
        console.log(
          `Column validation result: ${JSON.stringify(validationResult)}`,
        );
        if (!validationResult.success) {
          res.status(400).json(validationResult);
        } else {
          const queryParams = QueryParamsBuilder.build(requestQueryParams);
          Event.findAndCountAll({
            ...queryParams,
          })
            .then((result) => {
              res
                .status(200)
                .set("X-Pagination-Total-Count", result.count)
                .json(result.rows);
            })
            .catch((err) => console.log(err));
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(404).json({
          success: false,
          errors: [err],
        });
      });
  }
};

// Find a single Event with an id
exports.findOne = (req, res) => {
  const id = req.params.id;
  Event.findByPk(id)
    .then((item) => {
      if (!item)
        res.status(404).json({
          success: false,
          errors: ["Event not found!"],
        });
      else res.status(200).json(item);
    })
    .catch((err) => {
      console.log(err);
      res.status(404).json({
        success: false,
        errors: [err],
      });
    });
};

// Create and Save a new Event
exports.create = (req, res) => {
  const eventDate = req.body.eventDate;
  const heading = req.body.heading;
  const content = req.body.content;
  const driveId = req.body.driveId;
  Event.create({
    eventDate: eventDate,
    heading: heading,
    content: content,
    driveId: driveId,
  })
    .then((result) => {
      console.log("Created event");
      res.status(201).json(result);
    })
    .catch((err) => {
      console.log(err);
      res.status(409).json({
        success: false,
        errors: [err],
      });
    });
};

// Update a Event by the id in the request
exports.update = (req, res) => {
  const eventDate = req.body.eventDate;
  const heading = req.body.heading;
  const content = req.body.content;
  const driveId = req.body.driveId;
  Event.findByPk(id)
    .then((item) => {
      if (!item) {
        return { status: 404, message: "Event not found!" };
      } else {
        item.update({
          eventDate: eventDate,
          heading: heading,
          content: content,
          driveId: driveId,
        });
        return { status: 200, message: "Updated succssfully!" };
      }
    })
    .then((result) => {
      res.status(result.status).json(result.message);
    })
    .catch((err) => {
      console.log(err);
      res.status(409).json({
        success: false,
        errors: [err],
      });
    });
};

// Delete a Event with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;
  Event.findByPk(id)
    .then((item) => {
      if (!item) {
        return { status: 404, message: "Event not found!" };
      } else {
        const out = item.destroy({
          where: {
            id: id,
          },
        });
        return {
          status: 200,
          message: `Deleted event id: ${id}`,
          out: out,
        };
      }
    })
    .then((result) => {
      console.log(`Deleted response for event id: ${id}`);
      console.log(JSON.stringify(result));
      res.status(result.status).json({ message: `${result.message}` });
    })
    .catch((err) => console.log(err));
};
