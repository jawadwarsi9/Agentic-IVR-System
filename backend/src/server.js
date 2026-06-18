require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");

const voiceRoute = require("./routes/voice");
const whatsappRoute = require("./routes/whatsapp");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routes
app.use("/voice", voiceRoute);
app.use("/whatsapp", whatsappRoute);

app.get("/", (req, res) => {
  res.send("ABG AI Backend is running 🚀");
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});