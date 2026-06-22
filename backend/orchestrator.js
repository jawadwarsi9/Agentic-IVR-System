const twilio = require('twilio');
const redis = require('./src/services/redis');

const { runAgent1 } = require('./src/agents/agent1');
const { runAgent2 } = require('./src/agents/agent2');
const { runAgent3 } = require('./src/agents/agent3');

async function orchestrator(req, res) {
  const twiml = new twilio.twiml.VoiceResponse();

  const callerSaid = req.body.SpeechResult || '';
  const callSid = req.body.CallSid || 'unknown';

  let history = [];

  try {
    const cachedHistory = await redis.get(`call:${callSid}`);

    if (cachedHistory) {
      history = JSON.parse(cachedHistory);
    }
  } catch (err) {
    console.error('Redis read error:', err.message);
  }

  // Caller said nothing
  if (!callerSaid) {
    const gather = twiml.gather({
      input: 'speech',
      action: '/orchestrator',
      speechTimeout: 'auto',
      language: 'en-US',
      method: 'POST'
    });

    gather.say(
      { voice: 'Polly.Joanna' },
      "Sorry, I didn't catch that. How can I help you?"
    );

    res.type('text/xml');
    return res.send(twiml.toString());
  }

  try {
    // Step 1: Run Agent 1
    let { spokenReply, signal, signalData } =
      await runAgent1(callerSaid, history);

    // Step 2: Research if needed
    if (signal === 'NEED_RESEARCH') {
      const research = await runAgent2(signalData);

      ({ spokenReply, signal, signalData } =
        await runAgent1(
          callerSaid,
          history,
          research
        ));
    }

    // Step 3: Update conversation history
    history.push({
      role: 'user',
      content: callerSaid
    });

    history.push({
      role: 'assistant',
      content: spokenReply
    });

    // Keep only last 10 exchanges (20 messages)
    if (history.length > 20) {
      history = history.slice(-20);
    }

    try {
      await redis.set(
        `call:${callSid}`,
        JSON.stringify(history),
        {
          EX: 3600 // 1 hour TTL
        }
      );
    } catch (err) {
      console.error('Redis save error:', err.message);
    }

    // Step 4: Escalate to human
    if (signal === 'ESCALATE') {
      try {
        await redis.del(`call:${callSid}`);
      } catch (err) {
        console.error('Redis cleanup error:', err.message);
      }

      twiml.say(
        { voice: 'Polly.Joanna' },
        spokenReply
      );

      twiml.say(
        { voice: 'Polly.Joanna' },
        'Let me connect you with our team. Please hold for just a moment.'
      );

      twiml.dial(
        process.env.TWILIO_VERIFIED_NUMBER ||
        process.env.TWILIO_PHONE_NUMBER
      );

      res.type('text/xml');
      return res.send(twiml.toString());
    }

    // Step 5: Conversation resolved
    if (signal === 'RESOLVED') {
      try {
        await redis.del(`call:${callSid}`);
      } catch (err) {
        console.error('Redis cleanup error:', err.message);
      }

      twiml.say(
        { voice: 'Polly.Joanna' },
        spokenReply
      );

      twiml.say(
        { voice: 'Polly.Joanna' },
        'Thank you for calling ABG Autos. Have a great day!'
      );

      twiml.hangup();

      res.type('text/xml');
      return res.send(twiml.toString());
    }

    // Step 6: Continue conversation
    const gather = twiml.gather({
      input: 'speech',
      action: '/orchestrator',
      speechTimeout: 'auto',
      language: 'en-US',
      method: 'POST'
    });

    gather.say(
      { voice: 'Polly.Joanna' },
      spokenReply
    );

  } catch (err) {
    console.error('Orchestrator error:', err);

    twiml.say(
      { voice: 'Polly.Joanna' },
      "I'm having a brief issue. Let me connect you to our team."
    );

    try {
      await redis.del(`call:${callSid}`);
    } catch (cleanupErr) {
      console.error('Redis cleanup error:', cleanupErr.message);
    }

    twiml.dial(
      process.env.TWILIO_VERIFIED_NUMBER ||
      process.env.TWILIO_PHONE_NUMBER
    );
  }

  res.type('text/xml');
  return res.send(twiml.toString());
}

module.exports = orchestrator;


//Redis-based conversation history
// No URL history passing
// No historyParam bug
//Redis cleanup on RESOLVED
//Redis cleanup on ESCALATE
//Redis imported once
//Safe CallSid handling
//Proper Twilio conversation loop
//No duplicate redirects
//Error handling improved

//Caching: Temporarily stores frequently accessed data (like website pages, user profiles, or database query results) in memory. This skips slow, repeated disk lookups, dramatically speeding up app performance.