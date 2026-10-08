import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { renderDetail } from '../js/app.mjs';

const records = JSON.parse(await readFile(new URL('../data/rads.json', import.meta.url), 'utf8'));
const expandedIds = ['a-rads','aem-rads','apendic-rads','ax-rads','bti-rads','cac-drs','cad-rads','cln-rads','co-x-rads','co-rads','covid-rads','eu-ti-rads','fap-rads','gb-rads','gi-rads','ild-rads','ilf-rads','k-ti-rads','ln-rads','lu-rads','met-rads','mi-rads','mski-rads','my-rads','node-rads','ns-rads','onco-rads','or-rads','ot-rads','plaque-rads','psma-rads','sstr-rads','su-rads','ae-rads','bt-rads','c-lung-rads','c-ti-rads','info-rads','ki-rads','moi-rads','ri-rads','st-rads','vi-rads','vp-rads','bone-incidental-rads'];

test('all remaining 45 records expose separate guides for all 46 local source identities', () => {
  let count = 0;
  for (const id of expandedIds) {
    const record = records.find(r => r.id === id);
    assert.deepEqual(record.detailedGuides?.map(g => g.sourceId), record.sources.map(s => s.id), id);
    count += record.detailedGuides.length;
    for (const guide of record.detailedGuides) {
      assert.ok(guide.examinations.length && guide.tables.length && guide.scoringRules.steps.length && guide.management.length && guide.cautions.length, id);
      for (const lang of ['zh','en']) {
        for (const value of [guide.title,guide.scope,guide.sourcePages,...guide.examinations.map(e => e.purpose),...guide.scoringRules.steps,...guide.management,...guide.cautions]) {
          assert.ok(typeof value[lang] === 'string' && value[lang].trim(), `${id}/${lang}`);
          assert.doesNotMatch(value[lang], /TODO|TBD|待补充|待核对/i);
        }
        assert.match(guide.sourcePages[lang], /\d/, `${id} page locator`);
        for (const table of guide.tables) {
          assert.ok(table.title[lang] && table.columns[lang].length >= 2 && table.rows.length, id);
          for (const row of table.rows) {
            assert.equal(row[lang].length, table.columns[lang].length, id);
            assert.ok(row[lang].every(cell => typeof cell === 'string' && cell.trim()), id);
          }
        }
      }
    }
  }
  assert.equal(count,46);
});

test('expanded guide content renders in both languages with scoped sources and unique headings', () => {
  for (const id of expandedIds) {
    const record = records.find(r => r.id === id);
    assert.ok(record.detailedGuides?.length, id);
    for (const lang of ['zh','en']) {
      const html = renderDetail(records,new URL(`https://example.test/?rads=${id}&lang=${lang}`));
      for (const guide of record.detailedGuides) {
        assert.ok(html.includes(guide.title[lang].replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')), `${id}/${lang} guide`);
      }
      const headings = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
      assert.equal(headings.length,new Set(headings).size,id);
      assert.doesNotMatch(html,/materials-local|content-workbench|>undefined<|\[object Object\]/);
    }
  }
});

test('concept and quality systems retain their actual non-lesion frameworks', () => {
  const guideText = id => JSON.stringify(records.find(r => r.id === id).detailedGuides);
  assert.match(guideText('ki-rads'), /hypothetical/i);
  assert.match(guideText('moi-rads'), /Bi/);
  assert.match(guideText('moi-rads'), /Cd/);
  assert.match(guideText('ri-rads'), /RI-RADS A/);
  assert.match(guideText('ae-rads'), /G\+/);
  assert.match(guideText('info-rads'), /message|Message/);
});

test('populated source-bound guides replace empty publication-only category and term panels', () => {
  const record = structuredClone(records.find(r => r.id === 'a-rads'));
  const guide = structuredClone(records.find(r => r.id === 'li-rads').detailedGuides[0]);
  guide.sourceId = record.sources[0].id;
  record.detailedGuides = [guide];
  for (const lang of ['zh','en']) {
    const html = renderDetail([record],new URL(`https://example.test/?rads=${record.id}&lang=${lang}`));
    assert.doesNotMatch(html,/分类定义请查阅原始发表文献|See the original publication for category definitions/);
    assert.ok(html.includes('scoring-guide-0'));
  }
  delete record.detailedGuides;
  assert.match(renderDetail([record],new URL(`https://example.test/?rads=${record.id}`)),/分类定义请查阅原始发表文献/);
});

test('source-specific high-impact criteria preserve modifiers, alternatives and scope', () => {
  const guides = id => records.find(r => r.id === id).detailedGuides;
  const rows = id => guides(id).flatMap(g => g.tables.flatMap(t => t.rows));
  const txt = id => JSON.stringify(guides(id));
  const lipomatous = rows('st-rads').find(r => r.en[0] === 'Lipomatous: >90% fat');
  assert.match(lipomatous.en[1], /thin septa OR <10% enhancement/i);
  assert.match(lipomatous.en[1], /few prominent vessels →4/i);
  const kt = rows('k-ti-rads').find(r => /comet.tail/i.test(r.en.join(' ')));
  assert.ok(kt);
  assert.match(kt.en.join(' '), /cystic (portion|component)/i);
  for (const word of ['5T','treated','3D']) assert.ok(txt('psma-rads').includes(word));
  assert.match(txt('bti-rads'), /XGBoost/);
  for (const word of ['>15','37','74']) assert.ok(txt('bti-rads').includes(word));
  assert.match(txt('node-rads'), /30 mm/);
  assert.match(txt('bone-incidental-rads'), /6, 6 and 12 months/);
  assert.match(txt('fap-rads'), /five key lesions|5 key lesions/i);
  assert.match(txt('onco-rads'), /Higher-risk: 3–5/);
});
