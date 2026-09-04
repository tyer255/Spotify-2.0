with open('src/views/HomeView.tsx', 'r') as f:
    code = f.read()

code = code.replace("{personalized.becauseYouListenToArtistName && personalized.becauseYouListenToTracks.length > 0 && ({/* 4. Because You Listen to [Artist] (Dynamic from real user affinity) */}", 
                    "{personalized.becauseYouListenToArtistName && personalized.becauseYouListenToTracks.length > 0 && (")

with open('src/views/HomeView.tsx', 'w') as f:
    f.write(code)
