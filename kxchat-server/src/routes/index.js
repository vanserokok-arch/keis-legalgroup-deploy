const express = require('express');
const chatController = require('../controllers/chatController');
const conversationController = require('../controllers/conversationController');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'KXchat', version: 'mvp' });
});

router.post('/chat/send', chatController.sendMessage);
router.get('/conversations', conversationController.listConversations);
router.get('/conversations/:id', conversationController.getConversationById);
router.post('/conversations/:id/reply', conversationController.replyToConversation);
router.patch('/conversations/:id/status', conversationController.updateStatus);

module.exports = router;
