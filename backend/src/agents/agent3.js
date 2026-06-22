const { callGemini } = require('../utils/callGemini');
const { createOrUpdateLead } = require('../services/hubspot');
const redis = require('../services/redis');

async function runAgent3({
  callSid,
  phoneNumber,
  history
}) {
  try {

    const transcript = history
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const result = await callGemini({
      system: `
You are a lead extraction agent.

Extract customer information from conversation.

Return ONLY valid JSON.

{
  "qualified": true,
  "name": "",
  "country": "",
  "vehicle": "",
  "budget": "",
  "intent": ""
}
`,
      messages: [
        {
          role: 'user',
          content: transcript
        }
      ],
      maxTokens: 250
    });

    const raw =
      result.content?.[0]?.text
        ?.replace(/```json/g, '')
        ?.replace(/```/g, '')
        ?.trim();

    const lead = JSON.parse(raw);

    if (!lead.qualified) {
      return {
        saved: false,
        reason: 'Not qualified'
      };
    }

    let hubspotContactId =
      await redis.get(`hubspot:${callSid}`);

    const response =
      await createOrUpdateLead({
        contactId: hubspotContactId,
        phone: phoneNumber,
        ...lead
      });

    if (
      response &&
      response.id &&
      !hubspotContactId
    ) {
      await redis.set(
        `hubspot:${callSid}`,
        response.id,
        {
          EX: 3600
        }
      );
    }

    return {
      saved: true,
      leadId: response?.id || null,
      lead
    };

  } catch (err) {
    console.error(
      'Agent3 Error:',
      err.message
    );

    return {
      saved: false,
      error: err.message
    };
  }
}

module.exports = {
  runAgent3
};