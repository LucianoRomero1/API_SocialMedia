const express = require("express");
const router = express.Router();
const UserController = require("../controllers/user");
const check = require("../middlewares/auth");

router.get("/test-user", check.auth, UserController.testUser);
router.post("/register", UserController.register);
router.post("/login", UserController.login);

module.exports = router;
