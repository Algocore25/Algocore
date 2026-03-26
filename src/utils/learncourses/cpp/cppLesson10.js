export const cppLesson10 = {
  id: 10,
  title: 'Smart Pointers & RAII',
  description: 'Memory-safe programming with unique_ptr and shared_ptr.',
  content: `
## Smart Pointers in C++

Raw pointers (\`new\`/\`delete\`) are error-prone — forgetting to \`delete\` causes memory leaks. **Smart pointers** automatically manage memory, following the **RAII** (Resource Acquisition Is Initialization) principle.

### The 3 Types of Smart Pointers:
1. \`unique_ptr\`: Single ownership — only one pointer can point to the object.
2. \`shared_ptr\`: Shared ownership — multiple pointers can share the same object.
3. \`weak_ptr\`: Non-owning reference to a \`shared_ptr\` (breaks circular references).

### unique_ptr (Exclusive Ownership):
<COMPILER>
#include <iostream>
#include <memory>
#include <string>
using namespace std;

class Robot {
    string name;
public:
    Robot(string n) : name(n) {
        cout << name << " activated!" << endl;
    }
    ~Robot() {
        cout << name << " deactivated." << endl;  // Auto-called!
    }
    void beep() { cout << name << ": Beep boop!" << endl; }
};

int main() {
    // No 'new' needed! make_unique handles it
    auto robot1 = make_unique<Robot>("R2D2");
    robot1->beep();
    
    // Transfer ownership (unique_ptr can't be copied!)
    auto robot2 = move(robot1);
    robot2->beep();
    // robot1 is now nullptr!
    
    cout << "robot1 is " << (robot1 ? "valid" : "null") << endl;
    
    // robot2 automatically destroyed at end of scope!
    return 0;
}
</COMPILER>

### shared_ptr (Shared Ownership):
<COMPILER>
#include <iostream>
#include <memory>
using namespace std;

class Database {
public:
    Database() { cout << "Database connected!" << endl; }
    ~Database() { cout << "Database disconnected." << endl; }
    void query() { cout << "Running query..." << endl; }
};

int main() {
    shared_ptr<Database> db1 = make_shared<Database>();
    cout << "Reference count: " << db1.use_count() << endl;  // 1
    
    {
        shared_ptr<Database> db2 = db1;  // Both own it now
        cout << "Reference count: " << db1.use_count() << endl;  // 2
        db2->query();
    }  // db2 goes out of scope, count decreases
    
    cout << "Reference count after inner scope: " << db1.use_count() << endl;  // 1
    // Database destroyed only when ALL shared_ptrs die!
    
    return 0;
}
</COMPILER>
`
};