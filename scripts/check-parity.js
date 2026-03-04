const fr = JSON.parse(require('fs').readFileSync('messages/fr.json','utf8'));
const en = JSON.parse(require('fs').readFileSync('messages/en.json','utf8'));
function getKeys(obj, prefix) {
  prefix = prefix || '';
  var keys = [];
  for (var k of Object.keys(obj)) {
    var path = prefix ? prefix + '.' + k : k;
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      keys = keys.concat(getKeys(obj[k], path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}
var frKeys = new Set(getKeys(fr));
var enKeys = new Set(getKeys(en));
var missingInEn = [...frKeys].filter(function(k) { return !enKeys.has(k); });
var missingInFr = [...enKeys].filter(function(k) { return !frKeys.has(k); });
console.log('FR keys:', frKeys.size, '| EN keys:', enKeys.size);
if (missingInEn.length) console.log('Missing in EN:', missingInEn);
if (missingInFr.length) console.log('Missing in FR:', missingInFr);
if (!missingInEn.length && !missingInFr.length) console.log('PARITY OK');
else process.exit(1);
