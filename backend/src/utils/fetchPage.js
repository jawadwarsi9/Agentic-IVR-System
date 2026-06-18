const axios = require('axios');

async function fetchPage(url) {
  try {
    const { data } = await axios.get(url, { timeout: 5000 });
    return data
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2500);
  } catch (e) {
    return 'Page unavailable';
  }
}

module.exports = { fetchPage };