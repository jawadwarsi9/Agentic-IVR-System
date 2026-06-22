const { createClient } = require('redis');

const client = createClient({
  url: process.env.REDIS_URL
});

client.on('error', err => {
  console.error(
    'Redis Error:',
    err.message
  );
});

(async () => {
  await client.connect();
})();

module.exports = client;