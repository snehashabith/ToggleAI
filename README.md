TEAM - BOURNVITA
MEMBERS:
JOVITA ROSE AMBADAN
SNEHA SHABITH



Project Name:
ToggleAI Serverless Intelligent Routing: Intelligently routes user prompts to the most cost-effective and capable AI model using semantic search within Firebase Functions, exclusively using Groq's high-performance inference engine.

Project Description: 
In modern AI development, developers face a rigid trade-off: Capability vs. Cost/Speed. High-End Models offer excellent reasoning but higher latency, while Small Models are fast and cheap but struggle with complex tasks. Developers often default to expensive models for all queries, leading to unnecessary API spending.
ToggleAI AI acts as an intelligent intermediary using Groq's blazing-fast infrastructure. It analyzes incoming prompts semantically before sending them to an LLM.

Tech StackRuntime: Node.js (Firebase Functions v2)
Database: Cloud Firestore
Routing Intelligence: transformers.js (all-MiniLM-L6-v2 running locally on the function)
LLM Provider: Groq SDK

Features
Semantic Routing: Uses local embeddings to determine query complexity before invoking an LLM, ensuring complex tasks get powerful models and simple tasks remain fast and cheap.Groq Multi-Model 
Routing: Seamlessly toggles between Groq's llama-3.3-70b-versatile (for reasoning) and llama-3.1-8b-instant (for speed).
Automated Chat Summarization: Utilizes Firestore triggers (onDocumentCreated) to automatically summarize chat histories for context.
Real-time Cost & Token Tracking: Tracks usage and estimated savings in Firestore transactions for a real-time dashboard.

How It Works (Technical Details)
Prompt Submission: The client sends a JSON body to the /smartProxy endpoint.
Semantic Analysis: transformers.js generates a vector representation of the user prompt locally within the function.
Vector Similarity: The local embedder compares the prompt vector against pre-trained trained_embeddings.json to decide the best route.
API Routing: The function uses the dynamic model selection logic to call the appropriate Groq model (versatile or instant).
Metrics Calculation: Token usage, cost savings, and response time are updated in Firestore transactions.

Demo Video and Screenshots : https://drive.google.com/drive/folders/155JQZUsCWEAUtOyurBcJprSdlG2P64jJ?usp=sharing

4-Model Routing Strategy (All Groq)
Route          Model                         UseCase                                         Strength
Smart          llama-3.3-70b-versatile       Complex reasoning, coding, data analysis        Maximum intelligence
Smart          llama-3.3-70b-versatile       Complex tasks requiring speed, general purpose  Speed + Capability
Cheap          llama-3.1-8b-instant          Instant chat, basic classification, FAQs        Ultra-Fast Latency
Cheap          llama-3.1-8b-instant          High-volume tasks, simple chat, fast summaries  Speed & Low Cost🚀 

Installation & Run Commands
PrerequisitesFirebase CLI installed (npm install -g firebase-tools)
API Key for GroqInstallationBash# Clone the repository

git clone https://github.com/your-repo/smart-proxy-ai.git

# Install dependencies
cd functions
npm install

# Setup API Key in Firebase Secrets
firebase functions:secrets:set GROQ_API_KEY

Running the EmulatorBashfirebase emulators:start

API Documentation
POST /smartProxy
Routes a prompt and returns the AI response and metrics.
Body:JSON{
  "prompt": "Write a Python script to analyze CSV data",
  "userId": "user_123"
}
Returns:JSON{
  "response": "...",
  "modelUsed": "groq/llama-3.3-70b-versatile",
  "metrics": {
    "tokensUsed": 150,
    "costSaved": 0.05,
    "queriesProcessed": 1
  }
}












































# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
