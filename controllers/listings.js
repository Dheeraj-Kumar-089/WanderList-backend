const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
    const { state, page = 1, limit = 48 } = req.query;

    const filter = {
        $or: [
            { status: "approved" },
            { status: { $exists: false } }
        ]
    };

    if (state && state !== 'All States') {
        filter.state = { $regex: new RegExp(state, 'i') };
    }

    const p = parseInt(page);
    const l = parseInt(limit);

    let skip = (p - 1) * l;
    if (req.query.offset) {
        skip = parseInt(req.query.offset);
    }

    const allListings = await Listing.find(filter)
        .sort({ likes: -1, _id: -1 }) 
        .skip(skip)
        .limit(l);

    res.json(allListings);
};


module.exports.getStates = async (req, res) => {
    try {
        const states = await Listing.distinct("state", {
            state: { $nin: [null, ""] },
            $or: [
                { status: "approved" },
                { status: { $exists: false } }
            ]
        });
        res.json(states.sort());
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch states" });
    }
};


module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate({
        path: "reviews",
        
        match: { status: "approved" },
        populate: { path: "author" }
    })
        .populate("owner");


    if (!listing) return res.status(404).json({ error: "Listing not found" });
    res.json(listing);
};

module.exports.createListing = async (req, res) => {
    let geoData = [];
    try {
        const location = req.body.listing.location;
        const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`, { headers: { "User-Agent": "WanderLust-App" } });
        geoData = await geoResponse.json();
    } catch (err) {
        console.log("GeoCoding Error (Using defaults):", err);
    }

    if (!req.file) {
        
        return res.status(400).json({ error: "Image upload is mandatory!" });
    }

    let url = req.file.path;
    let filename = req.file.filename;
    let listing = req.body.listing;
    const newListing = new Listing(listing);
    newListing.owner = req.user._id;
    newListing.status = "pending";
    newListing.image = { url, filename };


    newListing.geometry = {
        type: "Point",
        coordinates: (geoData && geoData.length)
            ? [parseFloat(geoData[0].lon), parseFloat(geoData[0].lat)]
            : [0, 0] 
    };

    await newListing.save();
    res.status(201).json({ message: "Submitted! Waiting for admin approval.", listing: newListing });
};



module.exports.updateListing = async (req, res) => {

    let { id } = req.params;
    let newListing = await Listing.findByIdAndUpdate(id, { ...req.body.listing, status: "pending" }, { new: true, runValidators: true });

    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        newListing.image = { url, filename };
        await newListing.save();
    }
    res.json({ message: "Update Submitted for review", listing: newListing });
};

module.exports.destroyListing = async (req, res) => {
    await Listing.findByIdAndDelete(req.params.id);
    res.json({ message: "Listing Deleted" });
};

module.exports.likeListing = async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const listing = await Listing.findById(id);
    if (!listing) return res.status(404).json({ error: "Listing not found" });


    if (!listing.likedBy) listing.likedBy = [];

    const isLiked = listing.likedBy.includes(userId);

    if (isLiked) {

        await Listing.findByIdAndUpdate(id, {
            $pull: { likedBy: userId },
            $inc: { likes: -1 }
        });
        res.json({ likes: listing.likes - 1, isLiked: false });
    } else {

        await Listing.findByIdAndUpdate(id, {
            $addToSet: { likedBy: userId },
            $inc: { likes: 1 }
        });
        res.json({ likes: listing.likes + 1, isLiked: true });
    }
};