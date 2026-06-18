const axios = require("axios");

async function getAIResponse(userMessage) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are an AI sales assistant for ABG Autos.
You handle car import/export inquiries.
Be concise, ask qualifying questions, collect lead info.
            `
          },
          {
            role: "user",
            content: userMessage
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (err) {
    console.error(err);
    return "Sorry, I couldn't process that request.";
  }
}

module.exports = { getAIResponse };