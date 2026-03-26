export const cppLesson7 = {
  id: 7,
  title: 'Exception Handling',
  description: 'Writing robust code that handles runtime errors gracefully.',
  content: `
## Exception Handling in C++

Exceptions provide a way to react to exceptional circumstances (like runtime errors) in programs by transferring control to special functions called **handlers**.

### Basic try-catch-throw:

<COMPILER>
#include <iostream>
#include <stdexcept>
using namespace std;

double safeDivide(double a, double b) {
    if (b == 0) {
        throw runtime_error("Division by zero is not allowed!");
    }
    return a / b;
}

int main() {
    try {
        cout << safeDivide(10, 2) << endl;   // Works fine: 5
        cout << safeDivide(10, 0) << endl;   // Throws!
    } catch (const runtime_error& e) {
        cout << "Caught error: " << e.what() << endl;
    }
    
    // Multiple catch blocks
    try {
        int arr[5] = {1, 2, 3, 4, 5};
        throw out_of_range("Array index out of bounds!");
    } catch (const out_of_range& e) {
        cout << "Range Error: " << e.what() << endl;
    } catch (const exception& e) {
        cout << "General Error: " << e.what() << endl;
    } catch (...) {
        cout << "Unknown error occurred!" << endl;
    }
    
    return 0;
}
</COMPILER>

### Custom Exception Classes
You can create your own exception types by inheriting from \`std::exception\`.

<COMPILER>
#include <iostream>
#include <exception>
using namespace std;

// Custom exception class
class InsufficientFundsException : public exception {
private:
    double amount;
public:
    InsufficientFundsException(double a) : amount(a) {}
    
    const char* what() const noexcept override {
        return "Insufficient funds in account!";
    }
    
    double getAmount() { return amount; }
};

class BankAccount {
    double balance;
public:
    BankAccount(double b) : balance(b) {}
    
    void withdraw(double amount) {
        if (amount > balance) {
            throw InsufficientFundsException(amount - balance);
        }
        balance -= amount;
        cout << "Withdrawn $" << amount << ". New balance: $" << balance << endl;
    }
};

int main() {
    BankAccount account(500.0);
    try {
        account.withdraw(200);  // OK
        account.withdraw(400);  // Will throw!
    } catch (const InsufficientFundsException& e) {
        cout << e.what() << endl;
        cout << "You need $" << e.getAmount() << " more." << endl;
    }
    return 0;
}
</COMPILER>
`
};