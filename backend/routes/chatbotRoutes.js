const express = require("express");
const router = express.Router();
const chatController = require("../controller/chatbotController");

router.post("/", chatController.chatWithBot);

module.exports = router;
