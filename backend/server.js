const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 5000;
const GEMINI_MODELS = [
  'models/gemini-2.0-flash',
  'models/gemini-2.0-flash-001',
  'models/gemini-flash-latest',
  'models/gemini-2.5-flash'
];

if (!process.env.GEMINI_API_KEY) {
  console.error('Missing GEMINI_API_KEY in backend/.env');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Gemini backend is running successfully');
});

app.get('/health', (req, res) => {
  res.json({ ok: true, provider: 'gemini' });
});

app.post('/chat', async (req, res) => {
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  const context = req.body?.context || {};
  console.log('Incoming /chat message:', message);

  if (!message) {
    return res.status(400).json({ reply: 'Please ask a question first.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ reply: 'Missing GEMINI_API_KEY in backend/.env' });
  }

  try {
    const prompt =
      'You are an intelligent Signals and Systems tutor. Explain concepts clearly, step-by-step, and include formulas where needed. Keep answers concise (about 80-140 words unless asked for detail), avoid repetition, and use simple language. When you include formulas, wrap them in $$ delimiters so the UI can render them with KaTeX. Focus on topics like signals, signal operations, even/odd decomposition, and convolution. Use this UI context if available: ' +
      JSON.stringify(context) +
      '. Question: ' +
      message;

    let lastError = null;

    for (const modelName of GEMINI_MODELS) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        console.log('Gemini model used:', modelName);
        return res.json({ reply: text });
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('No Gemini model available');
  } catch (error) {
    console.error('Gemini Error:', error?.message || error);
    return res.status(500).json({
      reply: 'AI tutor is temporarily unavailable. Please try again later.'
    });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log('Server running on http://192.168.0.124:5000');
  console.log(`Gemini backend running at http://192.168.0.124:${port}`);
});
