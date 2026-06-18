const axios = require('axios');

async function callGemini({ system, messages, maxTokens = 300 }) {
  // Convert our conversation format to Gemini's format
  const geminiMessages = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      system_instruction: { parts: [{ text: system }] },
      contents: geminiMessages,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7
      }
    },
    { headers: { 'Content-Type': 'application/json' } }
  );

  const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { content: [{ text }] }; // match shape our agents expect
}

module.exports = { callGemini };