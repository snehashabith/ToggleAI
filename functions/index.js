const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// --- UPDATED FOR SECRETS ---
const { defineSecret } = require('firebase-functions/params');
const geminiApiKey = defineSecret('GEMINI_API_KEY');
// ---------------------------

// Pass the secret to the function configuration
exports.smartProxy = onRequest({ secrets: [geminiApiKey] }, async (req, res) => {
  
  // Access the secret using .value()
  const apiKey = geminiApiKey.value();
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const userInput = req.body.prompt;
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    const result = await model.generateContent(userInput);
    const response = await result.response;
    res.send(response.text());
  } catch (error) {
    logger.error("Error:", error);
    res.status(500).send("Error");
  }
});