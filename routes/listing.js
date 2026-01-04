const express = require("express");
const router = express.Router();

const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const { index, showListing, createListing, updateListing, destroyListing } = require("../controllers/listings.js");
const multer = require('multer');
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });



router.route("/")
    .get(wrapAsync(index))
    .post(isLoggedIn, upload.single("listing[image]"),validateListing, wrapAsync(createListing));



router.route("/:id")
    .get(wrapAsync(showListing))
    .put(isLoggedIn, isOwner, upload.single("listing[image]"), validateListing,wrapAsync(updateListing))
    .delete(isLoggedIn, isOwner, wrapAsync(destroyListing));



module.exports = router;