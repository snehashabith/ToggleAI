const { pipeline } = require('@xenova/transformers');
const fs = require('fs');
const path = require('path');

const routes = {
    "smart": [
        "Explain quantum entanglement step by step",
        "Write a complex Python script for data analysis",
        "Analyze the economic impact of the 2008 financial crisis",
        "How do I optimize this SQL query for high load?",
        "Compare the philosophical viewpoints of Plato and Aristotle",
        "Draft a detailed project plan for a new software release",
        "What are the implications of the new AI regulations?",
        "Solve this complex differential equation",
        "Evaluate the security risks of this network architecture",
        "How can I restructure this company to be more efficient?"
    ],
    "cheap": [
        "What is the capital of France?",
        "Tell me a joke",
        "What time is it?",
        "Summarize this text",
        "Is it raining in London?",
        "How do I make coffee?",
        "Translate 'hello' to Spanish",
        "What is the definition of AI?",
        "Give me a quick recipe for pancakes",
        "What is 2 + 2?"
    ]
};

async function generate() {
    console.log("Loading embedding model...");
    // Use the same model as the cloud function
    const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    let trainedData = {};

    for (const [routeName, utterances] of Object.entries(routes)) {
        trainedData[routeName] = [];
        console.log(`Embedding examples for: ${routeName}`);
        for (const utterance of utterances) {
            const embedding = await embedder(utterance, { pooling: 'mean', normalize: true });
            trainedData[routeName].push({
                text: utterance,
                vector: Array.from(embedding.data) // Convert to standard array
            });
        }
    }

    const outputPath = path.join(__dirname, 'trained_embeddings.json');
    fs.writeFileSync(outputPath, JSON.stringify(trainedData));
    console.log(`✅ Embeddings saved to ${outputPath}`);
}

generate();