import axios from "axios";

// Your brand new highly-available API endpoint!
const ALGOCORE_RUNNER_URL = "https://algocore-runner.kindcliff-a86dac7a.southindia.azurecontainerapps.io/run";

export const executeCode = async (language, sourceCode, input) => {
  try {
    // Validate inputs before sending
    if (!sourceCode || sourceCode.trim() === '') {
      throw new Error('Source code cannot be empty');
    }

    // Unescape literal \n sequences to real newlines
    const normalizedInput = String(input || "").replace(/\\n/g, "\n");

    const requestData = {
      sourceCode: sourceCode,
      language: language,
      input: normalizedInput
    };

    console.log("AlgoCore Runner Request:", { language });

    const response = await axios.post(ALGOCORE_RUNNER_URL, requestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = response.data;
    console.log("AlgoCore Runner Response:", data);

    // Our new backend already formats everything optimally, including the [run](cci:1://file:///c:/Users/heman/Desktop/AlgoCoreCodeRunner/server.js:22:0-156:2) property!
    return data;
    
  } catch (err) {
    console.error("AlgoCore API failed:", err.message);
    if (err.response) {
      console.error("AlgoCore Error:", err.response.data);
    }
    throw new Error(`Code execution failed. ${err.message}`);
  }
};

export const aiApi = {
  chat: (messages) => axios.post("https://algocorefunctions.netlify.app/.netlify/functions/chat", { messages }),
  solveAptitude: (text) => axios.post("https://algocorefunctions.netlify.app/.netlify/functions/aptitude-solve", { text }),
  evaluateCode: (text) => axios.post("https://algocorefunctions.netlify.app/.netlify/functions/coding-evaluate", { text }),
  analyzeComplexity: (text) => axios.post("https://algocorefunctions.netlify.app/.netlify/functions/coding-complexity", { text }),
  summarize: (text) => axios.post("https://algocorefunctions.netlify.app/.netlify/functions/ai", { task: "summarization", text }),
};
