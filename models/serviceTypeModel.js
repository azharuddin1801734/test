const mongoose = require("mongoose");
const slugify = require("slugify");
const { SERVICE_CATEGORIES } = require("../constants");

const serviceTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A service type must have a name"],
      unique: true,
      trim: true,
      minLength: [3, "A service type's name must have at least 3 characters"],
      maxLength: [30, "A service type's name must have at most 30 characters"],
    },
    category: {
      type: String,
      required: [true, "A service type must have a category"],
      enum: SERVICE_CATEGORIES,
      default: "Haircut",
    },
    slug: {
      type: String,
    },
    photo: {
      type: String,
      required: [true, "A service type must have a default picture"],
    },
    description: {
      type: String,
      trim: true,
      maxLength: [
        180,
        "A service type's description must be no longer than 180 characters",
      ],
    },
    minimumPrice: {
      type: Number,
      required: [true, "A service type must have a minimum price"],
      min: [3, "A service's type minimum price must not be below 3 dollars"],
    },
    averagePrice: {
      type: Number,
      default: 0,
    },
    averageDuration: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      select: false,
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

serviceTypeSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

const ServiceType = mongoose.model("ServiceType", serviceTypeSchema);

module.exports = ServiceType;
