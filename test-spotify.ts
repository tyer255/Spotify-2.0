import fetch from 'node-fetch';

async function test() {
  const tokenRes = await fetch("https://open.spotify.com/get_access_token?reason=transport&productType=web_player");
  const tokenData = await tokenRes.json();
  const token = tokenData.accessToken;
  
  const vars = JSON.stringify({
    searchTerm: "Sahiba",
    offset: 0,
    limit: 1,
    numberOfTopResults: 1
  });
  const ext = JSON.stringify({
    persistedQuery: {
      version: 1,
      sha256Hash: '75bbf6bfcfdf85b8fc828417bfad92b7cd66bf7f556d85670f4da8292373ebec'
    }
  });
  const url = `https://api-partner.spotify.com/pathfinder/v1/query?operationName=searchDesktop&variables=${encodeURIComponent(vars)}&extensions=${encodeURIComponent(ext)}`;
  
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
  const data = await res.json();
  console.log(JSON.stringify(data.data.search.tracks.items[0], null, 2));
}

test();
