require('dotenv').config();

const env = process.env;

const PORT = Number(env.PORT || 8787);
const CORS_ORIGIN_STRING = env.CORS_ORIGIN || 'http://localhost:5507,http://127.0.0.1:5507,http://localhost:3000';
const CORS_ORIGIN = CORS_ORIGIN_STRING.split(',').map(origin => origin.trim());
const DB_PATH = env.DB_PATH || './kxchat.db';

const OPENAI_API_KEY = env.OPENAI_API_KEY || '';
const OPENAI_MODEL = env.OPENAI_MODEL || '';

if (!DB_PATH) {
  throw new Error('DB_PATH is required');
}

module.exports = {
  PORT,
  CORS_ORIGIN,
  DB_PATH,
  OPENAI_API_KEY,
  OPENAI_MODEL
};
