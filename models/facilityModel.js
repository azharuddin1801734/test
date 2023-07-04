const mongoose = require("mongoose");
const Host = require("./hostModel");

const facilitySchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.ObjectId,
      ref: "Host",
    },
    name: {
      type: String,
      minLength: [3, "Facility's name must have at least 3 characters"],
      maxLength: [60, "Facility's name must have at most 60 characters"],
    },
    street: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    region: {
      type: String,
    },
    aptSuite: {
      type: String,
    },
    address: {
      type: String,
      unique: true,
    },
    postcode: {
      type: String,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: [Number],
    },
    closingTime: Date,
    openingTime: Date,
    closingAt: String,
    openingAt: String,
    isOperational: Boolean,
    description: {
      type: String,
      trim: true,
      maxLength: [
        180,
        "A facility's description must be no longer than 180 characters",
      ],
    },
    seatCapacity: Number,
    availableSeats: Number,
    coverImage: {
      type: String,
      required: [true, "Please provide facility cover image"],
    },
    gallery: [String],
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

facilitySchema.virtual("reviews", {
  ref: "Review",
  foreignField: "facility",
  localField: "_id",
});
facilitySchema.index({ host: 1, name: 1 }, { unique: true });
facilitySchema.index({ location: "2dsphere" });

// eslint-disable-next-line prefer-arrow-callback
facilitySchema.post("save", async function (doc, next) {
  await Host.findByIdAndUpdate(
    doc.host,
    { $push: { facilities: doc } },
    { new: true, runValidators: true }
  );
  next();
});

const Facility = mongoose.model("Facility", facilitySchema);

module.exports = Facility;
