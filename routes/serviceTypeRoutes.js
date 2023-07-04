const express = require("express");
const serviceTypeHandlers = require("../handlers/serviceTypeHandler");
const authHandler = require("../handlers/authHandler");

const router = express.Router();

router
  .route("/")
  .get(serviceTypeHandlers.getAllServiceTypes)
  .post(
    authHandler.protect,
    authHandler.restrictTo("ADMIN"),
    serviceTypeHandlers.createServiceType
  );

router
  .route("/:id")
  .get(serviceTypeHandlers.getOneServiceType)
  .patch(
    authHandler.protect,
    authHandler.restrictTo("ADMIN"),
    serviceTypeHandlers.updateServiceType
  )
  .delete(
    authHandler.protect,
    authHandler.restrictTo("ADMIN"),
    serviceTypeHandlers.deleteServiceType
  );

module.exports = router;
