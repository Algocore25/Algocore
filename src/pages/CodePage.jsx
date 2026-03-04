'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import { database } from "../firebase";
import { ref, get } from "firebase/database";
import { decodeShort } from '../utils/urlEncoder';
import CodePageSingle from './CodePageSingle';
import CodePageMultifile from './CodePageMultifile';

function CodePage({ data, navigation }) {
  const [questionData, setQuestionData] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [isMultifile, setIsMultifile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { questionId: encQuestionId, course: encCourse } = useParams();
  const questionId = decodeShort(encQuestionId);
  const course = decodeShort(encCourse);

  useEffect(() => {
    const fetchQuestionData = async () => {
      try {
        const questionRef = ref(database, `questions/${questionId}`);
        const questionSnapshot = await get(questionRef);

        if (questionSnapshot.exists()) {
          const question = questionSnapshot.val();
          setQuestionData(question);

          console.log(question);

          // Check if question has isMultifile property
          console.log(question.isMultifile);
          const hasIsMultifile = question.isMultifile === true;
          setIsMultifile(hasIsMultifile);

          console.log('🔍 Question structure analysis:', {
            questionId,
            isMultifile: hasIsMultifile,
            hasDefaultCode: !!question.defaultCode,
            defaultCodeStructure: question.defaultCode ? Object.keys(question.defaultCode) : 'none'
          });
        } else {
          console.error('Question not found:', questionId);
        }
      } catch (error) {
        console.error("Error fetching question data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (questionId) {
      fetchQuestionData();
    }
  }, [questionId]);

  // Get allowed languages to set default language
  useEffect(() => {
    const getAllowedLanguages = async () => {
      try {
        const snapshot = await get(ref(database, `/AlgoCore/${course}/course/allowedLanguages`));

        if (snapshot.exists()) {
          const data = snapshot.val();
          let normalizedArray = Array.isArray(data) ? data : Object.values(data);

          const mappedLangs = normalizedArray.map(lang => {
            const l = String(lang).toLowerCase();
            if (l === 'c/c++' || l === 'c++') return 'cpp';
            return l;
          });

          if (mappedLangs.length > 0) {
            setSelectedLanguage(mappedLangs[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching allowed languages:", error);
      }
    };

    if (course) {
      getAllowedLanguages();
    }
  }, [course]);

  useEffect(() => {
    console.log("reload");

  }, [questionData]
  )

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] w-full flex items-center justify-center bg-white dark:bg-dark-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4285F4] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading question...</p>
        </div>
      </div>
    );
  }

  if (!questionData) {
    return (
      <div className="h-[calc(100vh-4rem)] w-full flex items-center justify-center bg-white dark:bg-dark-primary">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Question not found</p>
          <p className="text-gray-600 dark:text-gray-400">Please check the question ID and try again.</p>
        </div>
      </div>
    );
  }

  console.log('🚀 Loading CodePage component:', {
    questionId,
    isMultifile,
    questionName: questionData.questionname,
    selectedLanguage
  });

  // Render appropriate component based on isMultifile property
  if (isMultifile) {
    console.log('📁 Loading Multi-file CodePage');
    return (
      <CodePageMultifile
        data={data}
        navigation={navigation}
        questionData={questionData}
        selectedLanguage={selectedLanguage}
      />
    );
  } else {
    console.log('📄 Loading Single-file CodePage');
    return (
      <CodePageSingle
        data={data}
        navigation={navigation}
        questionData={questionData}
        selectedLanguage={selectedLanguage}
      />
    );
  }
}

export default CodePage;
