var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// time-providers.ts
(async () => {
  const ytSearch = (await import("yt-search")).default;
  const start = Date.now();
  const p1 = (async () => {
    const s = Date.now();
    const res = await fetch("https://www.jiosaavn.com/api.php?__call=search.getResults&q=shape+of+you&p=1&n=15&_format=json&_marker=0&api_version=4&ctx=web6dot0").then((r) => r.json());
    console.log("JioSaavn search took:", Date.now() - s, "ms");
  })();
  const p2 = (async () => {
    const s = Date.now();
    await ytSearch("shape of you ed sheeran audio");
    console.log("YouTube search took:", Date.now() - s, "ms");
  })();
  await Promise.all([p1, p2]);
})();
