const CryptoJS = require('crypto-js');
function decryptSaavnMediaUrl(encrypted) {
  try {
    const key = CryptoJS.enc.Utf8.parse('38346591');
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(encrypted),
    });
    const decrypted = CryptoJS.DES.decrypt(cipherParams, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    const url = decrypted.toString(CryptoJS.enc.Utf8);
    const base = url.replace(/_\d+\.mp4$/, '');
    return {
      primaryUrl: url,
      fallbackUrls: [
        `${base}_320.mp4`,
        `${base}_160.mp4`,
        `${base}_96.mp4`
      ],
    };
  } catch (e) {
    console.log(e);
    return null;
  }
}
console.log(decryptSaavnMediaUrl("ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDyAEdIz3I1k14iMEbbqFWNwwnGaG4Q+mCewVL1YIS4xY8WDSYjohOj7hw7tS9a8Gtq"));
