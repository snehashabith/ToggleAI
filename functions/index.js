const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore"); // Add this line
const Groq = require("groq-sdk");
const { pipeline } = require('@xenova/transformers');
// 💡 Pre-calculated embeddings file
const trainedEmbeddings = require('./trained_embeddings.json');

admin.initializeApp();
const db = admin.firestore();




// helper to generate a response; allows reuse from different endpoints
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

// 🚀 Local Embedding Model Pipeline (Runs once on cold start)
let embedder;
async function getEmbedder() {
    if (!embedder) {
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return embedder;
}

// 💡 Simple Vector Similarity Function
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
    setSecurityHeaders(res);
    const { prompt, userId } = req.body;
    if (!prompt || !userId) return res.status(400).send("Missing prompt or userId");

    try {
        // --- ROUTING LOGIC ---
        const pipe = await getEmbedder();
        const userInputEmbedding = await pipe(prompt, { pooling: 'mean', normalize: true });
        const userVec = userInputEmbedding.data;

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

        // Call Groq
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: modelToUse,
        });

        const generatedText = chatCompletion.choices[0]?.message?.content;
        const usage = chatCompletion.usage;
        
        // Basic Cost Saving Calculation
        const tokens = usage.total_tokens;
        const calculatedSavings = (tokens / 1000000) * (bestRoute === "smart" ? 5.00 : 0.50); 

        // Update Metrics (User + Global)
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
        // --- ADD ROUTING LOGIC HERE TOO ---
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

    // Use 'db' which you initialized at the top of your file
    const messagesRef = db.collection("users")
                          .doc(userId)
                          .collection("chats")
                          .doc(chatId)
                          .collection("messages");

    try {
        // 1. Fetch all messages
        const snapshot = await messagesRef.orderBy("timestamp").get();
        
        // ⚠️ FIX: Changed .content to .text to match your analyzePrompt format
        const chatHistory = snapshot.docs
            .map(doc => doc.data().text || doc.data().content) 
            .filter(text => text) // Remove empty messages
            .join("\n");

        if (!chatHistory) {
            return res.status(200).json({ summary: "No messages to summarize yet." });
        }

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

        console.log(`✅ Summary generated for chat ${chatId}`);

        return res.status(200).json({ summary });
    } catch (error) {
        console.error("❌ Summarize Error:", error);
        return res.status(500).json({ error: error.message });
    }
});


async function updateMetricsTransaction(userId, tokens, savings) {
    const userStatsRef = db.collection("users").doc(userId).collection("stats").doc("usage");
    const globalStatsRef = db.collection("stats").doc("global");

    // ... inside updateMetricsTransaction ...

await db.runTransaction(async (transaction) => {
    // Update User
    transaction.set(userStatsRef, {
        tokensUsed: FieldValue.increment(tokens), // Change here
        costSaved: FieldValue.increment(savings),  // Change here
        queriesProcessed: FieldValue.increment(1)  // Change here
    }, { merge: true });

    // Update Global
    transaction.set(globalStatsRef, {
        tokensUsed: FieldValue.increment(tokens), // Change here
        costSaved: FieldValue.increment(savings),  // Change here
        queriesProcessed: FieldValue.increment(1)  // Change here
    }, { merge: true });
});
}
function setSecurityHeaders(res) {
    res.set("Cross-Origin-Opener-Policy", "same-origin");
    res.set("Cross-Origin-Embedder-Policy", "require-corp");
}