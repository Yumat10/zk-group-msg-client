// Functions copied from Web3js

// Taken from:
// https://github.com/web3/web3.js/blob/84e0f3756bcf0c8421c2c495e053b55ecc08d53d/packages/web3-utils/src/utils.js#L373
function isHexStrict(hex: string): boolean {
  return (
    (typeof hex === 'string' || typeof hex === 'number') &&
    /^(-)?0x[0-9a-f]*$/i.test(hex)
  );
}

const utf8 = require('utf8');

// Taken from:
// https://github.com/web3/web3.js/blob/1.x/packages/web3-utils/src/utils.js
export function hexToAscii(hex: string): string {
  if (!isHexStrict(hex))
    throw new Error('The parameter "' + hex + '" must be a valid HEX string.');

  var str = '';
  var code = 0;
  hex = hex.replace(/^0x/i, '');

  // remove 00 padding from either side
  hex = hex.replace(/^(?:00)*/, '');
  hex = hex.split('').reverse().join('');
  hex = hex.replace(/^(?:00)*/, '');
  hex = hex.split('').reverse().join('');

  var l = hex.length;

  for (var i = 0; i < l; i += 2) {
    code = parseInt(hex.slice(i, i + 2), 16);
    // if (code !== 0) {
    str += String.fromCharCode(code);
    // }
  }

  return utf8.decode(str);
}

// Taken from:
// https://github.com/web3/web3.js/blob/1.x/packages/web3-utils/src/utils.js
export function asciiToHex(str: string): string {
  str = utf8.encode(str);
  var hex = '';

  // remove \u0000 padding from either side
  str = str.replace(/^(?:\u0000)*/, '');
  str = str.split('').reverse().join('');
  str = str.replace(/^(?:\u0000)*/, '');
  str = str.split('').reverse().join('');

  for (var i = 0; i < str.length; i++) {
    var code = str.charCodeAt(i);
    // if (code !== 0) {
    var n = code.toString(16);
    hex += n.length < 2 ? '0' + n : n;
    // }
  }

  return '0x' + hex;
}
