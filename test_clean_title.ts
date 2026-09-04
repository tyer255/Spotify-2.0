function cleanTitle(title: string): string {
    return title.split(/[\(\[-]/)[0].trim().toLowerCase();
}

console.log(cleanTitle("Angaaron (From \"Pushpa 2 the Rule\") - ..."));
console.log(cleanTitle("Sajni (from Laapataa Ladies)"));
console.log(cleanTitle("bad guy"));
