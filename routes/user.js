const express = require("express");
const router = express.Router();
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync.js");
const { signup, login, logout } = require("../controllers/user.js");

router.post("/signup", wrapAsync(signup));

router.post("/login", 
    passport.authenticate("local", { 
        
      
    }), 
    wrapAsync(login) 
);

router.get("/logout", logout);


router.get("/current_user", (req, res) => {
    
    res.json(req.user || null);
});

module.exports = router;