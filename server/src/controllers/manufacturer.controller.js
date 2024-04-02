const { validationResult } = require("express-validator");

const Manufacturer = require("../models/manufacturer.model");
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
    Manufacturer.describe()
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
          Manufacturer.findAndCountAll({
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

// Find a single Manufacturer with an id
exports.findOne = (req, res) => {
  const id = req.params.id;
  Manufacturer.findByPk(id)
    .then((item) => {
      if (!item)
        res.status(404).json({
          success: false,
          errors: ["Manufacturer not found!"],
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

// Create and Save a new Manufacturer
exports.create = (req, res) => {
  const name = req.body.name;
  const address = req.body.address;
  const country = req.body.country;
  const phone = req.body.phone;
  const email = req.body.email;
  const website = req.body.website;
  Manufacturer.create({
    name: name,
    address: address,
    country: country,
    phone: phone,
    email: email,
    website: website,
  })
    .then((result) => {
      console.log("Created manufacturer");
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

// Update a Manufacturer by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;
  const name = req.body.name;
  const address = req.body.address;
  const country = req.body.country;
  const phone = req.body.phone;
  const email = req.body.email;
  const website = req.body.website;
  Manufacturer.findByPk(id)
    .then((item) => {
      if (!item) {
        return { status: 404, message: "Manufacturer not found!" };
      } else if (item.managed) {
        return {
          status: 409,
          message: "System managed manufacturer cannot be deleted!",
        };
      } else {
        item.name = name;
        item.address = address;
        item.country = country;
        item.phone = phone;
        item.email = email;
        item.website = website;

        const out = item.save();
        return { status: 200, result: out };
      }
    })
    .then((result) => {
      res.status(result.message).json(result.out);
    })
    .catch((err) => {
      console.log(err);
      res.status(409).json({
        success: false,
        errors: [err],
      });
    });
};

// Delete a Manufacturer with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;
  Manufacturer.findByPk(id)
    .then((item) => {
      if (!item) {
        return { status: 404, message: "Manufacturer not found!" };
      } else if (item.managed) {
        return {
          status: 409,
          message: "System managed manufacturer cannot be deleted!",
        };
      } else {
        const out = item.destroy({
          where: {
            id: id,
          },
        });
        return {
          status: 200,
          message: `Deleted manufacturer id: ${id}`,
          out: out,
        };
      }
    })
    .then((result) => {
      console.log(`Deleted response for manufacturer id: ${id}`);
      console.log(JSON.stringify(result));
      res.status(result.status).json({ message: `${result.message}` });
    })
    .catch((err) => console.log(err));
};
