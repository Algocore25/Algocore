export const pythonLesson8 = {
  id: 8,
  title: 'Web Scraping & APIs',
  description: 'Fetching data from websites and working with REST APIs.',
  content: `
## Web Scraping

Web scraping extracts data from websites.

### BeautifulSoup:
<COMPILER>
from bs4 import BeautifulSoup
import requests

# Fetch website
url = 'https://example.com'
response = requests.get(url)
html = response.text

# Parse HTML
soup = BeautifulSoup(html, 'html.parser')

# Find elements
title = soup.find('title')
print(title.text)

# Find all (returns list)
links = soup.find_all('a')
for link in links:
    print(link.get('href'))

# Select by class
cards = soup.select('.card')

# Select by ID
header = soup.select_one('#header')
</COMPILER>

## APIs and JSON

Working with REST APIs and JSON data.

### Making API Requests:
<COMPILER>
import requests
import json

# GET request
response = requests.get('https://api.example.com/users')
status = response.status_code  # 200, 404, etc.
data = response.json()  # Parse JSON

# POST request
payload = {
    'name': 'Alice',
    'email': 'alice@example.com'
}
response = requests.post('https://api.example.com/users', json=payload)

# Headers
headers = {"User-Agent": "MyApp/1.0"}
response = requests.get("https://api.example.com", headers=headers)

print(response.status_code)
print(response.json())
</COMPILER>

### Working with JSON:
<COMPILER>
import json

# Dictionary to JSON string
data = {'name': 'Alice', 'age': 30}
json_str = json.dumps(data)
print(json_str)  # '{"name": "Alice", "age": 30}'

# JSON string to dictionary
json_data = '{"name": "Bob", "age": 25}'
parsed = json.loads(json_data)
print(parsed['name'])  # 'Bob'

# Read/write JSON files
with open('data.json', 'w') as f:
    json.dump(data, f)

with open('data.json', 'r') as f:
    loaded_data = json.load(f)
</COMPILER>
`
};