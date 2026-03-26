export const daaLesson1 = {
  id: 1,
  title: 'Introduction to Algorithms',
  description: 'Understand the basics of algorithm design, analysis, and the P vs NP problem.',
  difficulty: 'Beginner',
  duration: '15 mins',
  content: `
## What is an Algorithm?
An algorithm is a step-by-step procedure for solving a problem. In **Design and Analysis of Algorithms (DAA)**, we don't just solve problems; we try to find the *most efficient* way to solve them.

### Key Aspects of DAA:
- **Time Complexity**: How the runtime grows as the input size grows (Big O notation).
- **Space Complexity**: How the memory usage grows as input size grows.
- **Correctness**: Proving that the algorithm solves the problem for all valid inputs.

### Example: Linear Search vs Binary Search
Searching for an element in an array:
- **Linear Search**: Check every element. Complexity: O(N)
- **Binary Search**: Repeatedly halve the search space (requires sorted array). Complexity: O(log N)

<COMPILER>
#include <stdio.h>

// Binary Search Example
int binarySearch(int arr[], int l, int r, int x) {
    while (l <= r) {
        int m = l + (r - l) / 2;
        if (arr[m] == x) return m;
        if (arr[m] < x) l = m + 1;
        else r = m - 1;
    }
    return -1;
}

int main() {
    int arr[] = {2, 3, 4, 10, 40};
    int n = sizeof(arr) / sizeof(arr[0]);
    int x = 10;
    int result = binarySearch(arr, 0, n - 1, x);
    if(result == -1) printf("Element not present\\n");
    else printf("Element found at index %d\\n", result);
    return 0;
}
</COMPILER>
`
};
