const fs = require('fs');
const { pipeline } = require('@xenova/transformers');

// 💡 Define your training examples
const trainingData = {
    "smart": [
        "Explain the architectural differences between SQL and NoSQL databases.",
        "Write a React hook for handling complex form state with validation.",
        "What are the implications of quantum computing on modern RSA encryption?",
        "Design a system for real-time collaborative document editing using CRDTs.",
        "Refactor this Python script to use asynchronous programming and improve performance.",
        "Explain the concept of monads in functional programming with examples.",
        "How do I implement a custom authentication provider in NextAuth.js?",
        "Solve this calculus problem: Find the derivative of f(x) = x^2 * sin(x)."
    ],
    "cheap": [
        "Hi, how are you?",
        "Tell me a joke.",
        "What time is it?",
        "Translate 'hello' to Spanish.",
        "Summarize this short paragraph.",
        "Give me a recipe for chocolate chip cookies.",
        "Who is the president of France?",
        "Write a quick email subject line for a meeting."
    ]
};

async function generate() {
    console.log("🚀 Loading embedding model...");
    const pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    const result = {};

    for (const [routeName, texts] of Object.entries(trainingData)) {
        console.log(`🧠 Processing route: ${routeName}...`);
        result[routeName] = [];

        for (const text of texts) {
            const output = await pipe(text, { pooling: 'mean', normalize: true });
            result[routeName].push({
                text: text,
                vector: Array.from(output.data) // Convert Tensor to standard JS array
            });
        }
    }

    fs.writeFileSync('trained_embeddings.json', JSON.stringify(result, null, 2));
    console.log("✅ trained_embeddings.json has been updated!");
}

generate();