// pages/Results.jsx or wherever you render the list
import React, { useEffect, useState } from "react";
import TestCard from "./TestCard";
import { getDatabase, ref, get, child } from "firebase/database";

import { database } from "../../firebase";
import { useRouter } from 'next/navigation';

import { useAuth } from "../../context/AuthContext";


const Results = () => {
    const [tests, setTests] = useState([]);
    const [filteredTests, setFilteredTests] = useState([]);

    const router = useRouter();

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
                    // Check eligibility from Eligible object
                    const eligibleData = test.Eligible || {};
                    const isEligible = Object.values(eligibleData).some(val => 
                        String(val).toLowerCase() === user?.email?.toLowerCase() || 
                        String(Object.keys(eligibleData).find(key => eligibleData[key] === val)).toLowerCase() === user?.email?.toLowerCase()
                    );

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
                        const [subSnapshot, marksSnapshot] = await Promise.all([
                            get(ref(database, `ExamSubmissions/${test.id}/${user.uid}`)),
                            get(ref(database, `Marks/${test.id}/${user.uid}`))
                        ]);
                        
                        const subData = subSnapshot.val();
                        const userMarks = marksSnapshot.val() || {};

                        if (subData) {
                            const rawQuestions = test.questions || {};
                            const questionsDataArray = Array.isArray(rawQuestions) ? rawQuestions : Object.keys(rawQuestions);
                            let totalMarksSum = 0;
                            
                            if (questionsDataArray.length > 0) {
                                questionsDataArray.forEach(qId => {
                                    totalMarksSum += (userMarks[qId] || 0);
                                });
                                const score = Math.round(totalMarksSum / questionsDataArray.length);
                                return { ...test, userScore: score, userId: user.uid };
                            }
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
        router.push(`/studentresults/${testId}`);
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
