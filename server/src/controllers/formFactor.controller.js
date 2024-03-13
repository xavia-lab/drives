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
  const formFactorId = req.params.id;
  FormFactor.findByPk(formFactorId)
    .then((formFactor) => {
      if (!formFactor) {
        return res.status(404).json({ message: "Form factor not found!" });
      }
      res.status(200).json(formFactor);
    })
    .catch((err) => console.log(err));
};

// Create and Save a new FormFactor
exports.create = (req, res) => {
  const formFactorName = req.body.name;
  FormFactor.create({
    name: formFactorName,
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
  const formFactorId = req.params.id;
  const formFactorName = req.body.name;
  FormFactor.findByPk(formFactorId)
    .then((formFactor) => {
      if (!formFactor) {
        return { status: 404, message: "FormFactor not found!" };
      } else if (formFactor.managed) {
        return {
          status: 409,
          message: "System managed formFactor cannot be deleted!",
        };
      } else {
        formFactor.name = formFactorName;

        const out = formFactor.save();
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
  const formFactorId = req.params.id;
  FormFactor.findByPk(formFactorId)
    .then((formFactor) => {
      if (!formFactor) {
        return { status: 404, message: "FormFactor not found!" };
      } else if (formFactor.managed) {
        return {
          status: 409,
          message: "System managed formFactor cannot be deleted!",
        };
      } else {
        const out = formFactor.destroy({
          where: {
            id: formFactorId,
          },
        });
        return {
          status: 200,
          message: `Deleted formFactorId: ${formFactorId}`,
          out: out,
        };
      }
    })
    .then((result) => {
      console.log(`Deleted response for formFactorId: ${formFactorId}`);
      console.log(JSON.stringify(result));
      res.status(result.status).json({ message: `${result.message}` });
    })
    .catch((err) => console.log(err));
};
