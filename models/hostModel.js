const mongoose = require("mongoose");

const SUBSCRIPTION_PLANS = ["NO", "NORMAL", "PRO", "PREMIUM"];

const hostSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    plan: {
      type: String,
      enum: SUBSCRIPTION_PLANS,
      default: "NO",
      select: false,
    },
    planStart: {
      type: Date,
      default: Date.now,
      select: false,
    },
    planEnd: {
      type: Date,
      select: false,
    },
    facilities: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Facility",
      },
    ],
    planIsActive: {
      type: Boolean,
    },

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

const Host = mongoose.model("Host", hostSchema);

module.exports = Host;
