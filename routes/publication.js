const express = require("express");
const router = express.Router();
const PublicationController = require("../controllers/publication");

router.get("/test-publication", PublicationController.testPublication);

module.exports = router;
