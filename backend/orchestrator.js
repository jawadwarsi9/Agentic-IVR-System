const twilio = require('twilio');
const { runAgent1 } = require('./agents/agent1');
const { runAgent2 } = require('./agents/agent2');

async function orchestrator(req, res) {
  const twiml = new twilio.twiml.VoiceResponse();
  const callerSaid = req.body.SpeechResult || '';

  // Parse conversation history passed via URL param
  let history = [];
  try {
    history = JSON.parse(decodeURIComponent(req.query.history || '[]'));
  } catch (e) { history = []; }

  if (!callerSaid) {
    // Caller went silent — prompt again
    const gather = twiml.gather({
      input: 'speech', action: '/orchestrator',
      speechTimeout: 'auto', language: 'en-US', method: 'POST'
    });
    gather.say({ voice: 'Polly.Joanna' }, 'Sorry, I didn\'t catch that. How can I help you?');
    res.type('text/xml');
    return res.send(twiml.toString());
  }

  try {
    // Step 1 — run Agent 1
    let { spokenReply, signal, signalData } = await runAgent1(callerSaid, history);

    // Step 2 — if Agent 1 needs data, run Agent 2 then re-run Agent 1
    if (signal === 'NEED_RESEARCH') {
      const research = await runAgent2(signalData);
      ({ spokenReply, signal, signalData } = await runAgent1(callerSaid, history, research));
    }

    // Step 3 — update history (cap at 10 exchanges)
    history.push({ role: 'user', content: callerSaid });
    history.push({ role: 'assistant', content: spokenReply });
    if (history.length > 20) history = history.slice(-20);
    const historyParam = encodeURIComponent(JSON.stringify(history));

    // Step 4 — act on signal
    if (signal === 'ESCALATE') {
      twiml.say({ voice: 'Polly.Joanna' }, spokenReply);
      twiml.say({ voice: 'Polly.Joanna' },
        'Let me connect you with our team. Please hold for just a moment.'
      );
      // Sandbox: just forward to your verified number
      // Production: replace with twiml.enqueue() + TaskRouter
      twiml.dial(process.env.TWILIO_VERIFIED_NUMBER || process.env.TWILIO_PHONE_NUMBER);
      res.type('text/xml');
      return res.send(twiml.toString());
    }

    if (signal === 'RESOLVED') {
      twiml.say({ voice: 'Polly.Joanna' }, spokenReply);
      twiml.say({ voice: 'Polly.Joanna' }, 'Thank you for calling ABG Autos. Have a great day!');
      twiml.hangup();
      res.type('text/xml');
      return res.send(twiml.toString());
    }

    // CONTINUE — keep conversation going
    const gather = twiml.gather({
      input: 'speech',
      action: `/orchestrator?history=${historyParam}`,
      speechTimeout: 'auto',
      language: 'en-US',
      method: 'POST'
    });
    gather.say({ voice: 'Polly.Joanna' }, spokenReply);
    twiml.redirect({ method: 'POST' }, `/orchestrator?history=${historyParam}`);

  } catch (err) {
    console.error('Orchestrator error:', err.message);
    twiml.say({ voice: 'Polly.Joanna' },
      'I\'m having a brief issue. Let me connect you to our team.'
    );
    twiml.dial(process.env.TWILIO_PHONE_NUMBER);
  }

  res.type('text/xml');
  res.send(twiml.toString());
}

module.exports = orchestrator;