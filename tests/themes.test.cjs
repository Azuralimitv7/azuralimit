const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const compiled = process.env.THEME_TEST_BUILD || '/tmp/azuralimit-theme-tests';
const theme = require(path.join(compiled, 'theme.js'));
const calendar = require(path.join(compiled, 'celebrations.js'));
const fxmod = require(path.join(compiled, 'celebrationFx.js'));
const root = path.resolve(__dirname, '..');

function fakeDocument() {
  const values = {};
  const document = {
    documentElement: { dataset: {}, style: { colorScheme: '', setProperty: (k,v) => { values[k] = v; }, removeProperty: (k) => { delete values[k]; } } },
    querySelector: () => ({ setAttribute: () => {} }),
  };
  return { document, values };
}

test('40 unique themes: 10 studio and 30 Indonesian celebrations', () => {
  assert.equal(theme.THEMES.length, 40);
  assert.equal(theme.STUDIO_THEMES.length, 10);
  assert.equal(theme.HOLIDAY_THEMES.length, 30);
  assert.equal(new Set(theme.THEMES.map(x => x.id)).size, 40);
  for (const item of theme.THEMES) assert.equal(theme.themeById(item.id), item);
});

test('all 16 national-holiday occasions / 17 official 2026 dates are represented', () => {
  const official = calendar.CELEBRATIONS.filter(x => x.nationalHoliday);
  assert.equal(official.length, 16);
  assert.equal(official.flatMap(x => x.dates2026).length, 17);
  assert.equal(calendar.CELEBRATIONS.filter(x => !x.nationalHoliday && x.category !== 'musim').length, 13);
  assert.equal(calendar.CELEBRATIONS.filter(x => x.category === 'musim').length, 1);
  for (const entry of calendar.CELEBRATIONS) {
    for (const date of entry.dates2026) {
      assert.match(date, /^2026-\d{2}-\d{2}$/);
      assert.equal(new Date(date).toISOString().slice(0,10), date);
    }
    assert.ok(entry.dateLabel.length);
    assert.ok(entry.description.length > 30);
  }
  assert.equal(calendar.occasionStatus(calendar.CELEBRATIONS.find(x => x.id === 'kartini')), 'Hari peringatan · bukan libur nasional');
});

