const express = require("express");
const orderHandler = require("../handlers/orderHandler");
const authHandler = require("../handlers/authHandler");

const router = express.Router();

router.post(
  "/checkout-session/:services/:facility/:maxTime",
  authHandler.protect,
  orderHandler.getCheckoutSession
);

router.post("/pay/:order", authHandler.protect, orderHandler.payOrder);

module.exports = router;
