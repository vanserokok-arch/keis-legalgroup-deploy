const {
  getConversations,
  getConversation,
  getMessages,
  saveMessage,
  updateConversationStatus,
} = require('../services/chatService');
const { broadcastNewMessage } = require('../socket');

const listConversations = async (req, res, next) => {
  try {
    const rows = await getConversations();
    res.json({ ok: true, data: rows });
  } catch (err) {
    next(err);
  }
};

const getConversationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const conversation = await getConversation(id);
    if (!conversation) {
      const error = new Error('Conversation not found');
      error.status = 404;
      throw error;
    }

    const messages = await getMessages(id);
    res.json({ ok: true, data: { conversation, messages } });
  } catch (err) {
    next(err);
  }
};

const replyToConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { message } = req.body;

    message = typeof message === 'string' ? message.trim() : '';
    if (!message) {
      const err = new Error('message is required and must be a non-empty string');
      err.status = 400;
      throw err;
    }

    const conversation = await getConversation(id);
    if (!conversation) {
      const err = new Error('Conversation not found');
      err.status = 404;
      throw err;
    }

    const saved = await saveMessage(id, 'operator', message);
    await updateConversationStatus(id, 'active');

    const payload = {
      id: saved.id,
      role: 'operator',
      conversationId: Number(id),
      sessionId: conversation.session_id,
      message: saved.message,
      created_at: saved.created_at,
    };

    broadcastNewMessage(id, conversation.session_id, payload);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { status } = req.body;

    status = typeof status === 'string' ? status.trim() : '';
    if (!status) {
      const err = new Error('status is required and must be one of new|active|closed');
      err.status = 400;
      throw err;
    }

    const conversation = await getConversation(id);
    if (!conversation) {
      const err = new Error('Conversation not found');
      err.status = 404;
      throw err;
    }

    const updated = await updateConversationStatus(id, status);
    res.json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listConversations,
  getConversationById,
  replyToConversation,
  updateStatus,
};
