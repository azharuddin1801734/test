const geolib = require("geolib");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Facility = require("../models/facilityModel");
const Specialist = require("../models/specialistModel");

exports.getServicesWithin = catchAsync(async (req, res, next) => {
  const {
    distance,
    latlng,
    unit,
    serviceGender,
    proGender,
    service,
    serviceType,
    minPrice,
    maxPrice,
  } = req.params;
  const [lat, lng] = latlng.split(",");
  const searchRadius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;
  const maxSpecialistDistance =
    unit === "mi" ? (distance + 1.9) / 3963.2 : (distance + 3) / 6378.1;
  if (!lat || !lng) {
    return next(new AppError("Please provide latitude and longitude", 400));
  }

  const facilities = await Facility.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], searchRadius] } },
  });
  const filters = {};
  if (proGender && proGender !== "all") {
    filters.user = { gender: proGender };
  }
  let specialists = await Specialist.find({
    ...filters,
    location: {
      $geoWithin: { $centerSphere: [[lng, lat], maxSpecialistDistance] },
    },
    isOnline: true,
  }).populate([
    "user",
    { path: "services", populate: ["serviceType"] },
    "frontQueue",
    "backQueue",
  ]);

  if (service && service !== "all") {
    specialists = specialists.filter(
      (specialist) =>
        specialist.services.filter(
          (ser) =>
            ser.serviceType.name.toLowerCase() === service.toLocaleLowerCase()
        ).length > 0
    );
  }

  if (serviceType && serviceType !== "all") {
    specialists = specialists.filter(
      (specialist) =>
        specialist.services.filter(
          (ser) =>
            ser.serviceType.category.toLowerCase() ===
            serviceType.toLocaleLowerCase()
        ).length > 0
    );
  }
  if (minPrice && minPrice > 0) {
    specialists = specialists.filter(
      (specialist) =>
        specialist.services.filter((ser) => ser.price >= +minPrice).length > 0
    );
  }

  if (maxPrice) {
    specialists = specialists.filter(
      (specialist) =>
        specialist.services.filter((ser) => ser.price <= +maxPrice).length > 0
    );
  }

  if (serviceGender && serviceGender === "male") {
    specialists = specialists.filter(
      (specialist) =>
        specialist.services.filter((ser) => ser.forMale).length > 0
    );
  }
  if (serviceGender && serviceGender === "female") {
    specialists = specialists.filter(
      (specialist) =>
        specialist.services.filter((ser) => ser.forFemale).length > 0
    );
  }

  const facilitiesAndSpecialists = [];
  facilities.forEach((facility, index) => {
    facilitiesAndSpecialists[index] = {
      ...facility.toObject(),
      specialists: [],
    };
    specialists.forEach((specialist) => {
      const distanceBtw = geolib.getDistance(
        {
          latitude: specialist.location.coordinates[1],
          longitude: specialist.location.coordinates[0],
        },
        {
          latitude: facility.location.coordinates[1],
          longitude: facility.location.coordinates[0],
        }
      );
      if (distanceBtw <= specialist.distance) {
        facilitiesAndSpecialists[index].specialists.push(specialist);
      }
    });
  });

  res.status(200).json({
    status: "success",
    data: {
      facilities: facilitiesAndSpecialists,
    },
  });
});
