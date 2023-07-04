const express = require("express");
const hostHandler = require("../handlers/hostHandler");
const authHandler = require("../handlers/authHandler");

const router = express.Router();

router
  .route("/getHost")
  .get(
    authHandler.protect,
    authHandler.restrictTo("PRO"),
    hostHandler.restrictToHost,
    hostHandler.getSelfSHost
  );

router
  .route("/host/history")
  .get(
    authHandler.protect,
    authHandler.restrictTo("PRO"),
    hostHandler.restrictToHost,
    hostHandler.getHistoryFacility
  );

router
  .route("/host/history/:id")
  .get(
    authHandler.protect,
    authHandler.restrictTo("PRO"),
    hostHandler.restrictToHost,
    hostHandler.getFacilityBookingHistory
  );

router
  .route("/host/facilities")
  .get(
    authHandler.protect,
    authHandler.restrictTo("PRO"),
    hostHandler.restrictToHost,
    hostHandler.getHostFacilities
  )
  .post(
    authHandler.protect,
    authHandler.restrictTo("PRO"),
    hostHandler.restrictToHost,
    hostHandler.uploadFacilityGallery,
    hostHandler.createFacility
  );

router
  .route("/host/facilities/:id")
  .patch(
    authHandler.protect,
    authHandler.restrictTo("PRO"),
    hostHandler.restrictToHost,
    hostHandler.uploadFacilityGallery,
    hostHandler.updateFacility
  );

router.route("/").get(hostHandler.getAllHosts);
router.route("/:id").get(hostHandler.getOneHost);

module.exports = router;
