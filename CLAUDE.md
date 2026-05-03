# CLAUDE.md — AI Session 護欄

> **任何在這個 repo 工作的 AI session（包括 Claude、其他 LLM）都必須先讀這份**。
> 如果你是人類，請改讀 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## 0. 專案定位

`Farm Futures` 是寫實 2.5D 等角視角農場遊戲 + 真實農產品期貨機制。
詳細決策見：

- [reference/GAMEPLAY_DECISIONS.md](reference/GAMEPLAY_DECISIONS.md) — 玩法 / 系統決策
- [reference/ALIGNMENT_v1.md](reference/ALIGNMENT_v1.md) — **跨 AI session 對齊文件，動工前先讀**
- [reference/ART_DIRECTION.md](reference/ART_DIRECTION.md) — 美術方向
- [docs/economic-model.md](docs/economic-model.md) — 期貨經濟模型
- [docs/environmental-systems.md](docs/environmental-systems.md) — 環境系統

**這個專案有多個 AI session 並行工作**——你不是唯一在動 repo 的 AI。
**動工前必做**：`git pull origin main` → 看 [reference/ALIGNMENT_v1.md](reference/ALIGNMENT_v1.md) 是否有更新 → 開新 branch。

---

## 1. 檔案歸屬規則 / File Ownership

避免兩個 session 同時改到同一個檔。

| 路徑 | 歸屬 | 規則 |
|---|---|---|
| `src/data/commodities.ts` | **Notion 邊 SSOT 自動產生** | 🚫 不要手改。需要新增 / 改規格 → 改 Notion DB → 等同步 |
| `docs/economic-model.md` | Notion 邊維護 | 這邊 session 不主動改；發現衝突先在 [reference/ALIGNMENT_v1.md](reference/ALIGNMENT_v1.md) 紀錄 |
| `docs/environmental-systems.md` | Notion 邊維護 | 同上 |
| `docs/asset-prompts.md` | Notion 邊維護 | 同上 |
| `docs/commodity-list-reconciliation.md` | Notion 邊維護 | 同上 |
| `reference/GAMEPLAY_DECISIONS.md` | 這邊維護 | Notion 邊不主動改 |
| `reference/ALIGNMENT_v1.md` | 共用 | 兩邊都可以加新衝突紀錄；不要刪除別人寫的條目 |
| `reference/ART_DIRECTION.md` | 這邊維護 | 同上 |
| `src/**/*.tsx`、`src/**/*.ts`（除 commodities.ts） | 共用 | 兩邊都可改，但**一定要走 PR**，不要直接推 main |
| `public/assets/**` | 共用 | 任何 session 都可以加；**不要刪別人的** |
| `public/assets/incoming/` | 暫存區 | 美術貢獻者上傳區，整理後移到正式分類資料夾 |
| `scripts/**` | 共用 | 加新 script 沒問題；改現有 script 前看 git blame |

**衝突時的決策順序**：
1. Notion DB 內容 > 本地 `docs/`（如果 docs 過時了，更新 docs）
2. `reference/GAMEPLAY_DECISIONS.md` 跟 Notion Design Decisions 衝突 → 看 [reference/ALIGNMENT_v1.md](reference/ALIGNMENT_v1.md) 的「待 Kevin 裁決」清單
3. 兩個 session 邏輯衝突 → 各自開 PR，Kevin 選一個 merge

---

## 2. Branch / PR 守則

### Branch
- ❌ 永遠不要直接 commit 到 `main`
- ✅ 開新 branch：`feat/<name>` / `fix/<name>` / `chore/<name>` / `docs/<name>` / `assets/<name>`
- ✅ Branch 名稱英文 kebab-case，描述要具體

### Commit
- 訊息用中英文皆可，描述「做了什麼 + 為什麼」
- 一個 commit 做一件事
- ❌ 不要 `git add -A` / `git add .`，用 `git add <specific files>`
- ❌ 不要 commit `node_modules/`、`.env*`、`.claude/settings.local.json`、`*.tsbuildinfo`
- ❌ **絕對不要** commit API key / token / 密碼

### PR
- 標題：`[#<issue-id>] 一句話描述`
- 描述必填（見 [.github/pull_request_template.md](.github/pull_request_template.md)）：
  - `Closes #<issue-id>`
  - **What changed**（條列）
  - **Why this approach**（給非工程 reviewer 看的白話）
  - **How to verify**（reviewer 怎麼驗，UI 改動附截圖）
  - **Touched files**
- 一個 PR 只解一個 issue；橫跨多議題就拆
- ❌ 不要 force-push 到別人的 branch
- ❌ 不要用 `--no-verify` 跳過 hook
- ❌ CI 紅燈不要硬 merge

---

## 3. 給 Kevin 看的 Review 友善度

Kevin **不寫不看代碼**，他靠：
- PR 描述的白話說明
- 截圖 / 操作步驟
- GitHub Pages 上 deploy 出來的成果

所以 PR 要：
- ✅ UI 改動一律附 before/after 截圖
- ✅ 玩法改動寫清楚「玩家會看到什麼變化、怎麼操作」
- ✅ 純內部重構也說一段「為什麼要這樣改、玩家感覺得到嗎」
- ❌ 不要假設 reviewer 看得懂 diff

---

## 4. 美術 / 音樂貢獻者來的東西

如果合作者 / 美術交付素材給你，你要負責：
1. 檢查命名（小寫 kebab-case）
2. 放到正確路徑（`public/crops/`、`public/scenes/`、`public/audio/`）
3. 必要時用 [scripts/remove-white-bg.mjs](scripts/remove-white-bg.mjs) 等既有 script 做後處理
4. 更新 [src/assets/cropSprites.ts](src/assets/cropSprites.ts) 等引用對照表
5. PR 描述附**新加入的素材縮圖**

---

## 5. CI / Build

每個 PR 跑：
- `npm ci`
- `npm run typecheck`
- `npm run build`

**任一失敗 = 不可 merge**。修法：
- TypeScript 錯：讀錯誤訊息修，不要用 `any` 強壓
- Build 錯：通常是 import path / asset path 問題
- 不要為了綠燈把 strict 關掉

---

## 6. 不要做的事

- 🚫 改 `git config`（除非 user 指示）
- 🚫 force push 到 `main` 或別人的 branch
- 🚫 跳過 CI / pre-commit hook
- 🚫 直接編輯 `src/data/commodities.ts`（Notion SSOT）
- 🚫 大改 `package.json` 而沒在 PR 解釋為什麼
- 🚫 隨便加新 dependency（先在 issue 討論）
- 🚫 動 `.github/workflows/` 不附測試證明
- 🚫 commit 任何含 secret / token / 私人路徑（如 `C:/Users/kevin/...`）的內容
- 🚫 假設你是唯一在動 repo 的 session

---

## 7. 動工前 Checklist

開始改任何東西前，回答這 5 題：

1. ✅ 我有先 `git pull origin main` 嗎？
2. ✅ 我有讀 [reference/ALIGNMENT_v1.md](reference/ALIGNMENT_v1.md) 最新狀態嗎？
3. ✅ 我要動的檔案在「檔案歸屬規則」表上是不是別人的？
4. ✅ 我有對應的 GitHub Issue 嗎？沒有就先開一個
5. ✅ 我開的 branch 是不是 `feat/` / `fix/` / `chore/` / `docs/` / `assets/` 開頭？

5 題都 ✅ 才動手。
