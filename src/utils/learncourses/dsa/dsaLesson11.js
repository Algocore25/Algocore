export const dsaLesson11 = {
  id: 11,
  title: 'String Algorithms & Pattern Matching',
  description: 'KMP, Rabin-Karp, substring matching, and more.',
  content: `
## String Algorithms

String problems are very common in interviews. Master these patterns!

### Longest Common Substring:
<COMPILER>
def longest_common_substring(s1, s2):
    m, n = len(s1), len(s2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    max_len = 0
    
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s1[i - 1] == s2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
                max_len = max(max_len, dp[i][j])
    
    return max_len

s1 = "abcdef"
s2 = "fbdefe"
print(f"LCS length: {longest_common_substring(s1, s2)}")  # 3
</COMPILER>

### Palindrome Check:
<COMPILER>
def is_palindrome(s):
    cleaned = ''.join(c.lower() for c in s if c.isalnum())
    return cleaned == cleaned[::-1]

test_strings = [
    "A man, a plan, a canal: Panama",
    "racecar",
    "hello"
]

for s in test_strings:
    print(f'"{s}" is palindrome: {is_palindrome(s)}')
</COMPILER>

### Anagram Check:
<COMPILER>
def is_anagram(s1, s2):
    return sorted(s1) == sorted(s2)

# Alternative using character count
def is_anagram_count(s1, s2):
    from collections import Counter
    return Counter(s1) == Counter(s2)

print(is_anagram("listen", "silent"))     # True
print(is_anagram("hello", "world"))       # False
print(is_anagram_count("abc", "cab"))     # True
</COMPILER>

### Longest Substring Without Repeating Characters:
<COMPILER>
def longest_substring_no_repeat(s):
    char_index = {}
    max_len = 0
    start = 0
    
    for i, char in enumerate(s):
        if char in char_index and char_index[char] >= start:
            start = char_index[char] + 1
        
        max_len = max(max_len, i - start + 1)
        char_index[char] = i
    
    return max_len

strings = ["abcabcbb", "au", "dvdf", "pwwkew"]
for s in strings:
    print(f"'{s}' -> {longest_substring_no_repeat(s)}")
</COMPILER>

### Word Break Problem:
<COMPILER>
def word_break(s, word_dict):
    dp = [False] * (len(s) + 1)
    dp[0] = True
    
    for i in range(1, len(s) + 1):
        for j in range(i):
            if dp[j] and s[j:i] in word_dict:
                dp[i] = True
                break
    
    return dp[len(s)]

s = "catsandcatsdog"
word_dict = {"cat", "cats", "and", "sand", "dog"}
print(word_break(s, word_dict))  # True

s2 = "catsandog"
print(word_break(s2, word_dict))  # False
</COMPILER>
`
};