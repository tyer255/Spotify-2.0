const searchArtist = async (query: string) => {
    let res = await fetch('https://itunes.apple.com/search?term=' + encodeURIComponent(query) + '&entity=musicArtist&limit=1');
    let json = await res.json();
    console.log(query, json.results?.[0]?.artistLinkUrl);
}
searchArtist('Madhur Sharma');
searchArtist('Noor');
