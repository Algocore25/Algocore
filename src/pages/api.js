
import { database } from "../firebase";
import { ref, get, set, child } from "firebase/database";






import axios from "axios";
// firebase.js

const API = axios.create({
  baseURL: "https://emkc.org/api/v2/piston",
});





const LANGUAGE_VERSIONS = {
  python: "3.10.0",
  java: "15.0.2",
  cpp: "10.2.0",  // You can specify the desired version here
  javascript: "18.15.0",
  sql: "3.36.0" // SQLite 3 support for Piston if available
};


const JUDGE0_LANGUAGE_IDS = {
  python: 71,
  java: 62,
  cpp: 54, // C++
  c: 50,
  javascript: 63,
  sql: 82 // SQLite 3.27.2
};

export const executeCode = async (language, sourceCode, input) => {
  try {
    let finalSourceCode = sourceCode;

    // For SQL, prepend headers configuration
    if (language === 'sql') {
      finalSourceCode = `.headers on\n.mode list\n.separator "|\"\n${sourceCode}`;
    }

    const response = await API.post("/execute", {
      language: language,
      version: LANGUAGE_VERSIONS[language],
      files: [
        {
          name: language === 'sql' ? "main.sql" : "main.c",
          content: finalSourceCode,
        },
        ...(language === 'c' || language === 'cpp' ? [{ name: "helper.c", content: helperC }] : [])
      ],
      // Include the input here
      stdin: input,  // This is where we add the user input to the request payload
    });
    // console.log( typeof(response.data.run.output) );
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.warn("Piston API failed, falling back to Judge0 API...", error.message);

    const judge0LangId = JUDGE0_LANGUAGE_IDS[language];
    if (!judge0LangId) {
      throw new Error(`Execution failed and fallback Judge0 does not support language: ${language}`);
    }

    let finalSourceCode = sourceCode;
 
    // For SQL, prepend headers configuration
    if (language === 'sql') {
      finalSourceCode = `.headers on\n.mode list\n.separator "|\"\n${sourceCode}`;
    }
    

    const payload = {
      source_code: finalSourceCode,
      language_id: judge0LangId,
      stdin: input || "" // ensure stdin is always a string, not undefined
    };

    console.log("Judge0 Fallback Payload:", payload);

    try {
      const judge0Response = await axios.post("https://ce.judge0.com/submissions?base64_encoded=false&wait=true", payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      const data = judge0Response.data;

      console.log("Judge0 Fallback Response:", data);

      // Map Judge0 response Format to match Piston's expected format
      return {
        language: language,
        version: LANGUAGE_VERSIONS[language],
        run: {
          stdout: data.stdout || "",
          stderr: data.stderr || data.compile_output || "",
          output: data.stdout ? data.stdout : (data.stderr || data.compile_output || ""),
          code: data.status?.id === 3 ? 0 : 1, // 3 means "Accepted"
          cpuTime: parseFloat(data.time) * 1000 || 0,
          memory: data.memory || 0,
          signal: null,
        }
      };
    } catch (jError) {
      console.error("Judge0 API also failed:", jError.message);
      if (jError.response) {
        console.error("Judge0 Error Data:", jError.response.data);
      }
      throw new Error(`Execution failed on both main API and fallback API. Judge0 Response: ${JSON.stringify(jError.response?.data || jError.message)}`);
    }
  }
};




