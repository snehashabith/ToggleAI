const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const Groq = require("groq-sdk");

// Initialize Firebase Admin (safe to do at top level)
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();

// 🚀 Main Function
exports.smartProxy = onRequest({
    timeoutSeconds: 60,
    memory: "256MiB",
    secrets: ["GROQ_API_KEY"] // Make sure you set this via firebase functions:secrets:set
}, async (req, res) => {
    // 💡 MOVE INITIALIZATION HERE
    // Now it only runs when the secret is available
    const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
    });

    const prompt = req.body.prompt;
    if (!prompt) return res.status(400).send("No prompt");

    // 1. Check Cache
    const safeDocId = Buffer.from(prompt).toString('base64').substring(0, 50);
    const cacheRef = db.collection("promptCache").doc(safeDocId);

    try {
        const doc = await cacheRef.get();
        if (doc.exists) {
            return res.status(200).json({ response: doc.data().response, cached: true });
        }

        // 2. Call Groq
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
        });

        const generatedText = chatCompletion.choices[0]?.message?.content || "";

        // 3. Save Cache
        await cacheRef.set({
            prompt: prompt,
            response: generatedText,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        return res.status(200).json({ response: generatedText, cached: false });

    } catch (error) {
        console.error("❌ Groq Error:", error);
        return res.status(500).json({ error: error.message });
    }
});