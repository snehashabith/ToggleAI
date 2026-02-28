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

// 🚀 Main Function: smartProxy
// ... (keep your helpers: getEmbedder, cosineSimilarity, updateMetricsTransaction) ...

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
<<<<<<< HEAD
    setSecurityHeaders(res);
    const { prompt, userId } = req.body;
    if (!prompt || !userId) return res.status(400).send("Missing prompt or userId");

    try {
        // --- ROUTING LOGIC ---
        const pipe = await getEmbedder();
        const userInputEmbedding = await pipe(prompt, { pooling: 'mean', normalize: true });
        const userVec = userInputEmbedding.data;
=======
    setSecurityHeaders(res);

    const { prompt, userId } = req.body;
    if (!prompt || !userId) return res.status(400).send("Missing prompt or userId");
>>>>>>> 4537e85574c345dcb00d039b725306bd7f098692

        let bestRoute = "cheap";
        let maxSimilarity = -1;
        const threshold = 0.5; // <--- Adjust this if needed

        for (const [routeName, examples] of Object.entries(trainedEmbeddings)) {
            for (const example of examples) {
                const similarity = cosineSimilarity(userVec, example.vector);
                if (similarity > maxSimilarity) {
                    maxSimilarity = similarity;
                    bestRoute = routeName;
                }
            }
        }
        
        console.log(`🧠 Router Decision: ${bestRoute} (Score: ${maxSimilarity.toFixed(2)})`);

        // --- MODEL SELECTION ---
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        // CORRECTLY USES THE ROUTE
        let modelToUse = (bestRoute === "smart") ? "llama-3.3-70b-versatile" : "llama-3.1-8b-instant";

<<<<<<< HEAD
        // Call Groq
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: modelToUse,
        });
=======
        // 🛡️ ENFORCED THRESHOLD CHECK
        if (maxSimilarity < threshold) {
            bestRoute = "cheap";
            console.log(`🛡️ Threshold not met (${maxSimilarity.toFixed(2)} < ${threshold}). Falling back to cheap.`);
        } else {
            console.log(`🧠 Router Decision: ${bestRoute} (Score: ${maxSimilarity.toFixed(2)})`);
        }
>>>>>>> 4537e85574c345dcb00d039b725306bd7f098692

        const generatedText = chatCompletion.choices[0]?.message?.content;
        const usage = chatCompletion.usage;
        
        // Basic Cost Saving Calculation
        const tokens = usage.total_tokens;
        const calculatedSavings = (tokens / 1000000) * (bestRoute === "smart" ? 5.00 : 0.50); 

        // Update Metrics (User + Global)
        await updateMetricsTransaction(userId, tokens, calculatedSavings);

<<<<<<< HEAD
        return res.status(200).json({ response: generatedText, modelUsed: modelToUse });

    } catch (error) {
        console.error("❌ Error:", error);
        return res.status(500).json({ error: error.message });
    }
=======
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
>>>>>>> 4537e85574c345dcb00d039b725306bd7f098692
});

// Endpoint that writes assistant replies into Firestore
exports.analyzePrompt = onRequest({
    cors: true,
    memory: "1GiB",
    secrets: ["GROQ_API_KEY"]
}, async (req, res) => {
<<<<<<< HEAD
    setSecurityHeaders(res);
    const { userId, chatId, prompt } = req.body;
    if (!userId || !chatId || !prompt) return res.status(400).send('missing fields');
=======
    setSecurityHeaders(res);
>>>>>>> 4537e85574c345dcb00d039b725306bd7f098692

    try {
        // --- ADD ROUTING LOGIC HERE TOO ---
        const pipe = await getEmbedder();
        const userInputEmbedding = await pipe(prompt, { pooling: 'mean', normalize: true });
        const userVec = userInputEmbedding.data;

<<<<<<< HEAD
        let bestRoute = "cheap";
        let maxSimilarity = -1;
        const threshold = 0.5;
=======
    try {
        const model = "llama-3.1-8b-instant";
        const reply = await generateResponse(prompt, model);
>>>>>>> 4537e85574c345dcb00d039b725306bd7f098692

        for (const [routeName, examples] of Object.entries(trainedEmbeddings)) {
            for (const example of examples) {
                const similarity = cosineSimilarity(userVec, example.vector);
                if (similarity > maxSimilarity) {
                    maxSimilarity = similarity;
                    bestRoute = routeName;
                }
            }
        }

<<<<<<< HEAD
        // --- MODEL SELECTION ---
        const model = (bestRoute === "smart") ? "llama-3.3-70b-versatile" : "llama-3.1-8b-instant";
        
        // Use the dynamic model
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
exports.summarizeChat = onRequest({
    cors: true,                 
    secrets: ["GROQ_API_KEY"],  
    memory: "512MiB"            
}, async (req, res) => {
    const { userId, chatId } = req.body;
    if (!userId || !chatId) return res.status(400).send("Missing userId or chatId");
=======
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
>>>>>>> 4537e85574c345dcb00d039b725306bd7f098692

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