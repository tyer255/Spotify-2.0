import fetch from 'node-fetch';

async function test() {
    try {
        const res = await fetch('https://www.jiosaavn.com/api.php?__call=search.getResults&q=Arz+Kiya+Hai&n=5&p=1&_format=json&_marker=0&ctx=web6dot0');
        const data = await res.json();
        console.log(JSON.stringify(data.results[0], null, 2));
    } catch(e) { console.error(e); }
}
test();
