const express = require("express");
const router = express.Router();
const FollowController = require("../controllers/follow");

router.get("/test-follow", FollowController.testFollow);

module.exports = router;
