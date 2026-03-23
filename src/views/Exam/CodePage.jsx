'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

import { database } from '../../firebase';
import { ref, get, child } from "firebase/database";
import CodePageSingle from './CodePageSingle';
import CodePageMultifile from './CodePageMultifile';

const isMultiFileQuestion = (questionData) => {
    if (!questionData?.defaultCode) return false;

    // Check if defaultCode has multiple files for any language
    const languages = Object.keys(questionData.defaultCode);
    for (const lang of languages) {
        const langCode = questionData.defaultCode[lang];
        if (typeof langCode === 'object' && langCode !== null) {
            const fileNames = Object.keys(langCode).filter(key => key !== 'order');
            if (fileNames.length > 1) {
                return true;
            }
        }
    }
    return false;
};

function CodePage({ question, data, questionData, ...props }) {
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [loadingLanguages, setLoadingLanguages] = useState(true);
    const { testid } = useParams();

    useEffect(() => {
        const fetchAllowedLanguages = async () => {
            if (!testid) return;
            setLoadingLanguages(true);
            try {
                const snapshot = await get(child(ref(database), `Exam/${testid}/allowedLanguages`));
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    let normalizedArray = Array.isArray(data) ? data : Object.values(data);
                    const mappedLangs = normalizedArray.map(lang => {
                        const l = String(lang).toLowerCase();
                        if (l === 'c/c++' || l === 'c++' || l === 'c') return 'cpp';
                        return l;
                    });

                    if (mappedLangs.length > 0) {
                        // Prefer the first allowed language that also exists in the question's default code
                        const questionLangs = Object.keys(questionData?.defaultCode || {}).map(l => l.toLowerCase());
                        let firstAvailable = mappedLangs.find(l => questionLangs.includes(l.toLowerCase()));

                        // Fallback to the first allowed language if no intersection found
                        if (!firstAvailable) firstAvailable = mappedLangs[0];

                        setSelectedLanguage(firstAvailable);
                    }
                } else if (questionData?.defaultCode) {
                    // Fallback to question's first language if no exam restrictions found
                    const firstLang = Object.keys(questionData.defaultCode)[0];
                    setSelectedLanguage(firstLang);
                }
            } catch (error) {
                console.error("Error fetching allowed languages:", error);
                // Fallback on error
                if (questionData?.defaultCode) {
                    const firstLang = Object.keys(questionData.defaultCode)[0];
                    setSelectedLanguage(firstLang);
                }
            } finally {
                setLoadingLanguages(false);
            }
        };

        fetchAllowedLanguages();
    }, [testid, questionData]);

    if (loadingLanguages || !selectedLanguage) {
        return (
            <div className="flex items-center justify-center h-[60vh] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl m-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Initializing editor environment...</p>
                </div>
            </div>
        );
    }

    // Render appropriate component based on multi-file structure
    if (isMultiFileQuestion(questionData)) {
        return (
            <CodePageMultifile
                question={question}
                data={data}
                questionData={questionData}
                selectedLanguage={selectedLanguage}
                {...props}
            />
        );
    } else {
        return (
            <CodePageSingle
                question={question}
                data={data}
                questionData={questionData}
                selectedLanguage={selectedLanguage}
                {...props}
            />
        );
    }
}

export default CodePage;

