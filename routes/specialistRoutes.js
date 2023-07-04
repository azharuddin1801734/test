const express = require("express");
const specialistHandler = require("../handlers/specialistHandler");
const authHandler = require("../handlers/authHandler");

const router = express.Router();

router
  .route("/specialist")
  .get(
    authHandler.protect,
    authHandler.restrictTo("PRO"),
    specialistHandler.getSelfSpecialist
  )
  .patch(
    authHandler.protect,
    authHandler.restrictTo("PRO"),
    specialistHandler.restrictToSpecialist,
    specialistHandler.uploadSpecialistPhoto,
    specialistHandler.updateSpecialist
  );

router
  .route("/specialist/services")
  .get(
    authHandler.protect,
    authHandler.restrictTo("PRO"),
    specialistHandler.restrictToSpecialist,
    specialistHandler.getServices
  )
  .post(
    authHandler.protect,
    authHandler.restrictTo("PRO"),
    specialistHandler.restrictToSpecialist,
    specialistHandler.uploadServicePhoto,
    specialistHandler.createService
  );

router
  .route("/specialist/services/:id")
  .get(
    authHandler.protect,
    authHandler.restrictTo("PRO"),
    specialistHandler.restrictToSpecialist,
    specialistHandler.getService
  )
  .patch(
    authHandler.protect,
    authHandler.restrictTo("PRO"),
    specialistHandler.restrictToSpecialist,
    specialistHandler.uploadServicePhoto,
    specialistHandler.updateService
  )
  .delete(
    authHandler.protect,
    authHandler.restrictTo("PRO"),
    specialistHandler.restrictToSpecialist,
    specialistHandler.deleteService
  );

router
  .route("/specialist/orders")
  .get(
    authHandler.protect,
    authHandler.restrictTo("PRO"),
    specialistHandler.restrictToSpecialist,
    specialistHandler.getCurrentRequests
  );

router
  .route("/specialist/history")
  .get(
    authHandler.protect,
    authHandler.restrictTo("PRO"),
    specialistHandler.restrictToSpecialist,
    specialistHandler.getHistory
  );

router
  .route("/specialist/acceptOrder/:order")
  .get(
    authHandler.protect,
    authHandler.restrictTo("PRO"),
    specialistHandler.restrictToSpecialist,
    specialistHandler.acceptOrder
  );

router
  .route("/specialist/cancelOrder/:order")
  .get(
    authHandler.protect,
    authHandler.restrictTo("PRO"),
    specialistHandler.restrictToSpecialist,
    specialistHandler.rejectOrder
  );

router
  .route("/specialist/startOrder/:order/:code")
  .get(
    authHandler.protect,
    authHandler.restrictTo("PRO"),
    specialistHandler.restrictToSpecialist,
    specialistHandler.startOrder
  );

router
  .route("/specialist/completeOrder/:order/:code")
  .get(
    authHandler.protect,
    authHandler.restrictTo("PRO"),
    specialistHandler.restrictToSpecialist,
    specialistHandler.completeOrder
  );

router
  .route("/specialist/goOnline")
  .post(
    authHandler.protect,
    authHandler.restrictTo("PRO"),
    specialistHandler.restrictToSpecialist,
    specialistHandler.becomeAvailable
  );

router
  .route("/specialist/goOffline")
  .post(
    authHandler.protect,
    authHandler.restrictTo("PRO"),
    specialistHandler.restrictToSpecialist,
    specialistHandler.becomeUnavailable
  );

router
  .route("/specialist/startQueue")
  .post(
    authHandler.protect,
    authHandler.restrictTo("PRO"),
    specialistHandler.restrictToSpecialist,
    specialistHandler.startQueue
  );

router
  .route("/specialist/stopQueue")
  .post(
    authHandler.protect,
    authHandler.restrictTo("PRO"),
    specialistHandler.restrictToSpecialist,
    specialistHandler.stopQueue
  );

router
  .route("/specialist/services/stats/:id")
  .get(
    authHandler.protect,
    authHandler.restrictTo("PRO"),
    specialistHandler.restrictToSpecialist,
    specialistHandler.getServiceStats
  );

router
  .route("/specialist/stories")
  .get(
    authHandler.protect,
    authHandler.restrictTo("PRO"),
    specialistHandler.restrictToSpecialist,
    specialistHandler.getStories
  )
  .post(
    authHandler.protect,
    authHandler.restrictTo("PRO"),
    specialistHandler.restrictToSpecialist,
    specialistHandler.uploadStoryPhoto,
    specialistHandler.postStory
  );

router
  .route("/specialist/stories/:id")
  .delete(
    authHandler.protect,
    authHandler.restrictTo("PRO"),
    specialistHandler.restrictToSpecialist,
    specialistHandler.deleteStory
  );

router.route("/").get(specialistHandler.getAllSpecialists);
router.route("/:id").get(specialistHandler.getOneSpecialist);

module.exports = router;
