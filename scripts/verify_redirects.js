const https = require('https');

const tests = [
  ['S1: wrong state', '/local/act/darwin/palmerston', '/local/nt/darwin/palmerston'],
  ['S1: wrong state', '/local/vic/perth/armadale', '/local/wa/perth/armadale'],
  ['S2: suburb-as-city', '/local/nsw/botany/alexandria', '/local/nsw/sydney/alexandria'],
  ['S2: suburb-as-city', '/local/wa/canning-vale/beckenham', '/local/wa/perth/beckenham'],
  ['S2: suburb-as-city', '/local/qld/capalaba/cleveland', '/local/qld/brisbane/cleveland'],
  ['S3: wrong city', '/local/nsw/sydney/auburn', '/local/nsw/parramatta/auburn'],
  ['S3: wrong city', '/local/tas/launceston/devonport', '/local/tas/burnie/devonport'],
  ['S4: new suburb (200)', '/local/vic/melbourne/altona', null],
  ['S4: new suburb (200)', '/local/nsw/liverpool/bankstown', null],
  ['S4: new suburb (200)', '/local/wa/rockingham/baldivis', null],
];

let i = 0;
function next() {
  if (i >= tests.length) { console.log('\nDone.'); return; }
  const [label, path, expectRedirect] = tests[i++];
  const req = https.get({ hostname: 'traderefer.au', path, headers: { 'User-Agent': 'verify-bot' } }, res => {
    const loc = res.headers.location || '(none)';
    let ok;
    if (expectRedirect) {
      ok = res.statusCode === 301 && loc.includes(expectRedirect);
    } else {
      ok = res.statusCode === 200;
    }
    const status = ok ? 'PASS' : 'FAIL';
    console.log(`${status} | ${label} | ${res.statusCode} | ${path} -> ${loc}`);
    next();
  });
  req.on('error', e => { console.log(`FAIL | ${label} | ERROR: ${e.message}`); next(); });
}
next();
