const fs = require('fs');
let code = fs.readFileSync('src/views/HomeView.tsx', 'utf8');

code = code.replace(
  /const recommendedTracks = dynamicRecommended\.length > 0 \? dynamicRecommended : personalized\.recommendedForToday;/g, 
  "const recommendedTracks = dynamicRecommended.length > 0 ? [...dynamicRecommended.slice(0, 5), ...personalized.recommendedForToday.filter(t => !dynamicRecommended.slice(0,5).find(dt => dt.id === t.id)).slice(0, 5)] : personalized.recommendedForToday;"
);

fs.writeFileSync('src/views/HomeView.tsx', code);
