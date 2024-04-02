const { validationResult } = require("express-validator");

const Retailer = require("../models/retailer.model");
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

  Retailer.findAndCountAll({
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

// Find a single Retailer with an id
exports.findOne = (req, res) => {
  const id = req.params.id;
  Retailer.findByPk(id)
    .then((item) => {
      if (!item) {
        return res.status(404).json({ message: "Retailer not found!" });
      }
      res.status(200).json(item);
    })
    .catch((err) => console.log(err));
};

// Create and Save a new Retailer
exports.create = (req, res) => {
  const name = req.body.name;
  const address = req.body.address;
  const country = req.body.country;
  const phone = req.body.phone;
  const email = req.body.email;
  const website = req.body.website;
  Retailer.create({
    name: name,
    address: address,
    country: country,
    phone: phone,
    email: email,
    website: website,
  })
    .then((result) => {
      console.log("Created retailer");
      res.status(201).json(result);
    })
    .catch((err) => {
      console.log(err);
    });
};

// Update a Retailer by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;
  const name = req.body.name;
  const address = req.body.address;
  const country = req.body.country;
  const phone = req.body.phone;
  const email = req.body.email;
  const website = req.body.website;
  Retailer.findByPk(id)
    .then((item) => {
      if (!item) {
        return { status: 404, message: "Retailer not found!" };
      } else if (item.managed) {
        return {
          status: 409,
          message: "System managed retailer cannot be deleted!",
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
    .catch((err) => console.log(err));
};

// Delete a Retailer with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;
  Retailer.findByPk(id)
    .then((item) => {
      if (!item) {
        return { status: 404, message: "Retailer not found!" };
      } else if (item.managed) {
        return {
          status: 409,
          message: "System managed retailer cannot be deleted!",
        };
      } else {
        const out = item.destroy({
          where: {
            id: id,
          },
        });
        return {
          status: 200,
          message: `Deleted retailer id: ${id}`,
          out: out,
        };
      }
    })
    .then((result) => {
      console.log(`Deleted response for retailer id: ${id}`);
      console.log(JSON.stringify(result));
      res.status(result.status).json({ message: `${result.message}` });
    })
    .catch((err) => console.log(err));
};
