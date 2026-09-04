import { calculateStrictMatchScore } from './server/services/AudioStreamResolver';
console.log(calculateStrictMatchScore(
  { title: "Post Malone, Swae Lee - Sunflower (Spider-Man: Into the Spider-Verse)", artist: "Post Malone", duration: 158 },
  { title: "Sunflower (Spider-Man: Into the Spider-Verse)", artist: "Post Malone & Swae Lee", duration: 158 }
));
console.log(calculateStrictMatchScore(
  { title: "Post Malone - Sunflower (Lyrics) ft. Swae Lee", artist: "Latin City", duration: 158 },
  { title: "Sunflower (Spider-Man: Into the Spider-Verse)", artist: "Post Malone & Swae Lee", duration: 158 }
));
