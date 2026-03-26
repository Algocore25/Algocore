export const cppLesson5 = {
  id: 5,
  title: 'Standard Template Library (STL)',
  description: 'Using vectors, maps, and algorithms out of the box.',
  content: `
## The Standard Template Library (STL)

Programming in C++ entirely from scratch is a massive undertaking. The STL provides immensely optimized versions of common data structures and algorithms using Template syntax.

### \`std::vector\` (Dynamic Array)
The bread and butter array type of modern C++.
\`\`\`cpp
#include <vector>
#include <iostream>

using namespace std;

int main() {
    vector<int> numbers;
    
    numbers.push_back(10); // Append
    numbers.push_back(20);
    numbers.push_back(30);
    
    cout << "Size: " << numbers.size() << endl; // 3
    
    // Fast array-iteration accessing
    for (int num : numbers) {
        cout << num << endl;
    }
    
    numbers.pop_back(); // Removes last element
}
\`\`\`

### \`std::map\` and \`std::set\`
\`map\` is a dictionary (Red-Black tree under the hood). \`set\` is an ordered set of unique items.
\`\`\`cpp
#include <map>
#include <string>

map<string, int> ages;
ages["Alice"] = 25;
ages["Bob"] = 30;

cout << "Alice is " << ages["Alice"];

// Iteration requires an iterator
for (auto const& pair : ages) {
    cout << pair.first << ": " << pair.second << endl;
}
\`\`\`

### STL Algorithms
The \`<algorithm>\` header has dozens of highly-optimized mathematical manipulation options.
\`\`\`cpp
#include <algorithm>
#include <vector>

vector<int> v = {5, 2, 8, 1, 9};

// O(N*logN) Sort!
sort(v.begin(), v.end()); // {1, 2, 5, 8, 9}

// Reverse
reverse(v.begin(), v.end());

// Iterative find
auto it = find(v.begin(), v.end(), 8);

// Pointer arithmetic to get index
if (it != v.end()) {
    cout << "Found 8 at index: " << (it - v.begin());
}
\`\`\`
`
};