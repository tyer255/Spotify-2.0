const http = require('http');

const tracks = [
  "0VjIjW4GlUZAMYd2vXMi3b", "7qiZfU4dY1lWllzX7mPBI3", "7MXVkk9YMqq6aaduvD2024",
  "4LRPiXqCikLlN15c3yImP7", "2XU0oxnq2qxCpomAAuJY8K", "3KkXRkHbMCARz0aVfEt68P",
  "1zi7xx7UVEFkmKfv06H8x0", "5HCyWlXZPP0y6Gqq8TgA20", "0pqnGHJpmpxLKifKRmU6WP",
  "7BKLCZ1jbUBVqRi2FVlTVw", "3USxtqRwSYz57Ewm6wJQO2", "0tgVpDi06FyKpA1z0VMD4v",
  "7qEHsqek33rTcFNT9PFqLf", "6UelLqGl00O0Whe5a7GZ7s", "2Fxmhks0bxGSBdJ92vM42m",
  "34gCuhDGsG4bcljXN1Xb1T", "1HNkqx9AhhCBhAW09y1i3g", "0TK2YIli7K1leLovkQiNik",
  "0u2P5u6ljzUftK40T9vTIf", "5uCax9HTNlzGheyHmcm8eD", "3z8h0Tu7iuOUriLau8z3Q4",
  "5ghIbrs4ZzM388L5H08A1j", "5ChkMS8OtdzJeqyybCc9R5", "2WfaOiMkCvy7F5fcp2zZ8L",
  "5qqabIl2vWxoImAKMEawNc", "40riOy7x9W7GXjyNdE5wD0", "7snQQk1zcKl8gZ92AnueZW",
  "0aym2IN2p77j2Ld52kU3oW", "2fuCquhmjnoZxc6n0N88D0", "7ouMYWcgJqbxEPqbOUhOaw"
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
    let stats = { total: tracks.length, found: 0, not_available: 0, fetch_failed: 0, auth_failed: 0, success: 0 };

    for (const trackId of tracks) {
        const res = await fetchCanvas(trackId);
        let status = res.result.data ? res.result.data.status : (res.result.error?.code || 'UNKNOWN_ERROR');
        if (status === 'CANVAS_FOUND') { stats.found++; stats.success++; }
        else if (status === 'CANVAS_NOT_AVAILABLE') { stats.not_available++; }
        else if (status === 'CANVAS_AUTH_FAILED') { stats.auth_failed++; }
        else if (status === 'CANVAS_FETCH_FAILED') { stats.fetch_failed++; }
        console.log(`[TEST] Track: ${trackId.padEnd(25)} Status: ${status.padEnd(20)} Time: ${res.elapsed}ms Cache: ${res.result.data?.cacheHit ? 'YES' : 'NO'}`);
    }

    console.log("\n=============================================");
    console.log("RUNTIME VERIFICATION RESULTS");
    console.log("=============================================");
    console.log(`TOTAL TRACKS TESTED:  ${stats.total}`);
    console.log(`CANVAS FOUND:         ${stats.found}`);
    console.log(`CANVAS NOT AVAILABLE: ${stats.not_available}`);
    console.log(`FETCH FAILED:         ${stats.fetch_failed}`);
    console.log(`AUTH FAILED:          ${stats.auth_failed}`);
    console.log(`SUCCESSFULLY DISPLAYED: ${stats.success}`);
    
    const validResolutions = stats.found + stats.not_available;
    const successRate = ((validResolutions / stats.total) * 100).toFixed(2);
    console.log(`Resolution Success Rate: ${successRate}%`);
    console.log("=============================================\n");

    console.log("Testing Rapid Playback Switches (Race Condition check)...");
    const switchTests = [tracks[0], tracks[1], tracks[2], tracks[3], tracks[0]];
    const promises = switchTests.map((t, idx) => {
        return new Promise(r => setTimeout(() => {
            fetchCanvas(t).then(res => {
                let status = res.result.data ? res.result.data.status : (res.result.error?.code || 'UNKNOWN_ERROR');
                console.log(`[RACE TEST] Track ${t} returned status ${status} in ${res.elapsed}ms (Cache: ${res.result.data?.cacheHit ? 'YES' : 'NO'})`);
                r();
            });
        }, idx * 100));
    });
    await Promise.all(promises);
    console.log("Rapid switch test complete.");
}

runTest();
