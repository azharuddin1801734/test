const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const ServiceType = require("../models/serviceTypeModel");

dotenv.config({ path: "../config.env" });
const serviceTypes = JSON.parse(
  fs.readFileSync(
    path.join(path.dirname("."), "service-types-simple.json"),
    "utf-8"
  )
);

const DB = process.env.DATABASE.replace(
  "<USER>",
  process.env.DATABASE_USER
).replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

mongoose.connect(DB).then(() => {
  console.log("DB connection successful");
});

const importData = async () => {
  try {
    await ServiceType.create(serviceTypes);
    console.log("Data successfully loaded");
  } catch (err) {
    console.log(err);
  }
};

const deleteData = async () => {
  try {
    await ServiceType.deleteMany();
    console.log("Data successfully deleted");
  } catch (err) {
    console.log(err);
  }
};

(async () => {
  try {
    if (process.argv[2] === "--import") {
      await importData();
    } else if (process.argv[2] === "--delete") {
      await deleteData();
    }
  } catch (err) {
    console.log(err);
  }
  process.exit(1);
})();
