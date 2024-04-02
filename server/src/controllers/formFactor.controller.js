const { validationResult } = require("express-validator");

const FormFactor = require("../models/formFactor.model");
const QueryParamsBuilder = require("../builders/query.params.builder");

exports.findAll = (req, res) => {
  const requestQueryParams = req.query;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const queryParams = QueryParamsBuilder.build(requestQueryParams);

  FormFactor.findAndCountAll({
    ...queryParams,
  })
    .then((result) => {
      res
        .status(200)
        .set("X-Pagination-Total-Count", result.count)
        .json(result.rows);
    })
    .catch((err) => console.log(err));
};

// Find a single FormFactor with an id
exports.findOne = (req, res) => {
  const id = req.params.id;
  FormFactor.findByPk(id)
    .then((item) => {
      if (!item) {
        return res.status(404).json({ message: "Form factor not found!" });
      }
      res.status(200).json(item);
    })
    .catch((err) => console.log(err));
};

// Create and Save a new FormFactor
exports.create = (req, res) => {
  const name = req.body.name;
  FormFactor.create({
    name: name,
  })
    .then((result) => {
      console.log("Created form factor");
      res.status(201).json(result);
    })
    .catch((err) => {
      console.log(err);
    });
};

// Update a FormFactor by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;
  const name = req.body.name;
  FormFactor.findByPk(id)
    .then((item) => {
      if (!item) {
        return { status: 404, message: "FormFactor not found!" };
      } else if (item.managed) {
        return {
          status: 409,
          message: "System managed form factor cannot be deleted!",
        };
      } else {
        item.name = name;

        const out = item.save();
        return { status: 200, result: out };
      }
    })
    .then((result) => {
      res.status(result.message).json(result.out);
    })
    .catch((err) => console.log(err));
};

// Delete a FormFactor with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;
  FormFactor.findByPk(id)
    .then((item) => {
      if (!item) {
        return { status: 404, message: "Form factor not found!" };
      } else if (item.managed) {
        return {
          status: 409,
          message: "System managed form factor cannot be deleted!",
        };
      } else {
        const out = item.destroy({
          where: {
            id: id,
          },
        });
        return {
          status: 200,
          message: `Deleted form factor id: ${id}`,
          out: out,
        };
      }
    })
    .then((result) => {
      console.log(`Deleted response for form factor id: ${id}`);
      console.log(JSON.stringify(result));
      res.status(result.status).json({ message: `${result.message}` });
    })
    .catch((err) => console.log(err));
};