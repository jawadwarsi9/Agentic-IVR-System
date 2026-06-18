const express = require("express");
const router = express.Router();
const MessagingResponse = require("twilio").twiml.MessagingResponse;

const { getAIResponse } = require("../services/llm");

router.post("/", async (req, res) => {
  const userMessage = req.body.Body;

  const aiReply = await getAIResponse(userMessage);

  const twiml = new MessagingResponse();
  twiml.message(aiReply);

  res.type("text/xml").send(twiml.toString());
});

module.exports = router;