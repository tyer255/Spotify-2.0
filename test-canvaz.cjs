const canvaz = require('canvaz_api');
async function run() {
    try {
        const url = await canvaz.getCanvas('0VjIjW4GlUZAMYd2vXMi3b');
        console.log("URL:", url);
    } catch(e) {
        console.log("Error:", e);
    }
}
run();
