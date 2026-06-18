import dotenv from "dotenv";
dotenv.config();

export const config = {
  geminiKey: process.env.GEMINI_API_KEY,
  deepgramKey: process.env.DEEPGRAM_API_KEY,
  twilioSid: process.env.TWILIO_ACCOUNT_SID,
  twilioToken: process.env.TWILIO_AUTH_TOKEN,
  twilioNumber: process.env.TWILIO_PHONE_NUMBER,
};