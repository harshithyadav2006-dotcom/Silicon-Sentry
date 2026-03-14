const express = require("express");
const { transcribeAndTranslate } = require("../controllers/speechController");

const router = express.Router();

router.post("/transcribe", transcribeAndTranslate);

module.exports = router;
