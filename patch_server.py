import sys

with open("server.ts", "r") as f:
    content = f.read()

# Add import at the top
if "import { GoogleGenAI } from '@google/genai';" not in content:
    content = "import { GoogleGenAI } from '@google/genai';\n" + content

# Remove the require statement
content = content.replace("const { GoogleGenAI } = require('@google/genai');", "")

with open("server.ts", "w") as f:
    f.write(content)
