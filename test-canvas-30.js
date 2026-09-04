const http = require('http');

const tracks = [
  "0VjIjW4GlUZAMYd2vXMi3b", // Blinding Lights
  "7qiZfU4dY1lWllzX7mPBI3", // Shape of You
  "7MXVkk9YMqq6aaduvD2024", // Starboy
  "4LRPiXqCikLlN15c3yImP7", // As It Was
  "2XU0oxnq2qxCpomAAuJY8K", // Dance Monkey
  "3KkXRkHbMCARz0aVfEt68P", // Sunflower
  "1zi7xx7UVEFkmKfv06H8x0", // One Dance
  "5HCyWlXZPP0y6Gqq8TgA20", // Stay
  "0pqnGHJpmpxLKifKRmU6WP", // Believer
  "7BKLCZ1jbUBVqRi2FVlTVw", // Closer
  "3USxtqRwSYz57Ewm6wJQO2", // Heat Waves
  "0tgVpDi06FyKpA1z0VMD4v", // Perfect
  "7qEHsqek33rTcFNT9PFqLf", // Someone You Loved
  "6UelLqGl00O0Whe5a7GZ7s", // Watermelon Sugar
  "2Fxmhks0bxGSBdJ92vM42m", // Bad Guy
  "34gCuhDGsG4bcljXN1Xb1T", // Thinking Out Loud
  "1HNkqx9AhhCBhAW09y1i3g", // Photograph
  "0TK2YIli7K1leLovkQiNik", // Senorita
  "0u2P5u6ljzUftK40T9vTIf", // Lovely
  "5uCax9HTNlzGheyHmcm8eD", // Say You Won't Let Go
  "3z8h0Tu7iuOUriLau8z3Q4", // Bohemian Rhapsody
  "5ghIbrs4ZzM388L5H08A1j", // Smells Like Teen Spirit
  "5ChkMS8OtdzJeqyybCc9R5", // Billie Jean
  "2WfaOiMkCvy7F5fcp2zZ8L", // Take On Me
  "5qqabIl2vWxoImAKMEawNc", // Wonderwall
  "40riOy7x9W7GXjyNdE5wD0", // Hotel California
  "7snQQk1zcKl8gZ92AnueZW", // Sweet Child O' Mine
  "0aym2IN2p77j2Ld52kU3oW", // Hey Jude
  "2fuCquhmjnoZxc6n0N88D0", // Under Pressure
  "7ouMYWcgJqbxEPqbOUhOaw"  // All Along the Watchtower
];

async function fetchCanvas(trackId) {
    const startTime = Date.now();
    return new Promise((resolve) => {
        http.get(`http://localhost:3000/api/canvas?trackId=${trackId}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const elapsed = Date.now() - startTime;
                try {
                    const json = JSON.parse(data);
                    resolve({ trackId, elapsed, result: json });
                } catch (e) {
                    resolve({ trackId, elapsed, result: { success: false, error: 'Invalid JSON' }});
                }
            });
        }).on('error', (err) => {
            resolve({ trackId, elapsed: Date.now() - startTime, result: { success: false, error: err.message }});
        });
    });
}

async function runTest() {
    console.log("Starting 30-track Canvas Runtime Verification...\n");
    let results = [];
    let stats = {
        total: tracks.length,
        found: 0,
        not_available: 0,
        fetch_failed: 0,
        auth_failed: 0,
        success: 0
    };

    // We fetch them sequentially to not overload proxy or server
    for (const trackId of tracks) {
        console.log(`[TEST] Lookup started for Track ID: ${trackId}`);
        const res = await fetchCanvas(trackId);
        
        let status = res.result.data ? res.result.data.status : (res.result.error?.code || 'UNKNOWN_ERROR');
        let url = res.result.data ? res.result.data.canvasUrl : null;
        let isSuccess = false;

        if (status === 'CANVAS_FOUND') {
            stats.found++;
            stats.success++;
            isSuccess = true;
        } else if (status === 'CANVAS_NOT_AVAILABLE') {
            stats.not_available++;
            // Not a failure of the system, just no canvas
        } else if (status === 'CANVAS_AUTH_FAILED') {
            stats.auth_failed++;
        } else if (status === 'CANVAS_FETCH_FAILED') {
            stats.fetch_failed++;
        }

        console.log(`       Status: ${status}`);
        if (url) console.log(`       URL: ${url}`);
        console.log(`       Time: ${res.elapsed}ms`);
        console.log(`       Cache Hit: ${res.result.data?.cacheHit ? 'YES' : 'NO'}\n`);
        
        results.push(res);
    }

    console.log("=============================================");
    console.log("RUNTIME VERIFICATION RESULTS");
    console.log("=============================================");
    console.log(`TOTAL TRACKS TESTED:  ${stats.total}`);
    console.log(`CANVAS FOUND:         ${stats.found}`);
    console.log(`CANVAS NOT AVAILABLE: ${stats.not_available}`);
    console.log(`FETCH FAILED:         ${stats.fetch_failed}`);
    console.log(`AUTH FAILED:          ${stats.auth_failed}`);
    console.log(`SUCCESSFULLY DISPLAYED: ${stats.success} (simulated video load)`);
    
    // Valid resolutions: either found it, or correctly identified it doesn't exist.
    const validResolutions = stats.found + stats.not_available;
    const successRate = ((validResolutions / stats.total) * 100).toFixed(2);
    console.log(`Resolution Success Rate: ${successRate}%`);
    console.log("=============================================\n");

    console.log("Testing Rapid Playback Switches (Race Condition check)...");
    
    const switchTests = [
        "0VjIjW4GlUZAMYd2vXMi3b",
        "7qiZfU4dY1lWllzX7mPBI3",
        "7MXVkk9YMqq6aaduvD2024",
        "4LRPiXqCikLlN15c3yImP7",
        "0VjIjW4GlUZAMYd2vXMi3b"
    ];

    const promises = switchTests.map((t, idx) => {
        // Fire them overlapping
        return new Promise(r => setTimeout(() => {
            fetchCanvas(t).then(res => {
                console.log(`[RACE TEST] Track ${t} returned status ${res.result.data?.status || res.result.error?.code} in ${res.elapsed}ms (Cache: ${res.result.data?.cacheHit ? 'YES' : 'NO'})`);
                r();
            });
        }, idx * 100)); // 100ms apart
    });

    await Promise.all(promises);
    console.log("Rapid switch test complete.");
}

runTest();
