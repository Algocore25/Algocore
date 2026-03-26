export const cppLesson9 = {
  id: 9,
  title: 'Lambda & Modern C++ (C++11/14/17)',
  description: 'Functors, lambdas, auto, range-based loops, and more.',
  content: `
## Modern C++ Features

C++11 and later brought major improvements that changed how C++ is written. Many code bases rely heavily on these modern features.

### Lambda Functions
Lambdas are anonymous functions defined inline — perfect for short, one-off use cases.

<COMPILER>
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    // Basic lambda: [capture](params) { body }
    auto greet = []() {
        cout << "Hello from Lambda!" << endl;
    };
    greet(); // Call it like a function
    
    // Lambda with parameters
    auto add = [](int a, int b) -> int {
        return a + b;
    };
    cout << "Sum: " << add(5, 3) << endl;
    
    // Lambda capturing variables from outer scope
    int factor = 3;
    auto multiply = [factor](int x) {
        return x * factor;  // Captures 'factor' by value
    };
    cout << "Multiplied: " << multiply(7) << endl;
    
    // Lambda with STL algorithms
    vector<int> nums = {5, 2, 8, 1, 9, 3};
    sort(nums.begin(), nums.end(), [](int a, int b) {
        return a < b;  // Custom comparator!
    });
    
    for (int n : nums) {
        cout << n << " ";
    }
    cout << endl;
    
    return 0;
}
</COMPILER>

### Range-Based For Loops & \`auto\`:
<COMPILER>
#include <iostream>
#include <vector>
#include <map>
#include <string>
using namespace std;

int main() {
    vector<int> numbers = {1, 2, 3, 4, 5};
    
    // Range-based for loop (C++11)
    for (auto num : numbers) {
        cout << num << " ";
    }
    cout << endl;
    
    // With reference (avoids copying large objects)
    map<string, int> scores = {{"Alice", 95}, {"Bob", 87}, {"Charlie", 92}};
    
    for (const auto& [name, score] : scores) { // Structured bindings (C++17)
        cout << name << ": " << score << endl;
    }
    
    // auto with complex types
    auto it = numbers.begin();
    auto [min, max] = make_pair(*min_element(numbers.begin(), numbers.end()),
                                 *max_element(numbers.begin(), numbers.end()));
    cout << "Min: " << min << ", Max: " << max << endl;
    
    return 0;
}
</COMPILER>
`
};