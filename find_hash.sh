for file in $(cat js_files.txt); do 
    echo "Checking $file"
    curl -s "$file" > tmp.js
    grep -o -E 'getTrackCanvas.*?sha256Hash":"[a-f0-9]{64}"' tmp.js || echo "no"
done
