import axios from "axios";

// Language number mapping for backend communication
export const LANGUAGE_NUMBERS = {
  c: 1,
  cpp: 2,
  java: 3,
  python: 4,
  javascript: 5,
  typescript: 6,
  sql: 7
};

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

    // Get language number for backend communication
    const languageNumber = LANGUAGE_NUMBERS[language];
    if (!languageNumber) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const requestData = {
      sourceCode: sourceCode,
      language: languageNumber, // Send number instead of string
      input: normalizedInput
    };

    console.log("AlgoCore Runner Request:", { language, languageNumber });

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


export const ALGOCORE_BASE_URL = "https://algocore-runner.kindcliff-a86dac7a.southindia.azurecontainerapps.io/";

export const aiApi = {
  chat: (messages) => axios.post(  ALGOCORE_BASE_URL +"chat", { messages }),
  solveAptitude: (text) => axios.post(  ALGOCORE_BASE_URL +"aptitude-solve", { text }),
  evaluateCode: (text) => axios.post(  ALGOCORE_BASE_URL +"coding-evaluate", { text }),
  analyzeComplexity: (text) => axios.post(  ALGOCORE_BASE_URL +"coding-complexity", { text }),
  summarize: (text) => axios.post(  ALGOCORE_BASE_URL +"ai", { task: "summarization", text }),
};
