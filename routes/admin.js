const express = require("express");
const router = express.Router(); 
const Listing = require("../models/listing");
const Review = require("../models/review");
const { isAdmin } = require("../middleware");


router.get("/stats", isAdmin, async (req, res) => {
    try {
        const [tL, pL, tR, pR] = await Promise.all([
            Listing.countDocuments({}),
            Listing.countDocuments({ status: "pending" }),
            Review.countDocuments({}),
            Review.countDocuments({ status: "pending" })
        ]);
        res.json({ listings: { total: tL, pending: pL }, reviews: { total: tR, pending: pR } });
    } catch (e) { res.status(500).json(e); }
});


router.get("/pending", isAdmin, async (req, res) => {
    const pendingListings = await Listing.find({ status: "pending" }).populate("owner");
    res.json(pendingListings);
});

router.patch("/approve-all", isAdmin, async (req, res) => {
    await Listing.updateMany({ status: "pending" }, { status: "approved" });
    res.json({ success: true, message: "All Pending Listings Approved!" });
});

router.patch("/approve/:id", isAdmin, async (req, res) => {
    await Listing.findByIdAndUpdate(req.params.id, { status: "approved" });
    res.json({ success: true, message: "Listing Approved!" });
});

router.delete("/reject/:id", isAdmin, async (req, res) => {
    await Listing.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Listing Rejected & Removed." });
});


router.get("/pending-reviews", isAdmin, async (req, res) => {
    const pendingReviews = await Review.find({ status: "pending" }).populate("author");
    res.json(pendingReviews);
});

router.patch("/reviews/approve/:id", isAdmin, async (req, res) => {
    await Review.findByIdAndUpdate(req.params.id, { status: "approved" });
    res.json({ success: true, message: "Review Approved!" });
});

router.delete("/reviews/reject/:id", isAdmin, async (req, res) => {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Review Rejected." });
});

module.exports = router; 