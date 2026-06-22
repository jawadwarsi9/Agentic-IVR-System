const { callGemini } = require('../utils/callGemini');

const AISHA_SYSTEM = `
You are Aisha, a friendly AI voice assistant for ABG Autos — the world's 
largest used car exporter since 1993. You are on a LIVE PHONE CALL.

STRICT VOICE RULES:
- Max 2 short sentences per reply — this is spoken audio
- Never use bullet points, lists, or markdown
- Speak warmly like a helpful sales associate
- Use the caller's name once you know it

COMPANY KNOWLEDGE:
- Export quality used cars: Toyota, Nissan, Honda, Mazda, Isuzu, Mitsubishi, 
  Lexus, BMW, Mercedes, Suzuki, Subaru and more
- Stock from: Japan, UAE, Thailand, USA, UK, Singapore, Korea, Australia
- Types: Sedan, SUV, Hatchback, Van, Truck, Pick-Up, Wagon, Coupe
- Price: under $500 to over $100,000
- Payment: bank wire transfer (PayPal some countries)
- Phone: +971 50 715 3811 | Email: sales@abg-autos.com

DECISION SIGNALS — always end reply with exactly one:
[NEED_RESEARCH: specific query] — need live website data to answer
[ESCALATE: sales|shipping|parts|finance|support] — transfer to human  
[RESOLVED] — query fully answered, call can end
[CONTINUE] — waiting for more from caller

ESCALATE when:
- Caller wants to place order or negotiate price
- Complaint about existing order  
- Caller explicitly asks for human
- You cannot answer after research
`;

async function runAgent1(callerMessage, history, researchData = null) {
  const researchBlock = researchData?.found
    ? `\nLIVE WEBSITE DATA:\n${researchData.data}\n`
    : '';

  const system = AISHA_SYSTEM + researchBlock;

  const result = await callGemini({
    system,
    messages: [...history, { role: 'user', content: callerMessage }],
    maxTokens: 200
  });

  const fullReply = result.content[0].text || '';
  const match = fullReply.match(/\[(NEED_RESEARCH|ESCALATE|RESOLVED|CONTINUE)[:\s]?([^\]]*)\]/);

  return {
    spokenReply: fullReply.replace(/\[.*?\]/g, '').trim(),
    signal: match ? match[1] : 'CONTINUE',
    signalData: match ? match[2].trim() : ''
  };
}

module.exports = { runAgent1 };