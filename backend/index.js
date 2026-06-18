require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Health check
app.get('/', (req, res) => res.send('ABG Autos IVR — online ✓'));

// Twilio calls this when someone dials your number
app.post('/incoming-call', (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  const gather = twiml.gather({
    input: 'speech',
    action: '/orchestrator',
    speechTimeout: 'auto',
    language: 'en-US',
    method: 'POST'
  });
  gather.say({ voice: 'Polly.Joanna' },
    'Welcome to ABG Autos, the world\'s largest used car exporter. ' +
    'I\'m Aisha, your assistant. How can I help you today?'
  );
  twiml.redirect({ method: 'POST' }, '/orchestrator');
  res.type('text/xml');
  res.send(twiml.toString());
});

// Orchestrator handles all subsequent turns
app.post('/orchestrator', require('./orchestrator'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✓ ABG Autos IVR running on http://localhost:${PORT}`);
  console.log(`✓ Point Twilio webhook to: https://YOUR-NGROK.ngrok.io/incoming-call\n`);
});