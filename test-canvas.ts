import { get_canvas_for_track } from 'canvaz_api';

async function test() {
  try {
    // Arz Kiya Hai by Anuv Jain
    const arzKiyaHai = '5W2r4rPjM15Fv4yXl66L2I'; 
    const result = await get_canvas_for_track(arzKiyaHai);
    console.log("Arz Kiya Hai:", result);

    const badGuy = '2Fxmhks0bxGSBdJ92v4426';
    const result2 = await get_canvas_for_track(badGuy);
    console.log("Bad Guy:", result2);
  } catch (err) {
    console.error(err);
  }
}
test();
