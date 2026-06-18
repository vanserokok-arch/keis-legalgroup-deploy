const VOWELS = 'аеёиоуыэюяaeiouy';

const hasMostlyLetters = value => {
  if (!value) return false;
  const letters = (value.match(/[\p{L}]/gu) || []).length;
  return letters >= Math.max(2, Math.floor(value.length * 0.7));
};

const hasTooManyConsonantsInRow = value => {
  let streak = 0;
  for (const ch of (value || '').toLowerCase()) {
    if (!/[\p{L}]/u.test(ch)) {
      streak = 0;
      continue;
    }
    if (VOWELS.includes(ch)) {
      streak = 0;
      continue;
    }
    streak += 1;
    if (streak >= 5) return true;
  }
  return false;
};

const isLikelyValidName = raw => {
  if (typeof raw !== 'string') return false;
  const value = raw.trim();
  if (!value) return false;
  if (value.length < 2 || value.length > 40) return false;
  if (!/^[\p{L}\s-]+$/u.test(value)) return false;
  if (!hasMostlyLetters(value)) return false;
  const normalized = value.toLowerCase();
  const allowList = ['евгений', 'evgeniy', 'yevgeniy', 'evgeny', 'yevgeny'];
  if (!allowList.includes(normalized)) {
    if (hasTooManyConsonantsInRow(value)) return false;
  }

  const parts = value.split(/[\s-]+/).filter(Boolean);
  if (!parts.length || parts.length > 3) return false;
  if (parts.some(part => part.length < 2 || part.length > 20)) return false;
  if (parts.every(part => part.length <= 2)) return false;

  return true;
};

// Simple heuristic extraction of visitor name and phone from conversation
const extractLeadFields = (message, existingData = {}) => {
  const fields = { ...existingData };

  if (!isLikelyValidName(fields.name || '')) {
    fields.name = null;
  }

  // Extract phone number (Russian format variations)
  const phonePatterns = [
    /\+7[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/,
    /8[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/,
    /\+7\d{10}/,
    /8\d{10}/,
    /\(\d{3}\)[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/,
    /\d{3}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/
  ];

  for (const pattern of phonePatterns) {
    const match = message.match(pattern);
    if (match) {
      fields.phone = match[0].replace(/[\s-()]/g, '');
      break;
    }
  }

  // Extract name (simple heuristic: capitalized words at start, not too long)
  // This is very basic and should be improved based on actual patterns
  const nameMatch = message.match(/^([\p{L}]{2,20}(?:[\s-][\p{L}]{2,20})?)/u);
  if (nameMatch && !fields.name) {
    const potentialName = nameMatch[1].trim();
    if (isLikelyValidName(potentialName)) {
      fields.name = potentialName;
    }
  }

  return fields;
};

module.exports = {
  extractLeadFields,
  isLikelyValidName
};
