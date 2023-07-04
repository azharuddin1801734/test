const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const moment = require("moment");
const crypto = require("crypto");

const ROLES = ["ADMIN", "CLIENT", "PRO"];
const userSchema = new mongoose.Schema(
  {
    firebaseId: {
      type: String,
    },
    stripeCustomerId: {
      type: String,
    },
    pushToken: String,
    firstName: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    lastName: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, "Please provide your email."],
      unique: true,
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, "Please provide valid email"],
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        message: "Phone number must be valid",
        validator: function (val) {
          return validator.isMobilePhone(val, "any", { strictMode: true });
        },
      },
    },
    photo: String,
    gender: {
      type: String,
      enum: ["male", "female"],
    },
    role: {
      type: String,
      enum: ROLES,
      default: "CLIENT",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: [Number],
      address: {
        type: String,
        trim: true,
      },
    },
    favorites: {
      services: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Service",
        },
      ],
      facilities: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Facility",
        },
      ],
      specialists: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Specialist",
        },
      ],
    },
    password: {
      type: String,
      required: [true, "Please provide password"],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, "Please provide password confirm"],
      validate: {
        message: "Password do not match",
        validator: function (val) {
          return val === this.password;
        },
      },
    },
    passwordUpdatedAt: Date,
    passwordResetToken: String,
    passwordResetTokenExpires: Date,
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isMobilePhoneVerified: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    isSpecialist: {
      type: Boolean,
      default: false,
    },
    isHost: {
      type: Boolean,
      default: false,
    },
    searchLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: [Number],
      address: {
        type: String,
        trim: true,
      },
    },
    searchRadius: {
      type: Number,
      min: [1, "Search radius cannot be less than 1km"],
    },
    searchStylesFor: {
      type: String,
      enum: ["male", "female", "none"],
    },
    searchProGender: {
      type: String,
      enum: ["male", "female", "none"],
    },
    isConnected: {
      type: Boolean,
      default: false,
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

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordUpdatedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: true });
  next();
});

userSchema.methods.checkPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.updatedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordUpdatedAt) {
    return moment(this.passwordUpdatedAt).isAfter(moment(JWTTimestamp * 1000));
  }
  return false;
};

userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
