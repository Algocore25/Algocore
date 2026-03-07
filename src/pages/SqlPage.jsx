'use client';



import React, { useState, useEffect, useCallback, useRef } from 'react';

import Editor from '@monaco-editor/react';

import { useTheme } from '../context/ThemeContext';

import { useParams, useNavigate } from "react-router-dom";



import { Icons, languageTemplates } from './constants';

import { registerIntelliSense, INTELLISENSE_OPTIONS } from '../hooks/useMonacoIntelliSense';



import { database } from "../firebase";

import { ref, get, set, child } from "firebase/database";



import AnimatedTestResults from './AnimatedTestResults';

import { executeCode } from './api';

import GoogleAd from '../components/GoogleAd';

import CompletionAnimation from '../components/CompletionAnimation';

import { useAuth } from '../context/AuthContext';





import { ToastContainer, toast } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";



import { setItemWithExpiry, getItemWithExpiry } from "../utils/storageWithExpiry";

import { decodeShort } from '../utils/urlEncoder';



// Helper: Extract all columns from schema for display

const getColumnsFromSchema = (schema) => {

  if (!schema) return {};



  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([^;]*?)\)(?:;|\n)/gi;

  const columns = {};

  let match;



  while ((match = tableRegex.exec(schema)) !== null) {

    const tableName = match[1];

    const columnsStr = match[2];

    const tableColumns = [];

    let currentCol = '';

    let parenDepth = 0;



    for (let i = 0; i < columnsStr.length; i++) {

      const char = columnsStr[i];

      if (char === '(') parenDepth++;

      else if (char === ')') parenDepth--;

      else if (char === ',' && parenDepth === 0) {

        if (currentCol.trim()) {

          const parts = currentCol.trim().split(/\s+/);

          if (parts.length > 0) {

            tableColumns.push(parts[0]);

          }

        }

        currentCol = '';

        continue;

      }

      currentCol += char;

    }



    if (currentCol.trim()) {

      const parts = currentCol.trim().split(/\s+/);

      if (parts.length > 0) {

        tableColumns.push(parts[0]);

      }

    }



    if (tableColumns.length > 0) {

      columns[tableName] = tableColumns;

    }

  }



  return columns;

};



// Helper: Extract column names from SELECT statement

const extractColumnsFromQuery = (sqlCode) => {

  if (!sqlCode || typeof sqlCode !== 'string') return null;



  // Match SELECT clause

  const selectMatch = sqlCode.match(/SELECT\s+(.*?)\s+FROM\s+/is);

  if (!selectMatch) return null;



  const selectClause = selectMatch[1];



  // Split by comma, but be careful with function calls

  const columns = [];

  let currentColumn = '';

  let parenDepth = 0;



  for (let i = 0; i < selectClause.length; i++) {

    const char = selectClause[i];

    if (char === '(') parenDepth++;

    else if (char === ')') parenDepth--;

    else if (char === ',' && parenDepth === 0) {

      const col = currentColumn.trim();

      if (col) {

        const columnName = extractColumnName(col);

        if (columnName) {

          columns.push(columnName);

        }

      }

      currentColumn = '';

      continue;

    }

    currentColumn += char;

  }



  // Don't forget the last column

  if (currentColumn.trim()) {

    const col = currentColumn.trim();

    const columnName = extractColumnName(col);

    if (columnName) {

      columns.push(columnName);

    }

  }



  // Return null if SELECT * or no valid columns found

  if (columns.length === 0 || columns[0] === '*') return null;



  return columns.length > 0 ? columns : null;

};



// Helper: Extract column name, handling aliases

const extractColumnName = (colStr) => {

  // Check for alias (with AS keyword or without)

  const aliasMatch = colStr.match(/\s+AS\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*$/i);

  if (aliasMatch) {

    // Return the alias if it exists

    return aliasMatch[1];

  }



  // Check for alias without AS keyword (space-separated at end)

  const spaceParts = colStr.trim().split(/\s+/);



  // If there are multiple parts and the last part looks like an identifier and is not a keyword

  if (spaceParts.length > 1) {

    const lastPart = spaceParts[spaceParts.length - 1];

    const commonKeywords = ['FROM', 'WHERE', 'GROUP', 'ORDER', 'LIMIT', 'AND', 'OR', 'ON'];



    // Check if last part is a valid identifier and not a keyword

    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(lastPart) && !commonKeywords.includes(lastPart.toUpperCase())) {

      return lastPart;

    }

  }



  // No alias - extract base column name

  let columnName = colStr.trim().split(/\s+/)[0];



  // Handle table.column format

  if (columnName.includes('.')) {

    columnName = columnName.split('.')[1];

  }



  // Filter out function calls

  if (!columnName.includes('(')) {

    return columnName;

  }



  return null;

};



// Helper: Render pipe-separated SQL output as a styled table with optional headers

