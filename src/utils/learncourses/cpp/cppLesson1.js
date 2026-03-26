export const cppLesson1 = {
  id: 1,
  title: 'C++ Architecture & Basics',
  description: 'Getting started with high-performance execution.',
  difficulty: 'Beginner',
  duration: '9 mins',
  content: `
## Welcome to C++

C++ is a high-performance, statically typed, compiled programming language. Developed by Bjarne Stroustrup as an extension to C, it provides object-oriented programming (OOP) and generic programming capabilities while operating incredibly close to the hardware.

### Compilation Process
Unlike Python or Java, C++ compiles directly down to native machine code.
1. **Preprocessing**: Resolves \`#include\` and \`#define\` macros.
2. **Compilation**: Converts syntax to Assembly instructions.
3. **Assembly**: Translates Assembly to Machine Code (Object file \`.o\`).
4. **Linking**: Combines various Object files and libraries into the final \`.exe\` or \`.out\` executable.

### Hello World Example
\`\`\`cpp
// Preprocessor directive to include the Standard IO Stream library
#include <iostream>

// Standard namespace wrapper prevents name collisions
using namespace std;

// Execution starts here
int main() {
    // console out (cout) with stream insertion operator (<<)
    cout << "Hello, World!" << endl;
    
    // Return 0 indicates successful execution to the OS
    return 0;
}
\`\`\`

### Data Types
C++ provides extremely granular control over data types and memory footprints:
- **int**: Standard integers (Usually 4 bytes)
- **long long**: Enormous integers (8 bytes)
- **float**: Decimals (4 bytes)
- **double**: High precision decimals (8 bytes)
- **char**: Single characters (1 byte)
- **bool**: Boolean values (1 byte)
\`\`\`cpp
int age = 22;
double pi = 3.14159;
char grade = 'A';
bool is_active = true;
\`\`\`
`
};