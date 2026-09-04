import sys

with open("src/views/SearchView.tsx", "r") as f:
    content = f.read()

injection = """
      {/* Spotify Code Scanner Overlay */}
      <SpotifyCodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onCodeScanned={(text) => {
          setIsScannerOpen(false);
          let query = text;
          try {
            if (text.includes('spotify.com')) {
              const url = new URL(text);
              const pathParts = url.pathname.split('/').filter(Boolean);
              if (pathParts.length > 0) {
                 query = pathParts[pathParts.length - 1]; // e.g., get ID
              }
            }
          } catch(e) {}
          
          setDebouncedQuery(query);
          setIsSearchFocused(true);
          if (onSearchChange) onSearchChange(query);
          // showToast is not directly accessible here unless we have it, let's just trigger search
        }}
      />
    </motion.div>
  );
};
"""

content = content.replace("    </motion.div>\n  );\n};", injection)

with open("src/views/SearchView.tsx", "w") as f:
    f.write(content)
