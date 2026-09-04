for file in $(cat js_files.txt); do 
    curl -s "$file" > tmp.js
    grep -o -E '.{0,40}sha256Hash.{0,80}' tmp.js >> all_hashes.txt
done
