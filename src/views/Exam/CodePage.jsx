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

function CodePage({ question, data, questionData, testId: propTestId, test: propTest, ...props }) {
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [loadingLanguages, setLoadingLanguages] = useState(true);
    const { testid: urlTestId } = useParams();
    
    // Use propTestId in preview mode, otherwise use URL testid
    const testid = propTestId || urlTestId;

    useEffect(() => {
        const fetchAllowedLanguages = async () => {
            console.log('🔍 CodePage: Fetching allowed languages, testid:', testid, 'propTestId:', propTestId, 'urlTestId:', urlTestId, 'propTest:', propTest);
            
            // First try to get allowed languages from test data if available
            if (propTest?.allowedLanguages) {
                console.log('📋 CodePage: Using allowedLanguages from test prop:', propTest.allowedLanguages);
                let normalizedArray = Array.isArray(propTest.allowedLanguages) ? propTest.allowedLanguages : Object.values(propTest.allowedLanguages);
                const mappedLangs = normalizedArray.map(lang => {
                    const l = String(lang).toLowerCase();
                    if (l === 'c/c++' || l === 'c++' || l === 'c') return 'cpp';
                    return l;
                });
                console.log('✅ CodePage: Mapped allowed languages from test prop:', mappedLangs);
                
                if (mappedLangs.length > 0) {
                    const questionLangs = Object.keys(questionData?.defaultCode || {}).map(l => l.toLowerCase());
                    let firstAvailable = mappedLangs.find(l => questionLangs.includes(l.toLowerCase()));
                    if (!firstAvailable) firstAvailable = mappedLangs[0];
                    console.log('🎯 CodePage: Selected language from test prop:', firstAvailable);
                    setSelectedLanguage(firstAvailable);
                    setLoadingLanguages(false);
                    return;
                }
            }
            
            if (!testid) {
                console.log('⚠️ CodePage: No testid available, using default languages');
                // Set default languages even when no testid is available
                const defaultLanguages = ['cpp', 'java', 'python', 'javascript'];
                if (questionData?.defaultCode) {
                    const firstLang = Object.keys(questionData.defaultCode)[0];
                    setSelectedLanguage(firstLang);
                } else {
                    setSelectedLanguage(defaultLanguages[0]);
                }
                setLoadingLanguages(false);
                return;
            }
            setLoadingLanguages(true);
            try {
                console.log('📋 CodePage: Fetching from path:', `Exam/${testid}/allowedLanguages`);
                const snapshot = await get(child(ref(database), `Exam/${testid}/allowedLanguages`));
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    console.log('📋 CodePage: Raw allowed languages data:', data);
                    let normalizedArray = Array.isArray(data) ? data : Object.values(data);
                    const mappedLangs = normalizedArray.map(lang => {
                        const l = String(lang).toLowerCase();
                        if (l === 'c/c++' || l === 'c++' || l === 'c') return 'cpp';
                        return l;
                    });
                    console.log('✅ CodePage: Mapped allowed languages:', mappedLangs);

                    if (mappedLangs.length > 0) {
                        // Prefer the first allowed language that also exists in the question's default code
                        const questionLangs = Object.keys(questionData?.defaultCode || {}).map(l => l.toLowerCase());
                        let firstAvailable = mappedLangs.find(l => questionLangs.includes(l.toLowerCase()));

                        // Fallback to the first allowed language if no intersection found
                        if (!firstAvailable) firstAvailable = mappedLangs[0];

                        console.log('🎯 CodePage: Selected language:', firstAvailable);
                        setSelectedLanguage(firstAvailable);
                    } else if (questionData?.defaultCode) {
                        // Fallback to question's first language if mappedLangs is empty
                        const firstLang = Object.keys(questionData.defaultCode)[0];
                        console.log('🔄 CodePage: Using question first language:', firstLang);
                        setSelectedLanguage(firstLang);
                    }
                } else if (questionData?.defaultCode) {
                    // Fallback to question's first language if no exam restrictions found
                    const firstLang = Object.keys(questionData.defaultCode)[0];
                    console.log('🔄 CodePage: No exam restrictions, using question first language:', firstLang);
                    setSelectedLanguage(firstLang);
                } else {
                    // Final fallback: default to 'cpp' if nothing else available
                    console.log('🔄 CodePage: Using final fallback language: cpp');
                    setSelectedLanguage('cpp');
                }
            } catch (error) {
                console.error("❌ CodePage: Error fetching allowed languages:", error);
                // Fallback on error
                if (questionData?.defaultCode) {
                    const firstLang = Object.keys(questionData.defaultCode)[0];
                    setSelectedLanguage(firstLang);
                } else {
                    setSelectedLanguage('cpp');
                }
            } finally {
                setLoadingLanguages(false);
            }
        };

        fetchAllowedLanguages();
    }, [testid, questionData, propTestId, urlTestId, propTest]);

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
                test={propTest}
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
                test={propTest}
                {...props}
            />
        );
    }
}

export default CodePage;

