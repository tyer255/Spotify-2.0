const fetch = require('node-fetch');
fetch('https://aac.saavncdn.com/584/e5c9337aa4a106fbd1622aaf027a2536_96.mp4', {method: 'HEAD'}).then(res => {
  console.log(res.headers.get('content-length'));
});
