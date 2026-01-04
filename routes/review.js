const express = require("express");
const router = express.Router({ mergeParams: true }); 

const wrapAsync = require("../utils/wrapAsync.js");


const { createReview, destroyReview } = require("../controllers/review.js");
const { validateReview, isLoggedIn, isReviewAuthor } = require("../middleware.js"); // Agar middlewares hain toh


router.post("/",isLoggedIn, validateReview, wrapAsync(createReview));


router.delete("/:reviewId",isLoggedIn,isReviewAuthor, wrapAsync(destroyReview));

module.exports = router;