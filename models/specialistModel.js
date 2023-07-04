const mongoose = require("mongoose");

const SUBSCRIPTION_PLANS = ["NO", "NORMAL", "PRO", "PREMIUM"];

const specialistSchema = new mongoose.Schema(
  {
    User: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      unique: [true, "A specialist must be a user"],
      required: [true, "A specialist must be associated to a user"],
    },
    bio: {
      type: String,
      maxLength: [280, "Description must not exceed 280 characters"],
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: [Number],
    },
    distance: {
      type: Number,
      default: 3000,
      required: [true, "A specialist must specified his/her travel distance"],
    },
    plan: {
      type: String,
      enum: SUBSCRIPTION_PLANS,
      default: "NO",
      select: false,
    },
    planStart: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    planEnd: {
      type: Date,
      select: false,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    isBusy: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    availableFrom: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    isQueueing: {
      type: Boolean,
      default: false,
    },
    frontQueue: {
      type: mongoose.Schema.ObjectId,
      ref: "Order",
    },
    backQueue: {
      type: mongoose.Schema.ObjectId,
      ref: "Order",
    },
    isActive: {
      type: Boolean,
      default: true,
      select: false,
    },
    queue: {
      type: Number,
      default: 0,
    },
    maxQueue: {
      type: Number,
      default: 4,
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
// Virtual populate.
specialistSchema.virtual("services", {
  ref: "Service",
  foreignField: "specialist",
  localField: "_id",
});

specialistSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "specialist",
  localField: "_id",
});

specialistSchema.virtual("orders", {
  ref: "Order",
  foreignField: "specialist",
  localField: "_id",
});
specialistSchema.virtual("stories", {
  ref: "Story",
  foreignField: "specialist",
  localField: "_id",
});
specialistSchema.index({ location: "2dsphere" });

const Specialist = mongoose.model("Specialist", specialistSchema);

module.exports = Specialist;
