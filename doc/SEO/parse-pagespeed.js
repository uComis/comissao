const d = require('./pagespeed-result.json');
const c = d.lighthouseResult.categories;

console.log('=== SCORES (mobile) ===');
Object.entries(c).forEach(([k, v]) => console.log(k + ': ' + Math.round(v.score * 100)));

console.log();
console.log('=== ACCESSIBILITY AUDITS (failed/warning) ===');
const audits = d.lighthouseResult.audits;
const aRefs = c.accessibility.auditRefs.map(r => r.id);
const failed = Object.entries(audits).filter(([k, v]) => aRefs.includes(k) && v.score !== null && v.score < 1);
if (failed.length === 0) {
  console.log('Nenhum problema encontrado!');
} else {
  failed.forEach(([k, v]) => console.log(k + ': score=' + v.score + ' — ' + v.title));
}
