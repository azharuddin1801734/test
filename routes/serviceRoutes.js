const express = require("express");
const serviceHandlers = require("../handlers/serviceHandler");

const router = express.Router();

router.get(
  "/services-within/:distance/center/:latlng/unit/:unit/:serviceGender/:specialistGender/:service/:serviceType/:minPrice/:maxPrice",
  serviceHandlers.getServicesWithin
);

module.exports = router;
