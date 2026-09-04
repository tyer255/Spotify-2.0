import { get_canvas_for_track } from "canvaz_api";
import fetch from "node-fetch";

async function test() {
    try {
        let a = await get_canvas_for_track("5W2r4rPjM15Fv4yXl66L2I");
        console.log(JSON.stringify(a, null, 2));
        if (a.canvases && a.canvases.length > 0) {
            const url = a.canvases[0].url;
            console.log("Canvas URL:", url);
            const res = await fetch(url, { method: "HEAD" });
            console.log("HTTP Status:", res.status);
        }
    } catch(e) {
        console.error(e);
    }
}
test();
