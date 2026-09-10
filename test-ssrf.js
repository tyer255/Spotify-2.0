import fetch from 'node-fetch';
const streamUrl = "http://google.com";
const audioRes = await fetch(streamUrl, {
  redirect: 'manual'
});
console.log(audioRes.status);
