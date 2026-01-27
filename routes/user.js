const express = require("express");
const router = express.Router();
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync.js");
const { signup, login, logout } = require("../controllers/user.js");

router.post("/signup", wrapAsync(signup));

router.post("/login", 
    (req, res, next) => {
        passport.authenticate("local", (err, user, info) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.status(401).json({ error: info.message || "Invalid username or password" });
            }
            req.logIn(user, (err) => {
                if (err) {
                    return next(err);
                }
                next();
            });
        })(req, res, next);
    },
    wrapAsync(login)
);

router.get("/logout", logout);


router.get("/current_user", (req, res) => {
    
    res.json(req.user || null);
});

module.exports = router;