const { run, get, all } = require('../db');

const now = () => new Date().toISOString();

async function findConversationBySession(sessionId) {
  return get('SELECT * FROM conversations WHERE session_id = ?', [sessionId]);
}

async function createConversation({ sessionId, visitorName, visitorPhone, page, title, pageContextJson }) {
  const ts = now();
  const result = await run(
    `INSERT INTO conversations (session_id, visitor_name, visitor_phone, status, source_page, source_title, page_context_json, created_at, updated_at)
     VALUES (?, ?, ?, 'new', ?, ?, ?, ?, ?)`,
    [sessionId, visitorName || null, visitorPhone || null, page || null, title || null, pageContextJson || null, ts, ts]
  );
  return get('SELECT * FROM conversations WHERE id = ?', [result.id]);
}

async function findOrCreateConversation({ sessionId, visitorName, visitorPhone, page, title, pageContextJson }) {
  let conversation = await findConversationBySession(sessionId);
  if (!conversation) {
    conversation = await createConversation({ sessionId, visitorName, visitorPhone, page, title, pageContextJson });
  } else {
    const updates = {
      visitor_name: visitorName || conversation.visitor_name,
      visitor_phone: visitorPhone || conversation.visitor_phone,
      source_page: page || conversation.source_page,
      source_title: title || conversation.source_title,
      page_context_json: pageContextJson || conversation.page_context_json,
    };
    await run(
      `UPDATE conversations SET visitor_name = ?, visitor_phone = ?, source_page = ?, source_title = ?, page_context_json = ?, updated_at = ? WHERE id = ?`,
      [updates.visitor_name, updates.visitor_phone, updates.source_page, updates.source_title, updates.page_context_json, now(), conversation.id]
    );
    conversation = await get('SELECT * FROM conversations WHERE id = ?', [conversation.id]);
  }

  return conversation;
}

async function saveMessage(conversationId, role, message) {
  const ts = now();
  const result = await run(
    'INSERT INTO messages (conversation_id, role, message, created_at) VALUES (?, ?, ?, ?)',
    [conversationId, role, message, ts]
  );
  await run('UPDATE conversations SET updated_at = ? WHERE id = ?', [ts, conversationId]);
  return get('SELECT * FROM messages WHERE id = ?', [result.id]);
}

async function getConversations() {
  return all(`
    SELECT
      c.id,
      c.session_id,
      c.status,
      c.source_page,
      c.source_title,
      c.created_at,
      c.updated_at,
      (SELECT message FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
      (SELECT COUNT(1) FROM messages WHERE conversation_id = c.id) AS total_messages
    FROM conversations c
    ORDER BY c.updated_at DESC
  `);
}

async function getConversation(id) {
  return get('SELECT * FROM conversations WHERE id = ?', [id]);
}

async function getMessages(conversationId) {
  return all('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC', [conversationId]);
}

async function updateConversationStatus(conversationId, status) {
  const allowed = ['new', 'active', 'closed'];
  if (!allowed.includes(status)) {
    const error = new Error('Invalid status');
    error.status = 400;
    throw error;
  }
  await run('UPDATE conversations SET status = ?, updated_at = ? WHERE id = ?', [status, now(), conversationId]);
  return get('SELECT * FROM conversations WHERE id = ?', [conversationId]);
}

module.exports = {
  findOrCreateConversation,
  saveMessage,
  getConversations,
  getConversation,
  getMessages,
  updateConversationStatus,
};
