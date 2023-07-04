const express = require("express");
const {
  SERVICE_CATEGORIES,
  SERVICE_CATEGORIES_CATCH,
} = require("../constants");

const router = express.Router();

router.route("/").get((req, res, next) => {
  const categories = SERVICE_CATEGORIES.map((category, index) => ({
    name: category,
    catchPhrase: SERVICE_CATEGORIES_CATCH[index],
  }));
  res.status(200).json({
    status: "success",
    results: categories.length,
    data: {
      categories,
    },
  });
});

module.exports = router;
