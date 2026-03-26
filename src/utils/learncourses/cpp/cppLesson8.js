export const cppLesson8 = {
  id: 8,
  title: 'File I/O in C++',
  description: 'Reading from and writing to files using fstream.',
  content: `
## File Input/Output in C++

C++ uses the \`fstream\` library to work with files. Three key classes:
- \`ofstream\`: Write to files (Output File Stream)
- \`ifstream\`: Read from files (Input File Stream)
- \`fstream\`: Both read and write

### Writing to a File:
\`\`\`cpp
#include <iostream>
#include <fstream>
#include <string>
using namespace std;

int main() {
    // Open file for writing
    ofstream outFile("students.txt");
    
    if (!outFile.is_open()) {
        cerr << "Error: Cannot open file!" << endl;
        return 1;
    }
    
    // Write data
    outFile << "Alice,22,Computer Science" << endl;
    outFile << "Bob,21,Mathematics" << endl;
    outFile << "Charlie,23,Physics" << endl;
    
    outFile.close();  // Always close!
    cout << "Data written successfully." << endl;
    
    return 0;
}
\`\`\`

### Reading from a File:
\`\`\`cpp
#include <iostream>
#include <fstream>
#include <string>
using namespace std;

int main() {
    ifstream inFile("students.txt");
    
    if (!inFile) {
        cerr << "Error: File not found!" << endl;
        return 1;
    }
    
    string line;
    cout << "=== Student Records ===" << endl;
    while (getline(inFile, line)) {
        cout << line << endl;
    }
    
    inFile.close();
    return 0;
}
\`\`\`

### Reading Structured Data (CSV parsing):
<COMPILER>
#include <iostream>
#include <sstream>
#include <string>
using namespace std;

// Simulate parsing a CSV line
void parseCSVLine(const string& line) {
    stringstream ss(line);
    string token;
    int colNum = 0;
    
    string fields[] = {"Name", "Age", "Department"};
    
    while (getline(ss, token, ',')) {
        cout << fields[colNum++] << ": " << token << endl;
    }
    cout << "---" << endl;
}

int main() {
    string csvData[] = {
        "Alice,22,Computer Science",
        "Bob,21,Mathematics",
        "Charlie,23,Physics"
    };
    
    for (const string& line : csvData) {
        parseCSVLine(line);
    }
    
    return 0;
}
</COMPILER>
`
};