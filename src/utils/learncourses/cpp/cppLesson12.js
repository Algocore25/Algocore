export const cppLesson12 = {
  id: 12,
  title: 'Advanced Data Structures',
  description: 'Implementing linked lists, trees, and graphs from scratch.',
  content: `
## Implementing Data Structures in C++

Understanding data structures at the implementation level is crucial for technical interviews and systems programming.

### Singly Linked List:
<COMPILER>
#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* next;
    Node(int d) : data(d), next(nullptr) {}
};

class LinkedList {
    Node* head;
public:
    LinkedList() : head(nullptr) {}
    
    ~LinkedList() {
        Node* curr = head;
        while (curr) {
            Node* next = curr->next;
            delete curr;
            curr = next;
        }
    }
    
    void push_front(int val) {
        Node* newNode = new Node(val);
        newNode->next = head;
        head = newNode;
    }
    
    void push_back(int val) {
        Node* newNode = new Node(val);
        if (!head) { head = newNode; return; }
        Node* curr = head;
        while (curr->next) curr = curr->next;
        curr->next = newNode;
    }
    
    void print() {
        Node* curr = head;
        while (curr) {
            cout << curr->data;
            if (curr->next) cout << " -> ";
            curr = curr->next;
        }
        cout << " -> NULL" << endl;
    }
    
    void reverse() {
        Node* prev = nullptr;
        Node* curr = head;
        while (curr) {
            Node* next = curr->next;
            curr->next = prev;
            prev = curr;
            curr = next;
        }
        head = prev;
    }
};

int main() {
    LinkedList list;
    list.push_back(1);
    list.push_back(2);
    list.push_back(3);
    list.push_front(0);
    
    cout << "List: ";
    list.print();
    
    list.reverse();
    cout << "Reversed: ";
    list.print();
    
    return 0;
}
</COMPILER>

### Binary Search Tree:
\`\`\`cpp
struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int v) : val(v), left(nullptr), right(nullptr) {}
};

class BST {
    TreeNode* root;
    
    TreeNode* insert(TreeNode* node, int val) {
        if (!node) return new TreeNode(val);
        if (val < node->val) node->left = insert(node->left, val);
        else if (val > node->val) node->right = insert(node->right, val);
        return node;
    }
    
    void inorder(TreeNode* node) {
        if (!node) return;
        inorder(node->left);
        cout << node->val << " ";
        inorder(node->right);
    }
    
public:
    BST() : root(nullptr) {}
    void insert(int val) { root = insert(root, val); }
    void inorder() { inorder(root); cout << endl; }
};

int main() {
    BST tree;
    for (int v : {5, 3, 7, 1, 4, 6, 8}) {
        tree.insert(v);
    }
    tree.inorder(); // Sorted: 1 3 4 5 6 7 8
}
\`\`\`
`
};