const SqlResultTable = ({ text, className = '', columns = null, tableName = null }) => {

  console.log('Rendering SqlResultTable with text:', columns);

  if (!text || typeof text !== 'string') return <span className="text-gray-400 italic">No output</span>;

  const lines = text.split('\n').filter(l => l.trim() !== '');

  if (lines.length === 0) return <span className="text-gray-400 italic">Empty result</span>;



  // Check if output contains pipes (table format)

  const hasPipes = lines.some(line => line.includes('|'));



  let rows;

  let dataColCount;



  if (!hasPipes) {

    // No pipes - treat each line as a single cell in one column

    rows = lines.map(line => [line]);

    dataColCount = 1;

  } else {

    // Has pipes - split by pipe

    rows = lines.map(line => line.split('|').map(cell => cell.trim()));

    dataColCount = Math.max(...rows.map(r => r.length));

  }



  // Decide which headers to use

  let headers = null;

  let dataRows = rows;



  // For "products" table, use actual column names from schema

  if (columns && columns.length > 0) {

    // Use provided columns as headers

    headers = columns.slice(0, dataColCount);



    // Check if first row looks like headers (column names from output)

    const firstRow = rows[0];

    const looksLikeHeader = firstRow && firstRow.every(cell =>

      cell.length < 100 && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cell)

    );



    // If first row looks like headers, skip it (use extracted columns instead)

    if (looksLikeHeader && rows.length > 1) {

      dataRows = rows.slice(1);

    } else {

      dataRows = rows;

    }

  } else if (rows.length > 0 && dataColCount > 0) {

    // For all tables: check if first row looks like headers

    const firstRow = rows[0];



    // Check if first row looks like headers (column names)

    const looksLikeHeader = firstRow.every(cell =>

      cell.length < 100 && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cell)

    );



    if (looksLikeHeader && rows.length > 1) {

      // First row looks like headers - use it

      headers = firstRow;

      dataRows = rows.slice(1);

    } else if (rows.length === 1 && dataColCount === 1) {

      // Single scalar result (like SELECT MAX(price))

      headers = ['Result'];

      dataRows = rows;

    } else {

      // No headers - generate generic ones

      headers = Array.from({ length: dataColCount }, (_, i) => `Column ${i + 1}`);

      dataRows = rows;

    }

  }



  return (

    <div className={`overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>

      <table className="min-w-full text-sm bg-white dark:bg-gray-900">

        {headers && headers.length > 0 && (

          <thead>

            <tr className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-b-2 border-blue-300 dark:border-blue-700">

              {headers.map((col, j) => (

                <th key={j} className="px-4 py-3 font-bold text-left text-xs text-blue-900 dark:text-blue-200 uppercase tracking-widest border-r border-blue-200 dark:border-blue-700 last:border-r-0">

                  {col}

                </th>

              ))}

            </tr>

          </thead>

        )}

        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">

          {dataRows.map((row, i) => (

            <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors' : 'bg-gray-50 dark:bg-gray-800/30 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors'}>

              {row.map((cell, j) => (

                <td key={j} className="px-4 py-2.5 font-mono text-xs text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700 last:border-r-0">

                  {cell}

                </td>

              ))}

              {/* Pad empty cells if needed */}

              {Array.from({ length: dataColCount - row.length }).map((_, k) => (

                <td key={`pad-${k}`} className="px-4 py-2.5"></td>

              ))}

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

};



// Helper: Parse and display CREATE TABLE schema visually

const SqlSchemaDisplay = ({ schema }) => {

  if (!schema) return null;



  // Parse CREATE TABLE statements - improved regex to handle various formats

  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([^;]*?)\)(?:;|$)/gi;

  const tables = [];

  let match;



  while ((match = tableRegex.exec(schema)) !== null) {

    const tableName = match[1];

    const columnsStr = match[2];



    // Split by comma but be careful with function calls like DECIMAL(10,2)

    const columns = [];

    let currentCol = '';

    let parenDepth = 0;



    for (let i = 0; i < columnsStr.length; i++) {

      const char = columnsStr[i];

      if (char === '(') parenDepth++;

      else if (char === ')') parenDepth--;

      else if (char === ',' && parenDepth === 0) {

        if (currentCol.trim()) {

          const parts = currentCol.trim().split(/\s+/);

          if (parts.length > 0) {

            columns.push({

              name: parts[0],

              type: parts.slice(1).join(' ').toUpperCase()

            });

          }

        }

        currentCol = '';

        continue;

      }

      currentCol += char;

    }



    // Don't forget last column

    if (currentCol.trim()) {

      const parts = currentCol.trim().split(/\s+/);

      if (parts.length > 0) {

        columns.push({

          name: parts[0],

          type: parts.slice(1).join(' ').toUpperCase()

        });

      }

    }



    if (columns.length > 0) {

      tables.push({ name: tableName, columns });

    }

  }



  // Parse INSERT statements to count rows per table

  const insertRegex = /INSERT\s+INTO\s+(\w+)/gi;

  const rowCounts = {};

  while ((match = insertRegex.exec(schema)) !== null) {

    const tbl = match[1];

    rowCounts[tbl] = (rowCounts[tbl] || 0) + 1;

  }



  if (tables.length === 0) {

    return (

      <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg font-mono text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap border border-gray-200 dark:border-gray-700">

        {schema}

      </pre>

    );

  }



  return (

    <div className="space-y-3">

      {tables.map((table, idx) => (

        <div key={idx} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">

          <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">

            <div className="flex items-center gap-2">

              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z" />

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16" />

              </svg>

              <span className="font-semibold text-sm text-blue-700 dark:text-blue-300">{table.name}</span>

            </div>

            {rowCounts[table.name] && (

              <span className="text-xs text-gray-500 dark:text-gray-400">{rowCounts[table.name]} rows</span>

            )}

          </div>

          <div className="overflow-x-auto">

            <table className="min-w-full text-sm">

              <thead>

                <tr className="bg-gray-100 dark:bg-gray-800">

                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Column</th>

                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Type</th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">

                {table.columns.map((col, ci) => (

                  <tr key={ci} className={ci % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'}>

                    <td className="px-4 py-2 font-mono text-xs text-gray-800 dark:text-gray-200 whitespace-nowrap">{col.name}</td>

                    <td className="px-4 py-2 font-mono text-xs text-gray-600 dark:text-gray-400">{col.type}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      ))}

    </div>

  );

};



// Helper: Parse and display tables with actual data from INSERT statements

const SqlTablesDisplay = ({ schema }) => {

  if (!schema) return <p className="text-gray-600 dark:text-gray-400">No schema available</p>;



  // Parse CREATE TABLE statements - improved regex

  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(([^;]*?)\)(?:;|\n)/gi;

  const tableStructures = {};

  let match;



  while ((match = tableRegex.exec(schema)) !== null) {

    const tableName = match[1];

    const columnsStr = match[2];



    // Parse column names accounting for parentheses in data types

    const columns = [];

    let currentCol = '';

    let parenDepth = 0;



    for (let i = 0; i < columnsStr.length; i++) {

      const char = columnsStr[i];

      if (char === '(') parenDepth++;

      else if (char === ')') parenDepth--;

      else if (char === ',' && parenDepth === 0) {

        if (currentCol.trim()) {

          const parts = currentCol.trim().split(/\s+/);

          if (parts.length > 0) {

            columns.push(parts[0]);

          }

        }

        currentCol = '';

        continue;

      }

      currentCol += char;

    }



    if (currentCol.trim()) {

      const parts = currentCol.trim().split(/\s+/);

      if (parts.length > 0) {

        columns.push(parts[0]);

      }

    }



    tableStructures[tableName] = columns;

  }



  // Parse INSERT statements with data - handle multiple rows per INSERT

  const tableData = {};



  // Find each complete INSERT statement

  const insertStatements = schema.match(/INSERT\s+INTO\s+\w+[^;]*;/gi) || [];



  for (const stmt of insertStatements) {

    // Extract table name

    const tableMatch = stmt.match(/INSERT\s+INTO\s+(\w+)/i);

    if (!tableMatch) continue;



    const tableName = tableMatch[1];

    if (!tableData[tableName]) {

      tableData[tableName] = [];

    }



    // Extract VALUES clause

    const valuesMatch = stmt.match(/VALUES\s*(.+?)(?:;|$)/is);

    if (!valuesMatch) continue;



    const valuesSection = valuesMatch[1];



    // Split into individual rows - need to handle nested parentheses and quotes

    const rows = [];

    let currentRow = '';

    let parenDepth = 0;

    let inString = false;

    let stringChar = null;



    for (let i = 0; i < valuesSection.length; i++) {

      const char = valuesSection[i];

      const prevChar = i > 0 ? valuesSection[i - 1] : '';



      // Track string state

      if ((char === '"' || char === "'") && prevChar !== '\\') {

        if (!inString) {

          inString = true;

          stringChar = char;

        } else if (char === stringChar) {

          inString = false;

        }

      }



      // Track parenthesis depth when not in string

      if (!inString) {

        if (char === '(') {

          parenDepth++;

        } else if (char === ')') {

          parenDepth--;

        }

      }



      // At top level (parenDepth === 0), split on commas

      if (!inString && char === ',' && parenDepth === 0) {

        const trimmed = currentRow.trim();

        if (trimmed) {

          rows.push(trimmed);

        }

        currentRow = '';

        continue;

      }



      currentRow += char;

    }



    // Don't forget the last row

    if (currentRow.trim()) {

      rows.push(currentRow.trim());

    }



    // Parse each row

    for (const rowStr of rows) {

      const match = rowStr.match(/^\((.+)\)$/);

      if (!match) continue;



      const valuesStr = match[1];

      const values = [];

      let currentValue = '';

      let inStr = false;

      let strChar = null;

      let pDepth = 0;



      for (let i = 0; i < valuesStr.length; i++) {

        const c = valuesStr[i];

        const prev = i > 0 ? valuesStr[i - 1] : '';



        // Handle quotes

        if ((c === '"' || c === "'") && prev !== '\\') {

          if (!inStr) {

            inStr = true;

            strChar = c;

            currentValue += c;

          } else if (c === strChar) {

            inStr = false;

            strChar = null;

            currentValue += c;

          } else {

            currentValue += c;

          }

        }

        // Handle parentheses

        else if (c === '(' && !inStr) {

          pDepth++;

          currentValue += c;

        } else if (c === ')' && !inStr) {

          pDepth--;

          currentValue += c;

        }

        // Handle value separator

        else if (c === ',' && !inStr && pDepth === 0) {

          let v = currentValue.trim();

          if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {

            v = v.slice(1, -1);

          }

          values.push(v);

          currentValue = '';

        } else {

          currentValue += c;

        }

      }



      // Add last value

      if (currentValue.trim()) {

        let v = currentValue.trim();

        if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {

          v = v.slice(1, -1);

        }

        values.push(v);

      }



      if (values.length > 0) {

        tableData[tableName].push(values);

      }

    }

  }





  if (Object.keys(tableData).length === 0) {

    return (

      <div className="text-center py-8">

        <p className="text-gray-600 dark:text-gray-400 mb-2">No tables with data found</p>

        <p className="text-xs text-gray-500 dark:text-gray-500">Schema: {schema?.substring(0, 100)}...</p>

      </div>

    );

  }



  return (

    <div className="space-y-6">

      {Object.entries(tableData).map(([tableName, rows]) => {

        const columns = tableStructures[tableName] || [];

        return (

          <div key={tableName} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">

            <div className="bg-purple-50 dark:bg-purple-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">

              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />

              </svg>

              <span className="font-bold text-base text-purple-700 dark:text-purple-300">{tableName}</span>

              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 font-medium">{rows.length} {rows.length === 1 ? 'row' : 'rows'}</span>

            </div>

            <div className="overflow-x-auto">

              <table className="min-w-full text-sm">

                <thead>

                  <tr className="bg-gray-100 dark:bg-gray-800">

                    {columns.length > 0 ? (

                      columns.map((col, idx) => (

                        <th

                          key={idx}

                          className="px-4 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 last:border-r-0"

                        >

                          {col}

                        </th>

                      ))

                    ) : (

                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Data</th>

                    )}

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">

                  {rows.map((row, rowIdx) => (

                    <tr

                      key={rowIdx}

                      className={rowIdx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50'}

                    >

                      {columns.length > 0 ? (

                        columns.map((col, colIdx) => (

                          <td

                            key={colIdx}

                            className="px-4 py-2.5 font-mono text-sm text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700 last:border-r-0 whitespace-nowrap"

                          >

                            {row[colIdx] || '-'}

                          </td>

                        ))

                      ) : (

                        <td className="px-4 py-2.5 font-mono text-sm text-gray-800 dark:text-gray-200">

                          {row.join(' | ')}

                        </td>

                      )}

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>

        );

      })}

    </div>

  );

};



// SQL-specific test results display with table formatting

const SqlAnimatedTestResults = ({ testResults = [], runsubmit, schema = null, questionData = null, code = '' }) => {

  const { theme } = useTheme();



  if (runsubmit === 'none' || testResults.length === 0) {

    return (

      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">

        <p className="text-gray-600 dark:text-gray-400">No tests run yet</p>

      </div>

    );

  }



  const allPassed = testResults.every(t => t.passed);

  const testStatus = allPassed ? 'passed' : 'failed';

  const passedCount = testResults.filter(t => t.passed).length;

  const percentage = Math.round((passedCount / testResults.length) * 100);



  return (

    <div className="w-full max-w-4xl mx-auto space-y-6">

      {/* Summary Header */}

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">

        <div className="flex items-center gap-4 mb-4">

          {testStatus === 'passed' ? (

            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>

              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />

            </svg>

          ) : (

            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>

              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />

            </svg>

          )}

          <div>

            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">

              {testStatus === 'passed' ? 'All Tests Passed! 🎉' : `${testResults.filter(t => !t.passed).length} Test${testResults.filter(t => !t.passed).length !== 1 ? 's' : ''} Failed`}

            </h3>

            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">

              {passedCount} of {testResults.length} test case{testResults.length !== 1 ? 's' : ''} passed

            </p>

          </div>

          <div className="ml-auto">

            <div className="text-right">

              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Score</p>

              <p className="text-2xl font-bold text-gray-900 dark:text-white">{percentage}%</p>

            </div>

          </div>

        </div>

      </div>



      {/* Test Results List */}

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">

        <div className="divide-y divide-gray-200 dark:divide-gray-800">

          {testResults.map((test, idx) => (

            <div key={idx} className="p-6">

              <div className="flex items-center justify-between mb-4">

                <div className="flex items-center gap-3">

                  {test.passed ? (

                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />

                    </svg>

                  ) : (

                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />

                    </svg>

                  )}

                  <h4 className="font-bold text-gray-900 dark:text-white">Test Case {idx + 1}</h4>

                  <span className={`text-xs font-bold uppercase tracking-wider ${test.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>

                    {test.passed ? 'Passed' : 'Failed'}

                  </span>

                </div>

              </div>



              <div className="space-y-6">

                {/* Expected Output */}

                <div>

                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Expected Output</p>

                  {(() => {

                    const schemaColumns = getColumnsFromSchema(schema);

                    console.log('Schema columns for expected output:', schemaColumns);

                    const firstTableColumns = Object.values(schemaColumns)[0] || null;

                    const expectedSchema = questionData?.testcases[0]?.expectedColumns || firstTableColumns;

                    const hasTableFormat = test.expected && test.expected.includes('|');



                    if (!hasTableFormat) {

                      // Non-table format (plain description/text)

                      return (

                        <pre className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg font-mono text-xs whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200 border border-blue-200 dark:border-blue-800">

                          {test.expected || 'No output'}

                        </pre>

                      );

                    }



                    // Table format

                    return (

                      <SqlResultTable

                        text={test.expected}

                        className=""

                        columns={expectedSchema}

                      />

                    );

                  })()}

                </div>



                {/* Your Output */}

                <div>

                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Your Output</p>

                  {(() => {

                    const hasTableFormat = test.output && test.output.includes('\n');



                    if (!hasTableFormat) {

                      // Non-table format (plain description/text)

                      const bgClass = test.passed

                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'

                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';



                      return (

                        <pre className={`p-4 rounded-lg font-mono text-xs whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200 border ${bgClass}`}>

                          {test.output || 'No output'}

                        </pre>

                      );

                    }



                    // Table format - extract columns from actual output only

                    let userColumns = null;



                    // Extract columns from the actual output headers only

                    const outputLines = test.output ? test.output.split('\n').filter(l => l.trim() !== '') : [];



                    if (outputLines.length > 0) {

                      const firstLine = outputLines[0];

                      const potentialHeaders = firstLine.split('|').map(cell => cell.trim()).filter(cell => cell !== '');



                      // Check if first row looks like headers (pattern: word characters and underscores)

                      const looksLikeHeaders = potentialHeaders.every(cell =>

                        /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cell)

                      );



                      if (looksLikeHeaders && outputLines.length > 1) {

                        userColumns = potentialHeaders;

                      }

                    }



                    console.log('Final columns used for user output:', userColumns);



                    return (

                      <SqlResultTable

                        text={test.output}

                        className=""

                        columns={userColumns}

                      />

                    );

                  })()}

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>



      <p className="mt-4 text-xs text-gray-400 dark:text-gray-500 text-center italic">

        Tests are run against the current code version in the editor.

      </p>

    </div>

  );

};





