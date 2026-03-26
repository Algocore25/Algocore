export const cppLesson2 = {
  id: 2,
  title: 'Control Flow',
  description: 'C++ If-statements, Loops, and Structs.',
  content: `
## Control Flow in C++

C++ control structures define the flow of execution in your application. They are practically identical to Java and C.

### Conditionals
\`\`\`cpp
int age = 18;

if (age < 18) {
    cout << "Minor" << endl;
} else if (age == 18) {
    cout << "Just became an adult!" << endl;
} else {
    cout << "Adult" << endl;
}
\`\`\`

### Switch Statements
Extremely fast lookups used alongside \`int\`, \`char\`, and \`enum\`.
\`\`\`cpp
char rank = 'B';
switch(rank) {
    case 'A': cout << "Excellent"; break;
    case 'B': cout << "Good"; break;
    case 'C': cout << "Average"; break;
    default: cout << "Invalid rank";
}
\`\`\`

### Loops
**For Loop:** (Perfect for iteration)
\`\`\`cpp
for(int i = 0; i < 5; i++) {
    cout << i << " ";
}
\`\`\`

**While Loop:** (Perfect for truth-conditions)
\`\`\`cpp
int count = 10;
while(count > 0) {
    cout << count << endl;
    count--;
}
\`\`\`

### Structs (Precursor to objects)
Used to package a group of disparate variables into a single conceptual package.
\`\`\`cpp
struct Person {
    string name;
    int age;
    double height;
};

int main() {
    Person p1;
    p1.name = "Alice";
    p1.age = 22;
    p1.height = 1.70;
}
\`\`\`
`
};