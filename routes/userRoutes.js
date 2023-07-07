const express = require("express");
const authHandler = require("../handlers/authHandler");
const userHandler = require("../handlers/userHandler");

const router = express.Router();

router.post("/signup", authHandler.signup);
router.post("/signin", authHandler.signin);
router.post("/forgotPassword", authHandler.forgotPassword);
router.patch("/resetPassword/:resetToken", authHandler.resetPassword);
router.patch(
  "/updatePassword",
  authHandler.protect,
  authHandler.updatePassword
);

router.get("/getMe", authHandler.protect, userHandler.getMyInfo);
router.patch(
  "/updateMe",
  authHandler.protect,
  userHandler.uploadUserPhoto,
  userHandler.updateMe
);
router.delete("/deleteMe", authHandler.protect, userHandler.deleteMe);

router.post(
  "/becomeSpecialist",
  authHandler.protect,
     authHandler.restrictTo("CLIENT", "PRO"),
     authHandler.restrictToProType("host"),
  userHandler.becomeSpecialist
);

router.post(
  "/becomeHost",
  authHandler.protect,
  // authHandler.restrictTo("CLIENT", "PRO"),
  // authHandler.restrictToProType("specialist"),
  userHandler.becomeHost
);

router
  .route("/user/orders")
  .get(authHandler.protect, userHandler.getUserCurrentRequests);

router
  .route("/chat/:order")
  .post(
    authHandler.protect,
    userHandler.uploadImageMessage,
    userHandler.sendMessage
  )
  .get(authHandler.protect, userHandler.getMessages);

router
  .route("/conversations")
  .get(authHandler.protect, userHandler.getConversations);
module.exports = router;
