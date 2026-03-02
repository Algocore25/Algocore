// pages/Results.jsx or wherever you render the list
import React, { useEffect, useState } from "react";
import TestCard from "./TestCard";
import { getDatabase, ref, get, child } from "firebase/database";

import { database } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";


const Results = () => {
    const [tests, setTests] = useState([]);
    const [filteredTests, setFilteredTests] = useState([]);

    const navigate = useNavigate();

    const { user } = useAuth();


    useEffect(() => {
        if (user) {
            fetchTests();
        }
    }, [user]);

    const fetchTests = async () => {
        try {
            const dbRef = ref(database);
            const snapshot = await get(child(dbRef, "Exam"));

            if (snapshot.exists()) {
                const data = snapshot.val();

                const dataArray = Object.entries(data).map(([id, value]) => ({ id, ...value }));

                console.log("All exams:", dataArray);
                console.log("User email:", user?.email);

                console.log(dataArray);

                // ✅ Filter: Only eligible AND (globally completed OR user-specifically completed) AND visible
                const filtered = dataArray.filter(test => {
                    if (!user) return false;

                    const isAllowAll = test.allowAllStudents === true;
                    const isEligible = Array.isArray(Object.values(test.Eligible || {})) &&
                        Object.values(test.Eligible || {}).includes(user?.email);

                    // Check visibility
                    const isVisible = test.isVisible !== false; // Default to visible if not set


                    // Check user progress in the correct path
                    const userProgress = test.Properties?.Progress?.[user.uid];
                    const isUserFinished = userProgress?.status === 'completed';

                    return (
                        (isAllowAll || isEligible) &&
                        (isUserFinished) &&
                        isVisible
                    );
                });

                // Fetch scores for filtered tests
                const testsWithScores = await Promise.all(filtered.map(async (test) => {
                    try {
                        const submissionRef = ref(database, `ExamSubmissions/${test.id}/${user.uid}`);
                        const subSnapshot = await get(submissionRef);
                        const subData = subSnapshot.val();

                        if (subData) {
                            const questionsData = test.questions || [];
                            const correctCount = questionsData.filter(qId => subData[qId] === 'true').length;
                            const score = Math.round((correctCount / questionsData.length) * 100);
                            return { ...test, userScore: score, userId: user.uid };
                        }
                    } catch (err) {
                        console.error("Error fetching score for test:", test.id, err);
                    }
                    return { ...test, userId: user.uid };
                }));

                console.log("Eligible & Completed with scores:", testsWithScores);

                setTests(dataArray);         // All exams (if needed elsewhere)
                setFilteredTests(testsWithScores);  // Filtered list for display
            } else {
                console.log("No data available");
            }
        } catch (error) {
            console.error("Error loading mock exams from Firebase:", error);
        }
    };


    const handleStartTest = (testId) => {
        // Find the test object
        const testObj = filteredTests.find(t => t.id === testId);
        console.log(testObj)
        const schedulingType = testObj?.Properties?.type || 'anytime';
        navigate(`/studentresults/${testId}`);

     
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.length > 0 ? (
                filteredTests.map((test) => (
                    <TestCard key={test.id} test={test} onStart={(id) => handleStartTest(id)} />
                ))
            ) : (
                <div className="col-span-3 text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                        No tests found. Create a new test to get started.
                    </p>
                </div>
            )}
        </div>
    );
};

export default Results;
