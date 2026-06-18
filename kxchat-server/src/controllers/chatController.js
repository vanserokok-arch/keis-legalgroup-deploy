const { findOrCreateConversation, saveMessage, getMessages } = require('../services/chatService');
const { broadcastNewMessage } = require('../socket');
const { getAIResponse } = require('../services/ai');
const { isLikelyValidName } = require('../utils/extractLeadFields');

const normalizeTextField = (value, maxLen = 240) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen);
};

const normalizeStringArray = (value, maxItems = 8, maxLen = 64) => {
  if (!Array.isArray(value)) return null;
  const out = value
    .map(item => normalizeTextField(item, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);
  return out.length ? out : null;
};

const normalizePageContext = (rawContext, fallbackPage, fallbackTitle) => {
  const source = rawContext && typeof rawContext === 'object' ? rawContext : {};
  const normalized = {
    site_key: normalizeTextField(source.site_key || source.site, 120),
    page_type: normalizeTextField(source.page_type, 48),
    page_slug: normalizeTextField(source.page_slug, 96),
    topic: normalizeTextField(source.topic, 160),
    subtopic: normalizeTextField(source.subtopic, 240),
    topic_key: normalizeTextField(source.topic_key, 180),
    domain_area: normalizeTextField(source.domain_area || source.domain, 80),
    practice_area: normalizeTextField(source.practice_area || source.practice, 80),
    issue_type: normalizeTextField(source.issue_type || source.issue, 80),
    source_url: normalizeTextField(source.source_url || fallbackPage, 2048),
    page_title: normalizeTextField(source.page_title || fallbackTitle, 300),
    page_summary: normalizeTextField(source.page_summary || source.summary, 600),
    page_group: normalizeTextField(source.page_group, 96),
    h1: normalizeTextField(source.h1, 240),
    hero_text: normalizeTextField(source.hero_text || source.hero, 400),
    meta_description: normalizeTextField(source.meta_description || source.metaDescription, 400),
    bullets: normalizeStringArray(source.bullets || source.supporting_points, 10, 180),
    intent_priority: normalizeStringArray(source.intent_priority, 8, 64),
    intent_exclusions: normalizeStringArray(source.intent_exclusions, 10, 64)
  };

  const hasData = Object.entries(normalized).some(([key, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    if (key === 'intent_priority' || key === 'intent_exclusions') return false;
    return !!value;
  });
  return hasData ? normalized : null;
};

const parseStoredPageContext = (value) => {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (_) {
    return null;
  }
};

const sendMessage = async (req, res, next) => {
  try {
    let { sessionId, message, page, title, visitorName, visitorPhone, pageContext } = req.body;

    sessionId = typeof sessionId === 'string' ? sessionId.trim() : '';
    if (!sessionId) {
      const err = new Error('sessionId is required and must be a non-empty string');
      err.status = 400;
      throw err;
    }

    message = typeof message === 'string' ? message.trim() : '';
    if (!message) {
      const err = new Error('message is required and must be a non-empty string');
      err.status = 400;
      throw err;
    }

    const normalize = (v) => {
      if (typeof v !== 'string') return null;
      const trimmed = v.trim();
      return trimmed || null;
    };

    visitorName = normalize(visitorName);
    if (visitorName && !isLikelyValidName(visitorName)) {
      visitorName = null;
    }
    visitorPhone = normalize(visitorPhone);
    page = normalize(page);
    title = normalize(title);
    const normalizedPageContext = normalizePageContext(pageContext, page, title);
    let pageContextJson = null;
    if (normalizedPageContext) {
      pageContextJson = JSON.stringify(normalizedPageContext);
    }

    const conversation = await findOrCreateConversation({
      sessionId,
      visitorName,
      visitorPhone,
      page,
      title,
      pageContextJson,
    });

    const visitorMsg = await saveMessage(conversation.id, 'visitor', message);

    // Get conversation history for AI context
    const history = await getMessages(conversation.id);
    const storedPageContext = parseStoredPageContext(conversation.page_context_json);
    const effectivePageContext = normalizedPageContext || storedPageContext || normalizePageContext({}, conversation.source_page, conversation.source_title);

    // Get AI response
    const aiResponse = await getAIResponse(
      history,
      message,
      {
        name: isLikelyValidName(conversation.visitor_name || '') ? conversation.visitor_name : null,
        phone: conversation.visitor_phone || null
      },
      effectivePageContext,
      {
        sessionId,
        conversationId: conversation.id,
        page: conversation.source_page || page,
        title: conversation.source_title || title
      }
    );

    // Save AI reply
    const aiMsg = await saveMessage(conversation.id, aiResponse.role, aiResponse.message);

    const payloadVisitor = {
      id: visitorMsg.id,
      role: 'visitor',
      conversationId: conversation.id,
      sessionId: conversation.session_id,
      message: visitorMsg.message,
      created_at: visitorMsg.created_at,
    };

    const payloadAI = {
      id: aiMsg.id,
      role: aiResponse.role,
      conversationId: conversation.id,
      sessionId: conversation.session_id,
      message: aiMsg.message,
      created_at: aiMsg.created_at,
    };

    broadcastNewMessage(conversation.id, conversation.session_id, payloadVisitor);
    broadcastNewMessage(conversation.id, conversation.session_id, payloadAI);

    return res.json({
      ok: true,
      conversationId: conversation.id,
      reply: aiResponse.message,
      replyMeta: aiResponse.meta || null,
      replyMessageId: aiMsg.id,
      replyCreatedAt: aiMsg.created_at,
      visitorMessageId: visitorMsg.id,
      visitorCreatedAt: visitorMsg.created_at
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
};
