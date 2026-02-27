const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const Groq = require("groq-sdk");
const { pipeline } = require('@xenova/transformers');
const functions = require("firebase-functions");

// 💡 Pre-calculated embeddings file
const trainedEmbeddings = require('./trained_embeddings.json');

admin.initializeApp();
const db = admin.firestore();

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

// helper to generate a response
async function generateResponse(prompt, model) {
    if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is not set');
    }
    const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
    });
    const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model,
    });
    return completion.choices[0]?.message?.content || '';
}

// Local Embedding Model Pipeline (Runs once on cold start)
let embedder;
async function getEmbedder() {
    if (!embedder) {
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return embedder;
}

// Simple Vector Similarity Function
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function setSecurityHeaders(res) {
    res.set("Cross-Origin-Opener-Policy", "same-origin");
    res.set("Cross-Origin-Embedder-Policy", "require-corp");
}

async function updateMetricsTransaction(userId, tokens, savings) {
    const userStatsRef = db.collection("users").doc(userId).collection("stats").doc("usage");
    const globalStatsRef = db.collection("stats").doc("global");

    await db.runTransaction(async (transaction) => {
        // Update User
        transaction.set(userStatsRef, {
            tokensUsed: FieldValue.increment(tokens),
            costSaved: FieldValue.increment(savings),
            queriesProcessed: FieldValue.increment(1)
        }, { merge: true });

        // Update Global
        transaction.set(globalStatsRef, {
            tokensUsed: FieldValue.increment(tokens),
            costSaved: FieldValue.increment(savings),
            queriesProcessed: FieldValue.increment(1)
        }, { merge: true });
    });
}

// --------------------------------------------------
// ENDPOINTS
// --------------------------------------------------

// Main Function: smartProxy
exports.smartProxy = onRequest({
    cors: true,
    timeoutSeconds: 60,
    memory: "512MiB",
    secrets: ["GROQ_API_KEY"]
}, async (req, res) => {
    setSecurityHeaders(res);

    const { prompt, userId } = req.body;
    if (!prompt || !userId) return res.status(400).send("Missing prompt or userId");

    try {
        // 1. Semantic Routing
        const pipe = await getEmbedder();
        const userInputEmbedding = await pipe(prompt, { pooling: 'mean', normalize: true });
        const userVec = userInputEmbedding.data;

        let bestRoute = "cheap";
        let maxSimilarity = -1;
        const threshold = 0.5;

        for (const [routeName, examples] of Object.entries(trainedEmbeddings)) {
            for (const example of examples) {
                const similarity = cosineSimilarity(userVec, example.vector);
                if (similarity > maxSimilarity) {
                    maxSimilarity = similarity;
                    bestRoute = routeName;
                }
            }
        }

        // 🛡️ ENFORCED THRESHOLD CHECK
        if (maxSimilarity < threshold) {
            bestRoute = "cheap";
            console.log(`🛡️ Threshold not met (${maxSimilarity.toFixed(2)} < ${threshold}). Falling back to cheap.`);
        } else {
            console.log(`🧠 Router Decision: ${bestRoute} (Score: ${maxSimilarity.toFixed(2)})`);
        }

        // 2. Model Selection
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        let modelToUse = (bestRoute === "smart") ? "llama-3.3-70b-versatile" : "llama-3.1-8b-instant";

        // 3. Call Groq
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: modelToUse,
        });

        const generatedText = chatCompletion.choices[0]?.message?.content;
        const usage = chatCompletion.usage;
        
        // Basic Cost Saving Calculation
        const tokens = usage.total_tokens;
        const calculatedSavings = (tokens / 1000000) * 5.00; 

        // 4. Update Metrics (User + Global)
        await updateMetricsTransaction(userId, tokens, calculatedSavings);

        return res.status(200).json({ response: generatedText, modelUsed: modelToUse });

    } catch (error) {
        console.error("❌ Error:", error);
        return res.status(500).json({ error: error.message });
    }
});

// Endpoint that writes assistant replies into Firestore
exports.analyzePrompt = onRequest({
    cors: true,
    memory: "1GiB",
    secrets: ["GROQ_API_KEY"]
}, async (req, res) => {
    setSecurityHeaders(res);

    const { userId, chatId, prompt } = req.body;
    if (!userId || !chatId || !prompt) return res.status(400).send('missing fields');

    try {
        const model = "llama-3.1-8b-instant";
        const reply = await generateResponse(prompt, model);

        await db
            .collection('users')
            .doc(userId)
            .collection('chats')
            .doc(chatId)
            .collection('messages')
            .add({
                text: reply,
                sender: 'assistant',
                model,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });

        return res.json({ success: true, model, reply });
    } catch (err) {
        console.error(err);
        return res.status(500).send(err.message);
    }
});

// --------------------------------------------------
// FIRESTORE TRIGGER (AUTOMATED SUMMARIZATION)
// --------------------------------------------------
exports.onNewMessage = onDocumentCreated('users/{userId}/chats/{chatId}/messages/{messageId}', async (event) => {
    const { userId, chatId } = event.params;
    console.log(`🆕 New message in chat ${chatId} by user ${userId}`);

    const messagesRef = db.collection("users")
        .doc(userId)
        .collection("chats")
        .doc(chatId)
        .collection("messages");

    try {
        // 1. Fetch all messages to summarize
        const snapshot = await messagesRef.orderBy("timestamp").get();
        
        const chatHistory = snapshot.docs
            .map(doc => doc.data().text) 
            .filter(text => text)
            .join("\n");

        if (!chatHistory) return;

        // 2. Call Groq for summary
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const summaryCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "Summarize this chat history concisely in 2-3 sentences." },
                { role: "user", content: chatHistory }
            ],
            model: "llama-3.1-8b-instant",
        });

        const summary = summaryCompletion.choices[0]?.message?.content || "Could not generate summary.";

        // 3. Store summary in the Chat document
        await db.collection("users").doc(userId).collection("chats").doc(chatId).update({
            summary: summary,
            lastSummarized: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ Summary auto-generated for chat ${chatId}`);
    } catch (error) {
        console.error("❌ Auto-summarize Error:", error);
    }
});