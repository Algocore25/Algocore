
import axios from "axios";

const JUDGE0_LANGUAGE_IDS = {
  python: 71,
  java: 62,
  cpp: 54, // C++
  c: 50,
  javascript: 63,
  sql: 82 // SQLite 3.27.2
};

export const executeCode = async (language, sourceCode, input) => {
  const judge0LangId = JUDGE0_LANGUAGE_IDS[language];
  if (!judge0LangId) {
    throw new Error(`Judge0 does not support language: ${language}`);
  }

  let finalSourceCode = sourceCode;

  // For SQL, prepend headers configuration
  if (language === 'sql') {
    finalSourceCode = `.headers on\n.mode list\n.separator "|\"\n${sourceCode}`;
  }

  try {
    // Validate inputs before sending
    if (!finalSourceCode || finalSourceCode.trim() === '') {
      throw new Error('Source code cannot be empty');
    }

    // Unescape literal \n sequences to real newlines
    const normalizedInput = String(input || "").replace(/\\n/g, "\n");

    const requestData = {
      source_code: btoa(unescape(encodeURIComponent(finalSourceCode))), // Base64 encode (Unicode-safe)
      language_id: String(judge0LangId), // Convert to string
      stdin: btoa(unescape(encodeURIComponent(normalizedInput))) // Base64 encode stdin too
    };

    console.log("Judge0 Request:", { language, languageId: judge0LangId });

    const judge0Response = await axios.post("https://ce.judge0.com/submissions?base64_encoded=true&wait=true", requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    const data = judge0Response.data;

    console.log("Judge0 Response:", data);

    // Decode base64 outputs from Judge0
    const decodeBase64 = (str) => {
      try {
        return str ? atob(str) : "";
      } catch (e) {
        console.error("Error decoding base64 from Judge0:", e);
        return str || "";
      }
    };

    const decodedStdout = decodeBase64(data.stdout);
    const decodedStderr = decodeBase64(data.stderr || data.compile_output);

    // Map Judge0 response format
    // Status IDs: 1=In Queue, 2=Processing, 3=Accepted, 4=Wrong Answer, 5=Time Limit Exceeded, 6=Compilation Error, 7=Runtime Error, 8=Internal Error, 9=Exec Format Error
    const isTimeout = data.status?.id === 5;

    return {
      run: {
        stdout: decodedStdout,
        stderr: decodedStderr,
        output: decodedStdout ? decodedStdout : decodedStderr,
        code: data.status?.id === 3 ? 0 : 1, // 3 means "Accepted"
        cpuTime: parseFloat(data.time) * 1000 || 0, // Convert seconds to milliseconds
        memory: data.memory || 0,
        signal: null,
        timeout: isTimeout,
        statusId: data.status?.id,
      }
    };
  } catch (jError) {
    console.error("Judge0 API failed:", jError.message);
    if (jError.response) {
      console.error("Judge0 Error:", jError.response.data);
    }
    throw new Error(`Code execution failed. ${jError.message}`);
  }
};
export const aiApi = {
  chat: (messages) => axios.post("https://algocorefunctions.netlify.app/.netlify/functions/chat", { messages }),
  solveAptitude: (text) => axios.post("https://algocorefunctions.netlify.app/.netlify/functions/aptitude/solve", { text }),
  evaluateCode: (text) => axios.post("https://algocorefunctions.netlify.app/.netlify/functions/coding/evaluate", { text }),
  analyzeComplexity: (text) => axios.post("https://algocorefunctions.netlify.app/.netlify/functions/coding/complexity", { text }),
  summarize: (text) => axios.post("https://algocorefunctions.netlify.app/.netlify/functions/summarize", { text }),
};
