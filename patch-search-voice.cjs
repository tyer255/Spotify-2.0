const fs = require('fs');
let file = fs.readFileSync('src/views/SearchView.tsx', 'utf8');

// 1. Add isVoiceOpen and voiceTranscript states
file = file.replace(
    "const [isListening, setIsListening] = useState(false);",
    "const [isListening, setIsListening] = useState(false);\n  const [isVoiceOpen, setIsVoiceOpen] = useState(false);\n  const [voiceTranscript, setVoiceTranscript] = useState('');"
);

// 2. Replace recognition and voice toggle logic
const oldVoiceLogic = `  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          showToast('Microphone permission is required for voice search.', { iconType: 'info' });
        } else if (event.error === 'no-speech') {
          showToast("I couldn't hear anything. Try again.", { iconType: 'info' });
        }
      };
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          if (onSearchChange) onSearchChange(finalTranscript);
          submitSearch(finalTranscript);
        } else if (interimTranscript) {
          if (onSearchChange) onSearchChange(interimTranscript);
        }
      };
    }
  }, [onSearchChange, submitSearch, showToast]);

  const toggleVoiceSearch = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        showToast("Voice search isn't supported in this browser.", { iconType: 'info' });
        return;
      }
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start speech recognition', e);
      }
    }
  };`;

const newVoiceLogic = `  const closeVoiceSearch = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
    setIsVoiceOpen(false);
    setVoiceTranscript('');
  }, []);

  const openVoiceSearch = useCallback(() => {
    setIsVoiceOpen(true);
    setVoiceTranscript('');
    if (!recognitionRef.current) {
      showToast("Voice search isn't supported in this browser.", { iconType: 'info' });
      return;
    }
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error('Failed to start speech recognition', e);
    }
  }, [showToast]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          showToast('Microphone permission is required for voice search.', { iconType: 'info' });
        } else if (event.error === 'no-speech') {
          showToast("I couldn't hear anything. Try again.", { iconType: 'info' });
        }
      };
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          const cleanQuery = finalTranscript.trim();
          setVoiceTranscript(cleanQuery);
          if (onSearchChange) onSearchChange(cleanQuery);
          setIsSearchFocused(true);
          submitSearch(cleanQuery);
          // Auto close voice overlay after brief moment so user immediately sees their search results!
          setTimeout(() => {
            closeVoiceSearch();
          }, 350);
        } else if (interimTranscript) {
          setVoiceTranscript(interimTranscript);
        }
      };
    }
  }, [onSearchChange, submitSearch, showToast, closeVoiceSearch]);

  const toggleVoiceSearch = () => {
    if (isVoiceOpen) {
      closeVoiceSearch();
    } else {
      openVoiceSearch();
    }
  };`;

file = file.replace(oldVoiceLogic, newVoiceLogic);

// 3. Replace VoiceSearchOverlay element usage
const oldOverlayUsage = `<VoiceSearchOverlay 
        isListening={isListening} 
        onClose={() => { 
          if (recognitionRef.current) recognitionRef.current.stop(); 
          setIsListening(false); 
        }} 
        transcript={searchQuery || ""}
        onToggleListening={toggleVoiceSearch}
        onSelectSuggestion={(sugg) => {
          if (recognitionRef.current) recognitionRef.current.stop();
          setIsListening(false);
          if (onSearchChange) onSearchChange(sugg);
          submitSearch(sugg);
        }}
      />`;

const newOverlayUsage = `<VoiceSearchOverlay 
        isOpen={isVoiceOpen}
        isListening={isListening} 
        onClose={closeVoiceSearch} 
        transcript={voiceTranscript}
        onToggleListening={() => {
          if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
          } else {
            try {
              recognitionRef.current?.start();
            } catch (e) {}
          }
        }}
        onSelectSuggestion={(sugg) => {
          closeVoiceSearch();
          if (onSearchChange) onSearchChange(sugg);
          setIsSearchFocused(true);
          submitSearch(sugg);
        }}
      />`;

file = file.replace(oldOverlayUsage, newOverlayUsage);

// 4. Update click handlers to openVoiceSearch
file = file.replace(
    'onClick={toggleVoiceSearch}\n                className={`p-1.5 active:scale-90 transition-all cursor-pointer rounded-full flex-shrink-0 ${isListening ? \'text-emerald-400 bg-emerald-400/10\' : \'text-neutral-400 hover:text-white hover:bg-white/10\'}`}',
    'onClick={openVoiceSearch}\n                className={`p-1.5 active:scale-90 transition-all cursor-pointer rounded-full flex-shrink-0 ${isVoiceOpen ? \'text-emerald-400 bg-emerald-400/10\' : \'text-neutral-400 hover:text-white hover:bg-white/10\'}`}'
);

file = file.replace(
    'e.stopPropagation();\n                    toggleVoiceSearch();',
    'e.stopPropagation();\n                    openVoiceSearch();'
);

fs.writeFileSync('src/views/SearchView.tsx', file);
console.log("Successfully patched SearchView voice logic");
