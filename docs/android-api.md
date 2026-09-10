# Spotiz Android API Documentation

## Overview
This API allows external clients, like native Android applications, to consume the Spotiz music backend. The backend resolves playback streams, manages global search, and aggregates metadata across providers (Spotify, Open Authorized Music Provider, etc.).

**Production Base URL:** `https://ais-pre-f4b4slnpadux7tdlrkraly-55983378244.asia-southeast1.run.app/api` (or your mapped custom domain).
**Format:** JSON. All endpoints return the standardized response format:
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```
**Errors:** If `success` is false, `error` contains `{ "code": "ERROR_CODE", "message": "Description" }`.

## Authentication Flow for Android

1. Authenticate the user directly on Android using the **Firebase Authentication SDK**.
2. Retrieve the user's **Firebase ID Token** (`user.getIdToken()`).
3. For protected routes (and optional personalization), pass the token in the `Authorization` header:
   `Authorization: Bearer <ID_TOKEN>`
4. The backend verifies this token securely via the Firebase Admin SDK.

**Note on User Data (Playlists, Likes, History):**
Currently, user-specific data is accessed *directly* via the Firebase Firestore SDK on the frontend (Web). For Android, you should do the same: use the Android Firebase Firestore SDK to read/write playlists and likes. The REST API handles the *music catalog* and *playback resolution*.

## Public Endpoints

These endpoints do not strictly require authentication, but passing the `Authorization` header will personalize the results (e.g., search ranking based on play history).

### 1. Health & Provider Status
**GET** `/health`
Check if the backend is reachable and which music providers are currently active.

### 2. Home Feed
**GET** `/home`
Returns curated playlists and trending tracks for the home screen.

### 3. Search
**GET** `/search?q=query`
Searches for tracks, albums, artists, and playlists.
- `q` (required): The search query.
- Optional Headers: `Authorization: Bearer <token>`, `x-session-id: <uuid>`

### 4. Search Suggestions
**GET** `/search/suggestions?q=query`
Fast auto-complete suggestions while typing.

### 5. Track Details
**GET** `/track/:id`
Get full metadata for a specific track.

### 6. Album Details
**GET** `/album/:id`
Get album metadata and tracklist.

### 7. Artist Details
**GET** `/artist/:id`
Get artist metadata and top tracks.

### 8. Playlist Details
**GET** `/playlist/:id`
Get playlist metadata and tracklist.

### 9. Lyrics
**GET** `/lyrics/:id`
Get time-synced or plain lyrics for a track.

### 10. Playback Resolution
**POST** `/playback/resolve`
Resolves a track ID into a playable audio stream URL. The Android app should use this to get the underlying stream for `ExoPlayer` or `MediaPlayer`.
**Body:**
```json
{
  "trackId": "string",
  "track": { "id": "...", "title": "...", "artist": "..." } // Optional context
}
```
**Returns:** A `streamUrl` which the player can consume.

### 11. Analytics Event
**POST** `/analytics/event`
Logs a user interaction to improve the smart ranking system.
**Body:**
```json
{
  "event_type": "play", // 'search' | 'play' | 'play_completed' | 'click' | 'like'
  "song_id": "track_id"
}
```

## Security & Rate Limiting
- **CORS:** Restricted to the web client origins in production. Android applications do not need to worry about CORS (since CORS is a browser concept), but standard HTTP requests will work.
- **Rate Limiting:** A global rate limit of 120 requests per minute per IP is applied to all `/api/` endpoints to prevent abuse.
- **Server-Side Validation:** The backend validates provider signatures and stream URLs to prevent Server-Side Request Forgery (SSRF) and arbitrary URL proxying.
