import { AudioStreamResolver } from './server/services/AudioStreamResolver.ts';
AudioStreamResolver.resolveFullTrack('abc', 'Dark Horse', 'Katy Perry').then(console.log);
