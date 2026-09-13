const p1 = new Promise((resolve) => setTimeout(() => resolve(null), 100));
const p2 = new Promise((resolve) => setTimeout(() => resolve("Winner"), 500));
const p3 = new Promise((resolve, reject) => setTimeout(() => reject("Err"), 200));

Promise.any([p1, p2, p3].map(async p => {
  const res = await p;
  if (!res) throw new Error("Null");
  return res;
})).then(console.log).catch(console.error);
