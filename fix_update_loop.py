import os

file_path = "src/bundle/index-Bfvfzxe5.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

target = "onClick:()=>{s(!0);e(!1);n(!1);setTimeout(()=>window.location.reload(),500)}"
replacement = "onClick:()=>{s(!0);e(!1);n(!1);}"

if target in content:
    content = content.replace(target, replacement)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Fixed update loop in JS.")
else:
    print("Target string not found in JS.")
