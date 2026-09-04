const run = async () => {
    let res = await fetch('https://api.jiosaavn.com/api.php?__call=search.getResults&_format=json&n=10&p=1&_marker=0&ctx=web6dot0&q=Aarzu');
    let json = await res.json();
    console.log(json.results?.[0]?.more_info?.artistMap?.primary_artists);
}
run();