test('every celebration has three local, non-executable original SVG files', () => {
  const posterHashes = new Set();
  let bytes = 0;
  for (const entry of calendar.CELEBRATIONS) {
    const assets = calendar.celebrationAssets(entry.id);
    for (const [kind,url] of Object.entries(assets)) {
      assert.match(url, /^\/assets\/celebrations\/[a-z-]+\/(poster|motif|pattern)\.svg$/);
      const contents = fs.readFileSync(path.join(root, 'public', url), 'utf8');
      assert.match(contents, /^<svg\s/);
      assert.match(contents, /<title[^>]*>.+<\/title>/);
      assert.doesNotMatch(contents, /<script|<foreignObject|<image|<text|\son\w+=|<animate|<style|href=|https:\/\//i);
      assert.doesNotMatch(contents, /NaN|undefined|seventy|fifty|forty|eighty/);
      assert.match(contents, /<\/svg>/);
      bytes += Buffer.byteLength(contents);
      if (kind === 'poster') posterHashes.add(createHash('sha256').update(contents).digest('hex'));
    }
  }
  assert.equal(posterHashes.size, 30);
  assert.ok(bytes < 400_000, `Assets unexpectedly heavy: ${bytes} bytes`);
  assert.ok(calendar.celebrationAssets('../../etc/passwd').poster.startsWith('/assets/celebrations/tahun-baru/'));
});

test('generated styles contain a complete accessible palette for every celebration', () => {
  const css = fs.readFileSync(path.join(root,'src/app/celebrations.css'),'utf8');
  assert.doesNotThrow(() => require('postcss').parse(css));
  for (const entry of calendar.CELEBRATIONS) {
    assert.ok(css.includes(`:root[data-theme="${entry.id}"]`));
    const p = entry.palette;
    assert.ok(theme.contrastRatio(p.ink, p.bg) >= 4.5, `${entry.id}: body text contrast`);
    assert.ok(theme.contrastRatio(theme.inkOn(p.accent),p.accent) >= 4.5, `${entry.id}: button text contrast`);
  }
  assert.ok(css.includes('[data-pattern="heritage"]'));
});

test('legacy settings migrate while preserving user choices', () => {
  const result = theme.normalizeSettings({ theme:'lagoon', sound:false, motion:false, pattern:'dots' });
  assert.equal(result.theme,'lagoon');
  assert.equal(result.sound,false);
  assert.equal(result.motion,false);
  assert.equal(result.pattern,'dots');
  assert.equal(result.decorations,true);
  assert.deepEqual(result.favorites,[]);
  assert.equal(theme.normalizeSettings({theme:'idul-fitri'}).theme,'idul-fitri');
});

test('corrupted storage and invalid saved values fail safely', () => {
  for (const value of [null,42,'invalid',[],true]) assert.equal(theme.normalizeSettings(value).theme,'tahun-baru');
  const result = theme.normalizeSettings({theme:'hacker', accent:'url(https://example.test)', pattern:'remote', motion:'no', decorations:0, favorites:['imlek','imlek','hacker',42,null,'batik']});
  assert.equal(result.theme,'tahun-baru');
  assert.equal(result.accent,null);
  assert.equal(result.pattern,'heritage');
  assert.equal(result.motion,true);
  assert.equal(result.decorations,true);
  assert.deepEqual(result.favorites,['imlek','batik']);
});

test('pre-paint bootstrap and runtime application agree for all 40 themes', () => {
  for (const item of theme.THEMES) {
    const settings = theme.normalizeSettings({ theme:item.id, ambientRelease: theme.AMBIENT_RELEASE, pattern:item.celebration?'heritage':'grid', motion:false, decorations:false });
    const before = fakeDocument();
    vm.runInNewContext(theme.THEME_BOOTSTRAP, { document:before.document, localStorage:{ getItem:()=>JSON.stringify(settings) } });
    const after = fakeDocument();
    global.document = after.document;
    theme.applySettings(settings);
    delete global.document;
    assert.deepEqual(before.document.documentElement.dataset, after.document.documentElement.dataset);
    assert.equal(before.document.documentElement.style.colorScheme, item.mode);
    assert.equal(before.document.documentElement.dataset.theme, item.id);
  }
});

test('custom accent uses consistent contrast and clears completely on reset', () => {
  for (const accent of theme.ACCENTS) {
    const settings = theme.normalizeSettings({ theme:'natal', accent:accent.hex });
    const before=fakeDocument(), after=fakeDocument();
    vm.runInNewContext(theme.THEME_BOOTSTRAP, { document:before.document,localStorage:{getItem:()=>JSON.stringify(settings)} });
    global.document=after.document;
    theme.applySettings(settings);
    assert.equal(before.values['--on-accent'],after.values['--on-accent']);
    assert.equal(after.values['--grid-line'],accent.hex);
    theme.applySettings({...settings,accent:null});
    assert.deepEqual(after.values,{});
    delete global.document;
  }
});

test('bootstrap tolerates blocked or malformed storage', () => {
  for (const storage of [{getItem:()=>'{broken'}, {getItem:()=>{throw new Error('blocked')}}]) {
    const mock=fakeDocument();
    assert.doesNotThrow(()=>vm.runInNewContext(theme.THEME_BOOTSTRAP,{document:mock.document,localStorage:storage}));
    assert.equal(mock.document.documentElement.dataset.theme,'tahun-baru');
  }
});

test('search, categories and original source remain available without a request', () => {
  assert.equal(calendar.searchCelebrations('ketupat')[0].id,'idul-fitri');
  assert.equal(calendar.searchCelebrations('17 Agustus')[0].id,'kemerdekaan');
  assert.equal(calendar.searchCelebrations('tidakada-zzzz').length,0);
  assert.ok(calendar.searchCelebrations('', 'keagamaan').every(x=>x.category==='keagamaan'));
  assert.equal(calendar.searchCelebrations('', 'musim')[0].id,'ramadan');
  assert.ok(calendar.CALENDAR_SOURCE.startsWith('https://www.kemenkopmk.go.id/'));
});

test('every celebration has its own ambient FX choreography', () => {
  assert.equal(Object.keys(fxmod.CELEBRATION_FX).length, 30);
  for (const entry of calendar.CELEBRATIONS) {
    const fx = fxmod.fxForCelebration(entry.id);
    assert.ok(fx, `missing FX for ${entry.id}`);
    assert.equal(fx.id, entry.id);
    assert.ok(fx.label.length > 4);
    assert.ok(fx.fireworks || fx.falling || fx.rising || fx.twinkle || fx.embers, `${entry.id} has no emitters`);
    const hex = /^#[0-9a-fA-F]{6}$|^#FFFFFF$/;
    for (const group of [fx.fireworks?.colors, fx.falling?.colors, fx.rising?.colors, fx.twinkle?.colors, fx.embers?.colors]) {
      if (!group) continue;
      assert.ok(group.length >= 1 && group.length <= 8);
      for (const c of group) assert.match(c, hex, `${entry.id} color ${c}`);
    }
    if (fx.fireworks) {
      assert.ok(fx.fireworks.rate > 0 && fx.fireworks.rate <= 2, `${entry.id} firework rate`);
      assert.ok(fx.fireworks.maxRockets >= 1 && fx.fireworks.maxRockets <= 5);
      assert.ok(fx.fireworks.power >= 0.5 && fx.fireworks.power <= 1.5);
    }
    const total = (fx.falling?.count ?? 0) + (fx.rising?.count ?? 0) + (fx.twinkle?.count ?? 0) + (fx.embers?.count ?? 0);
    assert.ok(total >= 20 && total <= 260, `${entry.id} particle budget ${total}`);
  }
  assert.equal(fxmod.fxForCelebration(null), null);
  assert.equal(fxmod.fxForCelebration('tidak-ada'), null);
  // signature moments are distinct
  assert.ok(fxmod.CELEBRATION_FX['tahun-baru'].fireworks.rate >= 1.2);
  assert.ok(fxmod.CELEBRATION_FX['kemerdekaan'].falling.shapes.includes('ribbon'));
  assert.ok(fxmod.CELEBRATION_FX['natal'].falling.shapes.includes('snow'));
  assert.ok(fxmod.CELEBRATION_FX['imlek'].rising.shapes.includes('lantern'));
  assert.ok(fxmod.CELEBRATION_FX['idul-fitri'].falling.shapes.includes('ketupat'));
  assert.ok(!fxmod.CELEBRATION_FX['nyepi'].fireworks, 'nyepi stays quiet');
});

test('FX density scales for calm mode and small screens', () => {
  assert.equal(fxmod.densityFor('meriah', 1440), 1);
  assert.equal(fxmod.densityFor('lembut', 1440), 0.35);
  assert.ok(Math.abs(fxmod.densityFor('meriah', 500) - 0.6) < 1e-9);
  assert.ok(Math.abs(fxmod.densityFor('lembut', 500) - 0.21) < 1e-9);
  assert.ok(Math.abs(fxmod.densityFor('meriah', 800) - 0.8) < 1e-9);
});

test('previous silent Midnight default upgrades once to the live New Year stage', () => {
  const legacy = theme.normalizeSettings({ theme: 'midnight', motion: true, decorations: true });
  assert.equal(legacy.theme, 'tahun-baru');
  assert.equal(legacy.pattern, 'heritage');
  assert.equal(legacy.ambientRelease, theme.AMBIENT_RELEASE);
  const intentionallyMidnight = theme.normalizeSettings({ theme: 'midnight', ambientRelease: theme.AMBIENT_RELEASE });
  assert.equal(intentionallyMidnight.theme, 'midnight');
});

test('FX intensity setting migrates and survives bootstrap round-trip', () => {
  assert.equal(theme.normalizeSettings({}).fx, 'meriah');
  assert.equal(theme.normalizeSettings({ fx: 'lembut' }).fx, 'lembut');
  assert.equal(theme.normalizeSettings({ fx: 'mati' }).fx, 'mati');
  assert.equal(theme.normalizeSettings({ fx: 'party' }).fx, 'meriah');
  assert.equal(theme.normalizeSettings(null).fx, 'meriah');
  for (const level of ['meriah', 'lembut', 'mati']) {
    const settings = theme.normalizeSettings({ theme: 'imlek', fx: level });
    const before = fakeDocument();
    vm.runInNewContext(theme.THEME_BOOTSTRAP, { document: before.document, localStorage: { getItem: () => JSON.stringify(settings) } });
    assert.equal(before.document.documentElement.dataset.fx, level);
    const after = fakeDocument();
    global.document = after.document;
    theme.applySettings(settings);
    delete global.document;
    assert.equal(after.document.documentElement.dataset.fx, level);
  }
});