function SqlPage({ data, navigation }) {

  const [code, setCode] = useState("");

  const [runsubmit, setRunSubmit] = useState('none');



  // Prevent copy, cut, and paste

  useEffect(() => {



    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLocalhost) return;



    const preventDefault = (e) => {

      e.preventDefault();

      e.stopPropagation();

      return false;

    };



    // Disable right-click context menu

    const preventContextMenu = (e) => {

      e.preventDefault();

      e.stopPropagation();

      return false;

    };



    // More aggressive paste prevention

    const blockPaste = (e) => {

      // Block all paste events

      e.preventDefault();

      e.stopPropagation();



      // Clear clipboard data if possible

      if (e.clipboardData) {

        e.clipboardData.setData('text/plain', '');

        e.clipboardData.clearData();

      }



      // Show a message to the user

      toast.error('Copy-paste is disabled in this environment');

      return false;

    };



    // Block drag and drop

    const blockDragDrop = (e) => {

      e.preventDefault();

      e.stopPropagation();

      return false;

    };



    // Add event listeners with capture phase

    const options = { capture: true, passive: false };



    // Block copy/paste events

    document.addEventListener('copy', preventDefault, options);

    document.addEventListener('cut', preventDefault, options);

    document.addEventListener('paste', blockPaste, options);

    document.addEventListener('contextmenu', preventContextMenu, options);



    // Block drag and drop

    document.addEventListener('drop', blockDragDrop, options);

    document.addEventListener('dragover', blockDragDrop, options);



    // Disable keyboard shortcuts (Ctrl+C, Ctrl+V, Ctrl+X, etc.)

    const preventShortcuts = (e) => {

      const isPaste = (e.ctrlKey || e.metaKey) && ['v', 'V', 'Insert'].includes(e.key);

      const isCopy = (e.ctrlKey || e.metaKey) && ['c', 'C', 'c', 'C', 'Insert', 'F3', 'F16', 'F24'].includes(e.key);

      const isCut = (e.ctrlKey || e.metaKey) && ['x', 'X', 'Delete'].includes(e.key);



      if (isPaste || isCopy || isCut) {

        e.preventDefault();

        e.stopPropagation();



        // Clear any selected text

        window.getSelection().removeAllRanges();



        // Show feedback

        if (isPaste) {

          toast.error('Pasting is disabled in this environment');

        }



        return false;

      }

    };



    document.addEventListener('keydown', preventShortcuts, { capture: true });



    // Block contentEditable elements

    const blockEditable = (e) => {

      if (e.target.isContentEditable) {

        e.preventDefault();

        e.stopPropagation();

        return false;

      }

    };



    document.addEventListener('paste', blockEditable, { capture: true });



    // Block iframe events

    window.addEventListener('blur', () => {

      if (document.activeElement && document.activeElement.tagName === 'IFRAME') {

        document.activeElement.blur();

      }

    });



    // Cleanup function

    return () => {

      document.removeEventListener('copy', preventDefault, options);

      document.removeEventListener('cut', preventDefault, options);

      document.removeEventListener('paste', blockPaste, options);

      document.removeEventListener('contextmenu', preventContextMenu, options);

      document.removeEventListener('drop', blockDragDrop, options);

      document.removeEventListener('dragover', blockDragDrop, options);

      document.removeEventListener('keydown', preventShortcuts, { capture: true });

      document.removeEventListener('paste', blockEditable, { capture: true });

      window.removeEventListener('blur', () => { });

    };

  }, []);

  const [activeTab, setActiveTab] = useState('description');

  const [output, setOutput] = useState(null);

  const [testResults, setTestResults] = useState([]);

  const [testCaseTab, setTestCaseTab] = useState(0);

  const [isDragging, setIsDragging] = useState(false);

  const [leftPanelWidth, setLeftPanelWidth] = useState(45);

  const [selectedLanguage, setSelectedLanguage] = useState('sql');

  const [isCompleted, setIsCompleted] = useState(false);

  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);

  const { theme } = useTheme();

  const [questionData, setQuestionData] = useState(null);

  const [courseData, setCourseData] = useState(null);

  const [testCasesrun, setTestCases] = useState([{ input: '', expectedOutput: '' }]);

  const inputRef = useRef(null);

  const outputRef = useRef(null);



  const adjustTextareaHeight = (element) => {

    if (element) {

      // Force reflow to ensure scrollHeight is accurate

      element.style.height = 'auto';

      // Set height to scrollHeight, but ensure it's at least 80px and at most 200px

      const newHeight = Math.min(200, Math.max(80, element.scrollHeight));

      element.style.height = newHeight + 'px';

    }

  };



  // Helper: Compare both columns and rows for SQL output validation

  const compareTableOutput = (expectedOutput, actualOutput) => {

    const expectedColumns = questionData?.testcases[0]?.expectedColumns || null;

    const rowexpectedLines = expectedOutput ? expectedOutput.split("\n").filter(l => l.trim() !== '') : [];

    const actualLines = actualOutput ? actualOutput.split("\n").filter(l => l.trim() !== '') : [];



    const expectedLines = expectedColumns && rowexpectedLines.length > 0

      ? [expectedColumns.join('|'), ...rowexpectedLines]

      : rowexpectedLines;



    console.log(expectedLines);

    console.log(actualLines);



    // condition to compare column names if expected output has column names defined in question data

    if (expectedColumns && expectedLines.length > 0) {

      const expectedHeader = expectedLines[0];

      const actualHeader = actualLines.length > 0 ? actualLines[0] : '';

      console.log('Comparing headers:');

      console.log('Expected header:', expectedHeader);

      console.log('Actual header:', actualHeader);

      if (expectedHeader.trim() !== actualHeader.trim()) {

        return false;

      }

    }



    console.log('After header check:');







    // Check if both outputs have pipes (table format)

    const expectedHasPipes = expectedLines.some(line => line.includes('|'));

    const actualHasPipes = actualLines.some(line => line.includes('|'));





    // If both are table format, compare columns and rows separately

    if (expectedHasPipes && actualHasPipes) {

      // Parse expected output

      const expectedRows = expectedLines.map(line =>

        line.split('|').map(cell => cell.trim()).filter(cell => cell !== '')

      );



      // Parse actual output

      const actualRows = actualLines.map(line =>

        line.split('|').map(cell => cell.trim()).filter(cell => cell !== '')

      );



      // Must have at least header row

      if (expectedRows.length === 0 || actualRows.length === 0) return false;



      // Extract headers (first row) and data rows from expected output

      const expectedHeaders = expectedRows[0];

      const expectedDataRows = expectedRows.slice(1);



      // Check if first row of actual output looks like column headers

      // If it does, skip it; otherwise treat all rows as data

      const firstRowLooksLikeHeader = actualRows[0].every(cell =>

        /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cell)

      );

      const actualDataRows = firstRowLooksLikeHeader ? actualRows.slice(1) : actualRows;

      const actualHeaders = firstRowLooksLikeHeader ? actualRows[0] : null;



      // Validate columns: must have same number of columns

      if (expectedDataRows.length === 0) return false;

      if (expectedDataRows[0].length !== actualDataRows[0].length) return false;



      // Validate number of data rows match

      if (expectedDataRows.length !== actualDataRows.length) return false;



      // Validate each data row matches (case-insensitive, trimmed)

      for (let i = 0; i < expectedDataRows.length; i++) {

        const expectedRow = expectedDataRows[i];

        const actualRow = actualDataRows[i];



        // Check if each row has the same number of columns

        if (expectedRow.length !== actualRow.length) return false;



        // Check if each cell matches (case-insensitive, trimmed)

        for (let j = 0; j < expectedRow.length; j++) {

          if (expectedRow[j].toLowerCase() !== actualRow[j].toLowerCase()) return false;

        }

      }



      return true;

    }



    // If neither are table format, do simple line-by-line comparison

    if (!expectedHasPipes && !actualHasPipes) {

      if (expectedLines.length !== actualLines.length) return false;

      return expectedLines.every((val, idx) => val.trimEnd() === actualLines[idx].trimEnd());

    }



    // If one is table format and other is not, they don't match

    return false;

  };



  useEffect(() => {

    // Use a small timeout to ensure the DOM is fully updated

    const timer = setTimeout(() => {

      if (inputRef.current) {

        inputRef.current.style.height = 'auto';

        inputRef.current.style.height = inputRef.current.scrollHeight + 'px';

      }

      if (outputRef.current) {

        outputRef.current.style.height = 'auto';

        outputRef.current.style.height = outputRef.current.scrollHeight + 'px';

      }

    }, 10);



    return () => clearTimeout(timer);

  }, [testCaseTab, testCasesrun, activeTab]);



  const [submissions, setSubmissions] = useState([]);

  const [submissionTrigger, setSubmissionTrigger] = useState(0); // New state to trigger submission refresh

  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const [showSubmissionModal, setShowSubmissionModal] = useState(false);



  const { course: encCourse, subcourse: encSubcourse, questionId: encQuestionId } = useParams();

  const course = decodeShort(encCourse);

  const subcourse = decodeShort(encSubcourse);

  const questionId = decodeShort(encQuestionId);

  const { user } = useAuth();

  const navigate = useNavigate();



  // Refs for cleanup and debouncing

  const saveTimeoutRef = useRef(null);

  const editorRef = useRef(null);

  const resizeObserverRef = useRef(null);

  const layoutTimeoutRef = useRef(null);



  const sanitizeKey = (key) => {

    if (!key) return '';

    return key.replace(/[.#$/\[\]:]/g, '_');

  };



  const logSubmission = async (status, submittedCode) => {

    console.log("logging submission");

    console.log(user?.email);



    if (!user?.uid) return;



    const timestamp = new Date().toISOString();

    const safeCourse = sanitizeKey(course);

    const safeSubcourse = sanitizeKey(subcourse);

    const safeQuestionId = sanitizeKey(questionId);

    const safeTimestamp = sanitizeKey(timestamp);



    const path = `Submissions/${user.uid}/${safeCourse}/${safeSubcourse}/${safeQuestionId}/${safeTimestamp}`;



    try {



      await set(ref(database, path), {

        language: selectedLanguage,

        status,

        code: submittedCode,

      });

      console.log("Submission logged successfully.");

      setSubmissionTrigger(prev => prev + 1); // Trigger submission refresh

    } catch (error) {

      console.error("Error logging submission:", error);

    }

  };



  const handleSubmit2 = async () => {

    const testCases = questionData.testcases;

    const initialResults = testCases.map(tc => ({

      input: tc.input,

      expected: tc.expectedOutput,

      output: '',

      passed: false,

      status: 'running',

    }));



    console.log(initialResults);



    setTestResults(initialResults);

    setOutput(null);

    setActiveTab('output');

    setRunSubmit('submit');



    const updatedResults = [...initialResults];



    const promises = testCases.map(async (tc, i) => {

      const { input, expectedOutput } = tc;

      try {

        const sqlSourceCode = (questionData?.schema || "") + "\n\n" + code;

        const { run: result } = await executeCode('sql', sqlSourceCode, input);



        let currentResult;



        if (questionData.testcases[2]?.input === "regex2") {

          const regex = new RegExp(/^PID of example\.c = \d+\n[A-Za-z]{3} [A-Za-z]{3} +\d{1,2} \d{2}:\d{2}:\d{2} [A-Z]+ \d{4}\n?$/);

          currentResult = {

            input,

            expected: expectedOutput,

            output: result.output,

            passed: regex.test(result.output),

            status: 'done',

          };

        }

        else if (questionData.testcases[2]?.input === "regex") {

          const regex = new RegExp(/^Child => PPID: \d+, PID: \d+\nParent => PID: \d+\nWaiting for child process to finish\.\nChild process finished\.\n?$/);

          currentResult = {

            input,

            expected: expectedOutput,

            output: result.output,

            passed: regex.test(result.output),

            status: 'done',

          };

        }

        else {

          const resultlist = result.output ? result.output.split("\n") : ["No output received."];

          while (resultlist[resultlist.length - 1] === "") resultlist.pop();



          const expectedLines = expectedOutput.split("\n");

          while (expectedLines[expectedLines.length - 1] === "") expectedLines.pop();



          const passed = compareTableOutput(expectedOutput, result.output);



          currentResult = {

            input,

            expected: expectedOutput,

            output: result.output,

            passed,

            status: 'done',

          };

        }



        updatedResults[i] = currentResult;

        setTestResults([...updatedResults]);

        return currentResult;

      } catch (error) {

        console.error(`Error executing test case ${i + 1}:`, error);

        const errorResult = {

          input,

          expected: expectedOutput,

          output: error.message || 'Error',

          passed: false,

          status: 'done',

        };

        updatedResults[i] = errorResult;

        setTestResults([...updatedResults]);

        return errorResult;

      }

    });



    await Promise.all(promises);





    const allPassed = updatedResults.every(tc => tc.passed);

    await markProblemAsCompleted(allPassed);

    await logSubmission(allPassed ? 'correct' : 'wrong', code);

  };



  const markProblemAsCompleted = async (isCorrect) => {

    if (!user?.uid) return;



    try {

      const progressRef = ref(

        database,

        `userprogress/${user.uid}/${course}/${subcourse}/${questionId}`

      );



      await set(progressRef, isCorrect);

      console.log(`userprogress saved: ${questionId} = ${isCorrect}`);

      setIsCompleted(isCorrect);



      if (isCorrect) {

        setShowCompletionAnimation(true);

        setTimeout(() => {

          setShowCompletionAnimation(false);

        }, 3000);

      }

    } catch (error) {

      console.error("Error saving user progress:", error);

    }

  };



  const runCode = async () => {

    const testCases = testCasesrun;

    console.log('Running test cases:', testCases);



    try {

      // Initialize test results with 'running' status

      const initialResults = testCases.map(tc => ({

        input: tc.input || '',

        expected: tc.expectedOutput || '',

        output: '',

        passed: false,

        status: 'running',

        isFirstFailure: false

      }));



      setTestResults(initialResults);

      setOutput(null);

      setActiveTab('output');

      setRunSubmit('run');



      const updatedResults = [...initialResults];

      let firstFailureShown = false;



      const promises = testCases.map(async (tc, i) => {

        const { input: testInput, expectedOutput } = tc;

        try {

          const sqlSourceCode = (questionData?.schema || "") + "\n\n" + code;

          const { run: result } = await executeCode('sql', sqlSourceCode, testInput);



          let currentResult;



          if (questionData.testcases[2]?.input === "regex2") {

            const regex = new RegExp(/^PID of example\.c = \d+\n[A-Za-z]{3} [A-Za-z]{3} +\d{1,2} \d{2}:\d{2}:\d{2} [A-Z]+ \d{4}\n?$/);

            currentResult = {

              input: testInput,

              expected: expectedOutput,

              output: result.output,

              passed: regex.test(result.output),

              status: 'done',

              isFirstFailure: false

            };

          }

          else if (questionData.testcases[2]?.input === "regex") {

            const regex = new RegExp(/^Child => PPID: \d+, PID: \d+\nParent => PID: \d+\nWaiting for child process to finish\.\nChild process finished\.\n?$/);

            currentResult = {

              input: testInput,

              expected: expectedOutput,

              output: result.output,

              passed: regex.test(result.output),

              status: 'done',

              isFirstFailure: false

            };

          }

          else {

            const resultOutput = result.output || '';

            const resultLines = resultOutput ? resultOutput.split("\n").filter(line => line !== '') : [];

            const expectedLines = expectedOutput ? expectedOutput.split("\n").filter(line => line !== '') : [];



            const passed = compareTableOutput(expectedOutput, resultOutput);



            currentResult = {

              input: testInput,

              expected: expectedOutput,

              output: resultOutput,

              passed,

              status: 'done',

              isFirstFailure: false

            };

          }



          updatedResults[i] = currentResult;

          setTestResults([...updatedResults]);

          return currentResult;

        } catch (error) {

          console.error(`Error executing test case ${i + 1}:`, error);

          const errorResult = {

            input: testInput,

            expected: expectedOutput || '',

            output: error.message || 'Error executing code',

            passed: false,

            status: 'done',

            isFirstFailure: false

          };

          updatedResults[i] = errorResult;

          setTestResults([...updatedResults]);

          return errorResult;

        }

      });



      await Promise.all(promises);



      // Handle first failure expansion after all parallel tests finish

      let firstFailureIndex = -1;

      for (let i = 0; i < updatedResults.length; i++) {

        if (!updatedResults[i].passed) {

          firstFailureIndex = i;

          break;

        }

      }



      if (firstFailureIndex !== -1) {

        updatedResults[firstFailureIndex].isFirstFailure = true;

        setTestCaseTab(firstFailureIndex);

        setTestResults([...updatedResults]);

      }

    } catch (error) {

      console.error("Error during test cases:", error);

      setTestResults([{

        input: '',

        expected: '',

        output: error.message || 'Error executing test cases',

        passed: false,

        status: 'done',

        isFirstFailure: true

      }]);

    }

  };



  const copySubmissionToEditor = (submission) => {

    if (!submission) return;



    try {

      setCode(submission.code);

      setSelectedLanguage(submission.language);

      setShowSubmissionModal(false);

      setActiveTab('description');

    } catch (error) {

      console.error('Error copying submission to editor:', error);

    }

  };



  const loadCode = useCallback(async () => {

    try {

      const dbRef = ref(database);

      const codeKey = `savedCode/${user.uid}/${course}/${questionId}/${selectedLanguage}`;

      const snapshot = await get(child(dbRef, codeKey));



      console.log(snapshot.val());



      if (snapshot.exists()) {

        const savedCode = snapshot.val();

        setCode(savedCode);

        console.log("Code loaded successfully!");

      } else {

        setCode(languageTemplates[selectedLanguage] || "");

        console.log("No saved code found, using default template");

      }

    } catch (error) {

      console.error("Error loading code:", error);

      setCode(languageTemplates[selectedLanguage] || "");

    }

  }, [course, questionId, selectedLanguage]);



  const saveCode = useCallback(async (codeToSave) => {

    try {

      const codeKey = `savedCode/${user.uid}/${course}/${questionId}/${selectedLanguage}`;

      const dbRef = ref(database, codeKey);

      await set(dbRef, codeToSave);

      console.log("Code auto-saved successfully!");

    } catch (error) {

      console.error("Error saving code:", error);

    }

  }, [course, questionId, selectedLanguage]);



  // Fetch submissions

  useEffect(() => {

    const fetchSubmissions = async () => {

      if (!user?.uid || !course || !subcourse || !questionId) return;



      const safeCourse = sanitizeKey(course);

      const safeSubcourse = sanitizeKey(subcourse);

      const safeQuestionId = sanitizeKey(questionId);



      const path = `Submissions/${user.uid}/${safeCourse}/${safeSubcourse}/${safeQuestionId}`;

      const snapshot = await get(ref(database, path));



      if (snapshot.exists()) {

        const data = snapshot.val();

        const parsed = Object.entries(data).map(([timestamp, entry]) => ({

          timestamp,

          ...entry,

        }));

        setSubmissions(parsed.reverse());

      } else {

        setSubmissions([]);

      }

    };



    fetchSubmissions();

  }, [user, course, subcourse, questionId, submissionTrigger]); // Added submissionTrigger as dependency



  const handleCodeChange = useCallback((newValue) => {

    setCode(newValue);



    if (saveTimeoutRef.current) {

      clearTimeout(saveTimeoutRef.current);

    }



    saveTimeoutRef.current = setTimeout(() => {

      saveCode(newValue);

    }, 500);

  }, [saveCode]);







  // Load code when component mounts or language changes

  useEffect(() => {

    if (questionData) {

      loadCode();

    }

  }, [loadCode, questionData, selectedLanguage]);







  // Fetch question data from Firebase

  useEffect(() => {

    const fetchData = async () => {

      try {

        console.log(`AlgoCore/${String(course).replace(" ", "")}/${subcourse}/${questionId}`)

        const questionRef = ref(database, `questions/${questionId}`);



        const [questionSnapshot] = await Promise.all([

          get(questionRef),

        ]);



        if (questionSnapshot.exists()) {

          const question = questionSnapshot.val();

          console.log('question', question.type)



          const testCases = [

            { input: question?.testcases[0]?.input, expectedOutput: question?.testcases[0]?.expectedOutput },

            ...(question?.testcases[1]?.expectedOutput

              ? [{ input: question?.testcases[1]?.input, expectedOutput: question?.testcases[1]?.expectedOutput }]

              : [])

          ];



          setTestCases(testCases);





          console.log(question);

          setQuestionData(question);



          // Fetch completion status

          if (user?.uid) {

            const progressRef = ref(

              database,

              `userprogress/${user.uid}/${course}/${subcourse}/${questionId}`

            );

            const progressSnapshot = await get(progressRef);

            setIsCompleted(progressSnapshot.exists() && progressSnapshot.val() === true);

          }

        }

      } catch (error) {

        console.error("Error fetching data from Firebase:", error);

      }

    };



    fetchData();

    loadCode();



  }, [questionId, user]);



  // Reset active tab to description when question changes

  useEffect(() => {

    setActiveTab('description');

  }, [questionId]);



  // Clear output and test results when question changes

  useEffect(() => {

    setOutput(null);

    setTestResults([]);

    setRunSubmit('none');

  }, [questionId]);



  // Fixed Monaco Editor layout handling

  const handleEditorDidMount = useCallback((editor, monaco) => {

    registerIntelliSense(editor, monaco);

    editorRef.current = editor;



    // Clean up previous observer

    if (resizeObserverRef.current) {

      resizeObserverRef.current.disconnect();

    }



    // Completely disable copy command

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {

      return false;

    });



    // Completely disable paste command

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {

      return false;

    });



    // Completely disable cut command

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX, () => {

      return false;

    });



    // Completely disable Shift+Insert paste

    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Insert, () => {

      return false;

    });



    // Disable context menu and right-click

    editor.updateOptions({

      contextmenu: false,

    });



    // Prevent right-click context menu

    const editorElement = editor.getDomNode();

    if (editorElement) {

      editorElement.addEventListener('contextmenu', (e) => {

        e.preventDefault();

        e.stopPropagation();

        return false;

      }, true);



      // Prevent selection copy

      editorElement.addEventListener('copy', (e) => {

        e.preventDefault();

        e.stopPropagation();

        return false;

      }, true);



      // Prevent paste

      editorElement.addEventListener('paste', (e) => {

        e.preventDefault();

        e.stopPropagation();

        return false;

      }, true);



      // Prevent cut

      editorElement.addEventListener('cut', (e) => {

        e.preventDefault();

        e.stopPropagation();

        return false;

      }, true);



      // Prevent drag and drop

      editorElement.addEventListener('drop', (e) => {

        e.preventDefault();

        e.stopPropagation();

        return false;

      }, true);



      editorElement.addEventListener('dragover', (e) => {

        e.preventDefault();

        e.stopPropagation();

        return false;

      }, true);

    }





    // 🚫 2. Remove Paste from Right-Click Menu

    editor.updateOptions({

      contextmenu: false, // Disables right-click menu

    });



    // 🚫 3. Block Clipboard Events (Prevents extensions & force-paste)

    const blockPaste = (event) => {

      event.preventDefault();

      alert("Pasting is completely disabled!");

    };







    // Create new ResizeObserver with proper error handling

    resizeObserverRef.current = new ResizeObserver((entries) => {

      // Clear any existing timeout

      if (layoutTimeoutRef.current) {

        clearTimeout(layoutTimeoutRef.current);

      }



      // Use setTimeout to prevent ResizeObserver loop

      layoutTimeoutRef.current = setTimeout(() => {

        try {

          if (editorRef.current && !editorRef.current.isDisposed()) {

            editorRef.current.layout();

          }

        } catch (error) {

          // Silently handle disposed editor errors

          console.warn('Editor layout error:', error);

        }

      }, 0);

    });



    // Observe the editor container

    const container = editor.getContainerDomNode();

    if (container) {

      resizeObserverRef.current.observe(container);

    }

  }, []);



  // Update language when monacoLanguage changes

  useEffect(() => {

    if (!editorRef.current || !monacoRef.current) return;



    const model = editorRef.current.getModel();

    if (!model) return;



    monacoRef.current.editor.setModelLanguage(model, 'sql');

  }, []);



  // Handle panel width changes

  useEffect(() => {

    if (layoutTimeoutRef.current) {

      clearTimeout(layoutTimeoutRef.current);

    }



    layoutTimeoutRef.current = setTimeout(() => {

      if (editorRef.current && !editorRef.current.isDisposed()) {

        try {

          editorRef.current.layout();

        } catch (error) {

          console.warn('Editor layout error:', error);

        }

      }

    }, 100);

  }, [leftPanelWidth]);



  // Cleanup on unmount

  useEffect(() => {

    return () => {

      if (saveTimeoutRef.current) {

        clearTimeout(saveTimeoutRef.current);

      }

      if (layoutTimeoutRef.current) {

        clearTimeout(layoutTimeoutRef.current);

      }

      if (resizeObserverRef.current) {

        resizeObserverRef.current.disconnect();

      }

    };

  }, []);



  // Panel resize handlers

  const handleMouseDown = useCallback((e) => {

    setIsDragging(true);

    e.preventDefault();

  }, []);



  const handleMouseMove = useCallback((e) => {

    if (!isDragging) return;

    const container = document.body;

    const rect = container.getBoundingClientRect();

    const x = e.touches ? e.touches[0].clientX : e.clientX;

    let newLeftWidth = ((x - rect.left) / rect.width) * 100;

    newLeftWidth = Math.max(18, Math.min(70, newLeftWidth));

    setLeftPanelWidth(newLeftWidth);

  }, [isDragging]);



  const handleMouseUp = useCallback(() => {

    setIsDragging(false);

  }, []);



  useEffect(() => {

    if (isDragging) {

      window.addEventListener('mousemove', handleMouseMove);

      window.addEventListener('mouseup', handleMouseUp);

      document.body.style.cursor = 'col-resize';

      document.body.style.userSelect = 'none';

    } else {

      window.removeEventListener('mousemove', handleMouseMove);

      window.removeEventListener('mouseup', handleMouseUp);

      document.body.style.cursor = '';

      document.body.style.userSelect = '';

    }



    return () => {

      window.removeEventListener('mousemove', handleMouseMove);

      window.removeEventListener('mouseup', handleMouseUp);

      document.body.style.cursor = '';

      document.body.style.userSelect = '';

    };

  }, [isDragging, handleMouseMove, handleMouseUp]);



  useEffect(() => {

    const fetchCourseData = async () => {

      try {

        const dbRef = ref(database);

        const snapshot = await get(child(dbRef, `/AlgoCore/${course}`));



        if (snapshot.exists()) {

          setCourseData(snapshot.val());

        } else {

          console.warn("No course data found in Firebase.");

        }

      } catch (error) {

        console.error("Error fetching course data:", error);

      }

    };



    fetchCourseData();

  }, [course]);



  return (

    <>

      {/* Completion Animation */}

      <CompletionAnimation isVisible={showCompletionAnimation} onClose={() => setShowCompletionAnimation(false)} />

      <div className="h-[calc(100vh-4rem)] w-full flex bg-white dark:bg-dark-primary select-none overflow-hidden">      {/* Left Panel */}

        <div

          className="bg-white dark:bg-dark-secondary border-r border-gray-200 dark:border-dark-tertiary flex flex-col overflow-hidden h-full"

          style={{ width: `${leftPanelWidth}%` }}

        >

          <div className="flex whitespace-nowrap border-b border-gray-200 dark:border-dark-tertiary overflow-x-auto">

            <button

              className={`px-4 py-3 text-sm font-medium ${activeTab === 'description' ? 'text-[#4285F4] border-b-2 border-[#4285F4]' : 'text-gray-600 dark:text-gray-400 hover:text-[#4285F4] dark:hover:text-white'

                }`}

              onClick={() => setActiveTab('description')}

            >

              <div className="flex items-center gap-2">

                <Icons.FileText />

                Description

              </div>

            </button>

            <button

              className={`px-4 py-3 text-sm font-medium ${activeTab === 'tables' ? 'text-[#4285F4] border-b-2 border-[#4285F4]' : 'text-gray-600 dark:text-gray-400 hover:text-[#4285F4] dark:hover:text-white'

                }`}

              onClick={() => setActiveTab('tables')}

            >

              <div className="flex items-center gap-2">

                <Icons.Database />

                Tables

              </div>

            </button>

            <button

              className={`px-4 py-3 text-sm font-medium ${activeTab === 'testcases' ? 'text-[#4285F4] border-b-2 border-[#4285F4]' : 'text-gray-600 dark:text-gray-400 hover:text-[#4285F4] dark:hover:text-white'

                }`}

              onClick={() => setActiveTab('testcases')}

            >

              <div className="flex items-center gap-2">

                <Icons.Code2 />

                Test Cases

              </div>

            </button>

            <button

              className={`px-4 py-3 text-sm font-medium ${activeTab === 'output' ? 'text-[#4285F4] border-b-2 border-[#4285F4]' : 'text-gray-600 dark:text-gray-400 hover:text-[#4285F4] dark:hover:text-white'

                }`}

              onClick={() => setActiveTab('output')}

            >

              <div className="flex items-center gap-2">

                <Icons.Terminal />

                Output

              </div>

            </button>

            <button

              className={`px-4 py-3 text-sm font-medium ${activeTab === 'submissions' ? 'text-[#4285F4] border-b-2 border-[#4285F4]' : 'text-gray-600 dark:text-gray-400 hover:text-[#4285F4] dark:hover:text-white'}`}

              onClick={() => setActiveTab('submissions')}

            >

              <div className="flex items-center gap-2">

                <Icons.Clock />

                Submissions

              </div>

            </button>

            {/* <button

            className={`px-4 py-3 text-sm font-medium ${activeTab === 'suggestions' ? 'text-[#4285F4] border-b-2 border-[#4285F4]' : 'text-gray-600 dark:text-gray-400 hover:text-[#4285F4] dark:hover:text-white'}`}

            onClick={() => setActiveTab('suggestions')}

          >

            <div className="flex items-center gap-2">

              <Icons.Play />

              AI Suggestions

            </div>

          </button> */}

          </div>



          <div className="p-6 flex-1 min-h-0 overflow-auto h-full">

            {activeTab === 'description' && (

              <div className="text-gray-700 dark:text-gray-400">

                <div className="mb-6">

                  <div className="flex items-center gap-3">

                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white break-words">{String(questionData?.questionname)}</h1>

                    {isCompleted && (

                      <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">

                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />

                      </svg>

                    )}

                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-2">

                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${questionData?.difficulty === 'Hard' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'

                      : questionData?.difficulty === 'Medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'

                        : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'

                      }`}>{questionData?.difficulty || 'Easy'}</span>

                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium flex items-center gap-1">

                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16" /></svg>

                      SQL

                    </span>

                  </div>

                </div>



                <div className="space-y-4">

                  <p className="break-words leading-relaxed">

                    {questionData?.question}

                  </p>



                  {/* Schema Section */}

                  {questionData?.schema && (

                    <div className="mt-6">

                      <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">

                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z" />

                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16" />

                        </svg>

                        Database Schema

                      </h2>

                      <SqlSchemaDisplay schema={questionData.schema} />

                    </div>

                  )}



                  {/* Example using table format */}

                  <div className="mt-6">

                    <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">

                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />

                      </svg>

                      Expected Output

                    </h2>

                    {questionData?.testcases?.[0]?.expectedOutput ? (

                      questionData.testcases[0].expectedOutput.includes('|') ? (

                        (() => {

                          const schemaColumns = getColumnsFromSchema(questionData.schema);

                          const firstTableColumns = Object.values(schemaColumns)[0] || null;

                          return (

                            <SqlResultTable

                              text={questionData.testcases[0].expectedOutput}

                              className="border-green-200 dark:border-green-800"

                              columns={questionData.testcases[0].expectedColumns || firstTableColumns}

                            />

                          );

                        })()

                      ) : (

                        <pre className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg font-mono whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200 border border-green-200 dark:border-green-800">

                          {questionData.testcases[0].expectedOutput}

                        </pre>

                      )

                    ) : questionData?.Example?.[0]?.includes('|') ? (

                      <div>

                        <SqlResultTable text={questionData.Example[0].split('Output:')[1]?.trim() || questionData.Example[0]} />

                      </div>

                    ) : (

                      <pre className="bg-gray-50 dark:bg-dark-secondary p-4 rounded-lg font-mono whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">

                        {questionData?.Example?.[0]}

                      </pre>

                    )}

                  </div>



                  {questionData?.Example?.[1] && (

                    <div className="mt-6">

                      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Example 2:</h2>

                      {questionData.Example[1].includes('|') ? (

                        <SqlResultTable text={questionData.Example[1].split('Output:')[1]?.trim() || questionData.Example[1]} />

                      ) : (

                        <pre className="bg-gray-50 dark:bg-dark-secondary p-4 rounded-lg font-mono whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">

                          {questionData.Example[1]}

                        </pre>

                      )}

                    </div>

                  )}



                  {questionData?.constraints && questionData.constraints.length > 0 && (

                    <div className="mt-6">

                      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Constraints:</h2>

                      <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-400">

                        {questionData.constraints.filter(Boolean).map((c, i) => (

                          <li key={i}>{c}</li>

                        ))}

                      </ul>

                    </div>

                  )}







                  {/* Report Issue Button below Description */}
                  {navigation?.setShowReportModal && (
                    <div className="mt-8 flex justify-end">
                      <button
                        onClick={() => navigation.setShowReportModal(true)}
                        className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-medium transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                        Report Issue
                      </button>
                    </div>
                  )}
                </div>

              </div>

            )}



            {activeTab === 'tables' && (

              <div className="text-gray-700 dark:text-gray-400">

                {questionData?.schema ? (

                  <div>

                    <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">

                      <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />

                      </svg>

                      Database Tables

                    </h2>

                    <SqlTablesDisplay schema={questionData.schema} />

                  </div>

                ) : (

                  <p className="text-gray-500 dark:text-gray-400">No schema data available</p>

                )}

              </div>

            )}



            {activeTab === 'testcases' && (



              <div className="space-y-6">



                {

                  (questionData?.testcases?.length >= 3 && questionData?.testcases?.[2].input === "regex") ?

                    (

                      <h1>No input</h1>

                    )

                    :

                    (





                      <div>

                        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white"> Manual Test Cases </h3>

                        <div className="flex items-center gap-2 mb-4">

                          {testCasesrun.map((_, idx) => (

                            <button

                              key={idx}

                              className={`px-4 py-2 rounded-t-lg font-medium border-b-2 transition-colors duration-150 focus:outline-none ${testCaseTab === idx ? 'border-[#4285F4] text-[#4285F4] bg-white dark:bg-dark-secondary' : 'border-transparent text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-dark-tertiary hover:text-[#4285F4]'

                                }`}

                              onClick={() => setTestCaseTab(idx)}

                            >

                              Case {idx + 1}

                            </button>

                          ))}

                          <button

                            className="ml-2 px-3 py-2 rounded-full bg-[#4285F4] text-white hover:bg-[#357ae8] text-lg font-bold"

                            onClick={() => {

                              setTestCases([...testCasesrun, { input: '', expectedOutput: '' }]);

                              setTestCaseTab(testCasesrun.length);

                            }}

                          >

                            +

                          </button>

                        </div>

                        <div className="bg-gray-50 dark:bg-dark-secondary rounded-lg p-4 mb-4">

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <div>

                              <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">Input</label>

                              <textarea

                                ref={inputRef}

                                className="w-full p-2 border border-gray-300 dark:border-dark-tertiary rounded-md bg-white dark:bg-dark-secondary text-gray-900 dark:text-white font-mono text-base min-h-[80px] resize-y"

                                value={testCasesrun[testCaseTab]?.input || ''}

                                onChange={e => {

                                  const updated = [...testCasesrun];

                                  updated[testCaseTab].input = e.target.value;

                                  setTestCases(updated);

                                  // Force update height after state update

                                  requestAnimationFrame(() => {

                                    adjustTextareaHeight(e.target);

                                  });

                                }}

                                onInput={e => adjustTextareaHeight(e.target)}

                                placeholder="Enter input (supports multiple lines)"

                                rows={1}

                                style={{ minHeight: '40px', maxHeight: '200px', overflowY: 'auto' }}

                              />

                            </div>

                            <div>

                              <label className="block text-gray-700 dark:text-gray-300 mb-1 font-medium">Expected Output</label>

                              <textarea

                                ref={outputRef}

                                className="w-full p-2 border border-gray-300 dark:border-dark-tertiary rounded-md bg-white dark:bg-dark-secondary text-gray-900 dark:text-white font-mono text-base min-h-[80px] resize-y"

                                value={testCasesrun[testCaseTab]?.expectedOutput || ''}

                                onChange={e => {

                                  const updated = [...testCasesrun];

                                  updated[testCaseTab].expectedOutput = e.target.value;

                                  setTestCases(updated);

                                  // Force update height after state update

                                  requestAnimationFrame(() => {

                                    adjustTextareaHeight(e.target);

                                  });

                                }}

                                onInput={e => adjustTextareaHeight(e.target)}

                                placeholder="Enter expected output (supports multiple lines)"

                                rows={1}

                                style={{ minHeight: '40px', maxHeight: '200px', overflowY: 'auto' }}

                              />

                            </div>

                          </div>

                          {testCasesrun[testCaseTab]?.expectedOutput && testCasesrun[testCaseTab].expectedOutput.includes('|') && (

                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">

                              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Preview:</p>

                              {(() => {

                                const schemaColumns = getColumnsFromSchema(questionData?.schema);

                                const firstTableColumns = Object.values(schemaColumns)[0] || null;

                                const expectedSchema = questionData.testcases[0].expectedColumns || firstTableColumns;

                                console.log('Rendering expected output preview with columns:', questionData);

                                return (

                                  <SqlResultTable

                                    text={testCasesrun[testCaseTab].expectedOutput}

                                    className="border-blue-200 dark:border-blue-900"

                                    columns={expectedSchema || firstTableColumns}

                                  />

                                );

                              })()}

                            </div>

                          )}

                          <div className="flex justify-end mt-4">

                            <button

                              className="text-red-500 hover:text-red-700 font-medium"

                              onClick={() => {

                                const updated = testCasesrun.filter((_, idx) => idx !== testCaseTab);

                                setTestCases(updated.length ? updated : [{ input: '', expectedOutput: '' }]);

                                setTestCaseTab(prev => Math.max(0, prev - 1));

                              }}

                              disabled={testCasesrun.length <= 1}

                              title="Delete this test case"

                            >

                              Delete Case

                            </button>

                          </div>

                        </div>

                      </div>

                    )

                }

              </div>

            )}



            {activeTab === 'output' && (

              <div className="py-8 px-6">

                {output ? (

                  <div className="space-y-4">

                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">

                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />

                      </svg>

                      Output

                    </h2>

                    {console.log('Output displayed:', output)}

                    <div className="w-full">

                      <SqlResultTable text={output} className="border-blue-200 dark:border-blue-800 w-full" columns={null} />

                    </div>

                  </div>

                ) : testResults.length > 0 && testResults.every(t => t.status === 'done') ? (

                  <SqlAnimatedTestResults testResults={testResults} runsubmit={runsubmit} schema={questionData?.schema} questionData={questionData} code={code} />

                ) : (

                  <AnimatedTestResults testResults={testResults} runsubmit={runsubmit} />

                )}

                <GoogleAd className="mt-8" />

              </div>

            )}



            {activeTab === 'submissions' && (

              <div className="space-y-4">

                {submissions.length === 0 ? (

                  <p className="text-gray-600 dark:text-gray-300">No submissions yet for this question.</p>

                ) : (

                  <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-tertiary">

                    <thead>

                      <tr>

                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>

                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Language</th>

                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>

                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-gray-200 dark:divide-dark-tertiary">

                      {submissions.map((s, idx) => (

                        <tr key={idx}>

                          <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">

                            {(() => {

                              const fixed = s.timestamp.replace(/T(\d{2})_(\d{2})_(\d{2})_(\d{3})Z/, 'T$1:$2:$3.$4Z');

                              const date = new Date(fixed);

                              return isNaN(date.getTime())

                                ? 'N/A'

                                : date.toLocaleString('en-US', {

                                  year: 'numeric',

                                  month: 'short',

                                  day: 'numeric',

                                  hour: '2-digit',

                                  minute: '2-digit',

                                  second: '2-digit',

                                });

                            })()}

                          </td>

                          <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">

                            {s.language}

                          </td>

                          <td className={`px-4 py-2 text-sm font-medium ${s.status === 'correct' ? 'text-green-600' : 'text-red-500'}`}>

                            {s.status}

                          </td>

                          <td className="px-4 py-2 text-sm space-x-2">

                            <button

                              onClick={() => {

                                setSelectedSubmission(s);

                                setShowSubmissionModal(true);

                              }}

                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"

                            >

                              View

                            </button>

                            {/* <button

                              onClick={() => copySubmissionToEditor(s)}

                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"

                            >

                              Copy to Editor

                            </button> */}

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                )}

              </div>

            )}



          </div>

        </div>



        {/* Draggable Divider */}

        <div

          className={`w-1 bg-gray-200 dark:bg-dark-tertiary hover:bg-[#4285F4] cursor-col-resize flex items-center justify-center group transition-colors duration-150 ${isDragging ? 'bg-[#4285F4]' : ''}`}

          onMouseDown={handleMouseDown}

          style={{ zIndex: 10 }}

        >

          <Icons.GripVertical

            size={16}

            className="text-gray-400 group-hover:text-[#4285F4] opacity-0 group-hover:opacity-100"

          />

        </div>



        {/* Right Panel (Code Editor) */}

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          <div className="bg-white dark:bg-dark-secondary border-t border-gray-200 dark:border-dark-tertiary p-2 flex justify-end gap-6 flex-shrink-0">

            <div className="flex items-center gap-4">

              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">SQLite</span>

              <button

                onClick={() => setCode('')}

                title="Reset to initial code"

                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-md flex items-center gap-1 text-xs transition-colors duration-150"

              >

                <Icons.History className="w-3 h-3" />

                Reset

              </button>

            </div>

            <div className="flex items-center gap-2">

              <button

                onClick={runCode}

                className="bg-[#4285F4] hover:bg-[#4285F4]/90 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors duration-150"

              >

                <Icons.Play className="w-5 h-5" />

                Run Code

              </button>



              <button

                onClick={handleSubmit2}

                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors duration-150"

              >

                <Icons.ChevronRight className="w-5 h-5" />

                Submit

              </button>





            </div>

          </div>

          <div className="flex-1 bg-white dark:bg-gray-900 min-w-0 overflow-hidden">

            <Editor

              height="100%"

              defaultLanguage="sql"

              language="sql"

              theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}

              value={code}

              onChange={handleCodeChange}

              onMount={handleEditorDidMount}

              options={{

                ...INTELLISENSE_OPTIONS,

                minimap: { enabled: false },

                fontSize: 14,

                lineNumbers: 'on',

                roundedSelection: false,

                scrollBeyondLastLine: false,

                automaticLayout: true,

                wordWrap: 'on',

                tabSize: 2,

                dragAndDrop: true,

                formatOnPaste: true,

                formatOnType: true,

              }}

            />

          </div>

        </div>







        {showSubmissionModal && selectedSubmission && (

          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">

            <div className="bg-white dark:bg-dark-secondary rounded-lg shadow-lg max-w-2xl w-full max-h-96 flex flex-col">

              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-dark-tertiary">

                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Query</h2>

                <button

                  onClick={() => setShowSubmissionModal(false)}

                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"

                >

                  ✕

                </button>

              </div>



              <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">

                <div className="mb-4">

                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">

                    Language: <span className="font-bold text-blue-600 dark:text-blue-400">{selectedSubmission.language}</span>

                  </label>

                </div>



                <div className="mb-4">

                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">

                    Status: <span className={`font-bold ${selectedSubmission.status === 'correct' ? 'text-green-600' : 'text-red-600'}`}>{selectedSubmission.status}</span>

                  </label>

                </div>



                <div className="bg-gray-800 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto">

                  <pre className="text-gray-100 text-sm font-mono whitespace-pre-wrap break-words">

                    {selectedSubmission.code}

                  </pre>

                </div>

              </div>



              <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-dark-tertiary">

                <button

                  onClick={() => copySubmissionToEditor(selectedSubmission)}

                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium transition-colors"

                >

                  Copy to Editor

                </button>

                <button

                  onClick={() => {

                    navigator.clipboard.writeText(selectedSubmission.code).then(() => {

                      const toast = document.createElement('div');

                      toast.textContent = 'Query copied to clipboard';

                      toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded';

                      document.body.appendChild(toast);

                      setTimeout(() => toast.remove(), 3000);

                    });

                  }}

                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium transition-colors"

                >

                  Copy Query

                </button>

              </div>

            </div>

          </div>

        )}



        <ToastContainer />

      </div>

    </>

  );

};



export default SqlPage;























