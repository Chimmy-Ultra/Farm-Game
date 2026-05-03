/**
 * Extract all AI image prompts from docs/asset-prompts.md
 * into copy-paste friendly formats.
 *
 * Outputs:
 *   assets/prompts.txt   — human-readable, grouped by commodity
 *   assets/prompts.csv   — id,category,commodity,stage,prompt
 *   assets/prompts.json  — structured for API batch scripts
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '..');

const src = readFileSync(resolve(root, 'docs/asset-prompts.md'), 'utf8');
const lines = src.split(/\r?\n/);

// High-level category header:  "## 穀物類 Grains"
const categoryRe = /^##\s+(.+)$/;
// Numbered commodity header:   "### 1. 玉米 Corn（...）"
const commodityNumberedRe = /^###\s+(\d+)\.\s+(.+)$/;
// Un-numbered sub-heading in processing goods: "### 豆類加工品 Soybean Products"
const commodityPlainRe = /^###\s+([^\d].+)$/;
// Stage/variant label:         "**Stage 1 — 幼苗 ...**" or "**豆粕 Soybean Meal**"
const labelRe = /^\*\*([^*].+?)\*\*$/;
// Prompt line (entire line in backticks): starts & ends with `
const promptRe = /^`(.+)`$/;

const results = [];
let currentCategory = '';
let currentCommodity = '';
let currentNumber = '';      // "1"-"25" for main items, "" for processing
let currentStage = '';
let id = 0;

for (let i = 0; i < lines.length; i++) {
  const ln = lines[i].trim();
  if (!ln) continue;

  const cat = ln.match(categoryRe);
  if (cat) {
    const name = cat[1].trim();
    // Skip non-section h2s like 目錄 / 專案簡介 / 風格原則
    if (
      name.startsWith('目錄') ||
      name.startsWith('專案簡介') ||
      name.startsWith('風格原則') ||
      name.startsWith('附錄') ||
      name.startsWith('使用建議')
    ) {
      currentCategory = '';
    } else {
      currentCategory = name;
    }
    currentCommodity = '';
    currentNumber = '';
    currentStage = '';
    continue;
  }

  const numbered = ln.match(commodityNumberedRe);
  if (numbered) {
    currentNumber = numbered[1];
    currentCommodity = numbered[2].trim();
    currentStage = '';
    continue;
  }

  const plain = ln.match(commodityPlainRe);
  if (plain) {
    currentCommodity = plain[1].trim();
    currentNumber = '';
    currentStage = '';
    continue;
  }

  const lbl = ln.match(labelRe);
  if (lbl) {
    currentStage = lbl[1].trim();
    continue;
  }

  const pr = ln.match(promptRe);
  if (pr && currentCategory && currentCommodity) {
    id++;
    results.push({
      id: String(id).padStart(3, '0'),
      category: currentCategory,
      commodity: currentCommodity,
      commodityNumber: currentNumber,
      stage: currentStage || '(single)',
      prompt: pr[1].trim(),
    });
    continue;
  }
}

// ---------- Output: plain text ----------
const txtOut = [];
txtOut.push('# 農場遊戲 — AI 圖片生成 Prompt 清單 (可直接複製)');
txtOut.push(`# 自動從 docs/asset-prompts.md 抽出 — ${new Date().toISOString().slice(0, 10)}`);
txtOut.push(`# 共 ${results.length} 條 prompt`);
txtOut.push('');
txtOut.push('# ===== 使用方式 =====');
txtOut.push('# 貼到 Midjourney / Flux / ChatGPT 圖片生成時，可直接複製單行 prompt。');
txtOut.push('# 若你用 Midjourney，建議末尾加: --ar 1:1 --style raw');
txtOut.push('# 若你用 Flux / SDXL，建議 CFG=3-5，採樣 28 步。');
txtOut.push('');

let lastCategory = '';
let lastCommodity = '';
for (const r of results) {
  if (r.category !== lastCategory) {
    txtOut.push('');
    txtOut.push(`# ================ ${r.category} ================`);
    lastCategory = r.category;
    lastCommodity = '';
  }
  if (r.commodity !== lastCommodity) {
    txtOut.push('');
    const label = r.commodityNumber ? `${r.commodityNumber}. ${r.commodity}` : r.commodity;
    txtOut.push(`## ${label}`);
    lastCommodity = r.commodity;
  }
  txtOut.push(`[${r.id}] ${r.stage}`);
  txtOut.push(r.prompt);
  txtOut.push('');
}

// ---------- Output: CSV ----------
const csvEscape = (s) => `"${String(s).replace(/"/g, '""')}"`;
const csvOut = ['id,category,commodity,number,stage,prompt'];
for (const r of results) {
  csvOut.push(
    [r.id, r.category, r.commodity, r.commodityNumber, r.stage, r.prompt]
      .map(csvEscape)
      .join(','),
  );
}

// ---------- Output: JSON ----------
const jsonOut = JSON.stringify(
  {
    generatedAt: new Date().toISOString(),
    source: 'docs/asset-prompts.md',
    count: results.length,
    prompts: results,
  },
  null,
  2,
);

// ---------- Write ----------
const outDir = resolve(root, 'assets');
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'prompts.txt'), txtOut.join('\n'), 'utf8');
writeFileSync(resolve(outDir, 'prompts.csv'), csvOut.join('\n'), 'utf8');
writeFileSync(resolve(outDir, 'prompts.json'), jsonOut, 'utf8');

// ---------- Stats ----------
const byCategory = {};
for (const r of results) byCategory[r.category] = (byCategory[r.category] || 0) + 1;

console.log(`\n✅ 抽取完成 — 共 ${results.length} 條 prompt\n`);
console.log('各類別統計：');
for (const [cat, count] of Object.entries(byCategory)) {
  console.log(`  ${cat.padEnd(30)}  ${count} 條`);
}
console.log('\n輸出檔案：');
console.log(`  assets/prompts.txt   — 人讀，分章節`);
console.log(`  assets/prompts.csv   — 匯入 Excel / Notion`);
console.log(`  assets/prompts.json  — 給批次 API 腳本用`);
