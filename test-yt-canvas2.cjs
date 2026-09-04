const yts = require('yt-search');
async function test() {
   const res = await yts('Arz Kiya Hai Anuv Jain whatsapp status');
   const shorts = res.videos.filter(v => v.duration.seconds <= 60);
   if (shorts.length > 0) {
      console.log("Found WhatsApp Status:", shorts[0].title, shorts[0].duration.seconds, "s", shorts[0].videoId);
   } else {
      console.log("No shorts found");
   }
}
test();
