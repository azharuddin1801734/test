const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      trim: true,
      maxLength: [300, "A review's text must be no longer than 180 characters"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    specialist: {
      type: mongoose.Schema.ObjectId,
      ref: "Specialist",
    },
    facility: {
      type: mongoose.Schema.ObjectId,
      ref: "facility",
    },
    service: {
      type: mongoose.Schema.ObjectId,
      ref: "Service",
    },
    updated_by: {
      type: String,
    },
    updated_on: {
      type: Date,
      default: Date.now,
    },
    createAt: {
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

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
