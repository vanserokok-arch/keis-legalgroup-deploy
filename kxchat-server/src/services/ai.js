'use strict';

const { getEngineResponse, isOpenAIConfigured } = require('./chat-engine');

const getAIResponse = async (
  conversationHistory,
  visitorMessage,
  visitorData = {},
  pageContext = null,
  meta = {}
) => {
  return getEngineResponse({
    conversationHistory,
    visitorMessage,
    visitorData,
    pageContext,
    sessionId: meta.sessionId || null,
    conversationId: meta.conversationId || null,
    page: meta.page || null,
    title: meta.title || null
  });
};

module.exports = {
  getAIResponse,
  isOpenAIConfigured
};
