const express = require("express");
const router = express.Router();

const wrapAsync = require("../utils/wrapAsync.js");
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const { index, showListing, createListing, updateListing, destroyListing,likeListing } = require("../controllers/listings.js");
const multer = require('multer');
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });



router.route("/")
    .get(wrapAsync(index))
    .post(isLoggedIn, upload.single("listing[image]"),validateListing, wrapAsync(createListing));

router.get("/states", wrapAsync(require("../controllers/listings.js").getStates));

router.post("/:id/like", isLoggedIn, wrapAsync(likeListing));



router.route("/:id")
    .get(wrapAsync(showListing))
    .put(isLoggedIn, isOwner, upload.single("listing[image]"), validateListing,wrapAsync(updateListing))
    .delete(isLoggedIn, isOwner, wrapAsync(destroyListing));



module.exports = router;