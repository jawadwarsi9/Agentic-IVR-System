const { callGemini } = require('../utils/callGemini');
const { fetchPage } = require('../utils/fetchPage');

async function runAgent2(query) {
  const pages = ['https://abg-autos.com', 'https://abg-autos.com/faq'];
  const q = query.toLowerCase();

  if (q.includes('track') || q.includes('order') || q.includes('ship'))
    pages.push('https://abg-autos.com/order-tracking');
  if (q.includes('buy') || q.includes('how') || q.includes('process'))
    pages.push('https://abg-autos.com/how-to-buy');

  const makes = ['toyota','nissan','honda','mazda','isuzu','mitsubishi',
                 'lexus','bmw','mercedes','suzuki','subaru'];
  const make = makes.find(m => q.includes(m));
  if (make) pages.push(`https://abg-autos.com/search/?make=${make}`);

  const contents = await Promise.all(pages.map(fetchPage));
  const combined = pages.map((u, i) => `[${u}]\n${contents[i]}`).join('\n\n---\n\n');

  const result = await callGemini({
    system: `You are a data extraction agent. Extract facts answering the query.
Return ONLY valid JSON, no markdown, no explanation:
{"found": true/false, "data": "extracted facts under 150 words", "source": "url"}`,
    messages: [{
      role: 'user',
      content: `QUERY: ${query}\n\nCONTENT:\n${combined}`
    }],
    maxTokens: 400
  });

  try {
    const raw = result.content[0].text.replace(/```json|```/g, '').trim();
    return JSON.parse(raw);
  } catch (e) {
    return { found: false, data: 'Research error.', source: '' };
  }
}

module.exports = { runAgent2 };