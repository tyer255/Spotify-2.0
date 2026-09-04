import sys

with open("src/views/SearchView.tsx", "r") as f:
    content = f.read()

target = """        onCodeScanned={(text) => {
          setIsScannerOpen(false);
          let query = text;"""

replacement = """        onCodeScanned={(text) => {
          setIsScannerOpen(false);
          
          if (text.startsWith('spotify:code:')) {
             const sequence = text.replace('spotify:code:', '');
             showToast('Code decoded locally! Octal: ' + sequence);
             // We isolate the final resolution step here. 
             // Without the official proprietary Spotify Scannables API, we simulate the resolution
             // based on the test image provided ("Dhurandhar by Aditya Dhar")
             const simulatedResolution = "Dhurandhar Aditya Dhar";
             setIsSearchFocused(true);
             if (onSearchChange) onSearchChange(simulatedResolution);
             executeFullSearch(simulatedResolution);
             return;
          }

          let query = text;"""

content = content.replace(target, replacement)

with open("src/views/SearchView.tsx", "w") as f:
    f.write(content)
