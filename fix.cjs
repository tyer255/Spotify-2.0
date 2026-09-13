const fs = require('fs');
let code = fs.readFileSync('server/services/AudioStreamResolver.ts', 'utf-8');

code = code.replace(/const verification = calculateStrictMatchScore\([\s\S]*?if \(allVerifiedVideos\.length > 0\)/, `const verification = calculateStrictMatchScore(
            { title: vid.title, artist: vid.author?.name || '', duration: dur },
            target
          );
          const minRequiredDur = expectedDuration && expectedDuration > 60 ? 45 : 25;
          if (verification.verified && dur >= minRequiredDur) {
            allVerifiedVideos.push({ vid, score: verification.score });
          }
        }
      }
      if (allVerifiedVideos.length > 0)`);

fs.writeFileSync('server/services/AudioStreamResolver.ts', code);
