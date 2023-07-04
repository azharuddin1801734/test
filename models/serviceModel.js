const mongoose = require("mongoose");
const Specialist = require("./specialistModel");

const serviceSchema = new mongoose.Schema(
  {
    specialist: {
      type: mongoose.Schema.ObjectId,
      ref: "Specialist",
      index: true,
    },
    serviceType: {
      type: mongoose.Schema.ObjectId,
      ref: "ServiceType",
      index: true,
    },
    photo: String,
    description: {
      type: String,
      trim: true,
      maxLength: [
        180,
        "A service's description must be no longer than 180 characters",
      ],
    },
    estimatedDuration: {
      hours: Number,
      minutes: Number,
      totalMinutes: Number,
    },
    rating: Number,
    forMale: Boolean,
    forFemale: Boolean,
    price: {
      type: Number,
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
serviceSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "service",
  localField: "_id",
});
serviceSchema.index({ specialist: 1, serviceType: 1 }, { unique: true });

// eslint-disable-next-line prefer-arrow-callback
serviceSchema.post("save", async function (doc, next) {
  await Specialist.findByIdAndUpdate(
    doc.specialist,
    { $push: { services: doc } },
    { new: true, runValidators: true }
  );
  next();
});

const Service = mongoose.model("Service", serviceSchema);

module.exports = Service;
