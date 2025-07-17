import React, { useState, useEffect } from 'react';
import { database } from '../../firebase';
import { ref, onValue } from 'firebase/database';
import { Table, TableBody, TableCell, TableHead, TableRow, Paper, CircularProgress, Typography } from '@mui/material';

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const submissionsRef = ref(database, 'userprogress');
    const unsubscribe = onValue(submissionsRef, (snapshot) => {
      const progressData = snapshot.val();
      if (!progressData) {
        setStudents([]);
        setLoading(false);
        return;
      }

      // Transform the progress data into a student list
      const studentList = Object.entries(progressData).map(([studentId, progress]) => {
        // Count total completed topics/MCQs
        let totalCompleted = 0;
        let totalTopics = 0;
        
        Object.values(progress).forEach(category => {
          Object.values(category).forEach(topic => {
            totalTopics++;
            totalCompleted += Object.values(topic).filter(completed => completed).length;
          });
        });

        return {
          studentId,
          name: studentId, // Replace with actual name if available in data
          totalTopics,
          totalCompleted,
          completionRate: totalTopics > 0 ? (totalCompleted / totalTopics) * 100 : 0,
        };
      });

      setStudents(studentList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching student data:', error);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <Typography variant="h6" gutterBottom component="div" sx={{ padding: 2 }}>
        Student Progress (Live Updates)
      </Typography>
      <Table sx={{ minWidth: 650 }} aria-label="student progress table">
        <TableHead>
          <TableRow>
            <TableCell>Student ID</TableCell>
            <TableCell align="right">Total Topics</TableCell>
            <TableCell align="right">Completed Topics</TableCell>
            <TableCell align="right">Completion Rate</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {students.map((student) => (
            <TableRow
              key={student.studentId}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {student.name}
              </TableCell>
              <TableCell align="right">{student.totalTopics}</TableCell>
              <TableCell align="right">{student.totalCompleted}</TableCell>
              <TableCell align="right">{student.completionRate.toFixed(2)}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default AdminStudents;