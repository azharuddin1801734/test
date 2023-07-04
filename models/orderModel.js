const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    specialist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Specialist",
    },
    facility: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
    },
    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
    price: Number,
    status: {
      type: String,
      enum: ["PENDING", "IN_TRAFFIC", "ONGOING", "COMPLETED", "CANCELLED"],
    },
    chatRoom: String,
    startCode: String,
    endCode: String,
    isPaid: Boolean,
    isRefunded: Boolean,
    isQueued: Boolean,
    clientTravelDistance: String,
    specialistTravelDistance: String,
    clientTravelTime: String,
    specialistTravelTime: String,
    servicingTotalTime: String,

    position: {
      type: Number,
      default: 0,
    },
    beforeOrder: this,
    afterOrder: this,

    pushToken: String,
    paymentIntent: String,
    paymentKey: String,
    updated_by: {
      type: String,
    },
    updated_on: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
