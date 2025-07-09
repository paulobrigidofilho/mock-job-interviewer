// ==== Module imports ======= //

const express = require('express');
const chatController = require('../controllers/chatController');
const router = express.Router();

// ============================ ROUTES ================================ //
// This route handles incoming chat messages from the frontend

router.post('/', chatController.handleChatMessage);

module.exports = router;