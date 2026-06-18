import express from "express";
import twilio from "twilio";

const router = express.Router();

router.post("/voice", (req, res) => {
  const response = new twilio.twiml.VoiceResponse();

  response.say(
    "Welcome to ABG Autos. Please tell me what car you are looking for."
  );

  response.record({
    maxLength: 10,
    action: "/voice/process",
    transcribe: false,
  });

  res.type("text/xml");
  res.send(response.toString());
});

export default router;

router.post("/voice/process", async (req, res) => {
  const recordingUrl = req.body.RecordingUrl;

  // send to Deepgram (next step)
  // send transcript to Gemini
  // return response

  const response = new twilio.twiml.VoiceResponse();
  response.say("Thanks. Our team will contact you shortly.");

  res.type("text/xml");
  res.send(response.toString());
});