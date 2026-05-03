# 合作指南 / Contributing

> 這份文件給**人類合作者**看。如果你是 AI session，請改讀 [CLAUDE.md](CLAUDE.md)。

歡迎加入 Farm Futures。下面說明工作流，**第一次合作前請完整讀過**。

---

## 1. 角色 / Roles

| 角色 | 做什麼 | 怎麼貢獻 |
|---|---|---|
| **Owner**（Kevin） | 產品決策、PR 最終 review、merge | GitHub web UI |
| **Coder via AI** | 透過自己的 AI session 寫代碼，不直接寫 | 自己的 AI 開 PR |
| **Asset Contributor**（畫師 / 音樂） | 交付圖片 / 音檔 | 把成品交給 AI session 整理；或用 GitHub web UI 直接 drag-drop 到 `public/assets/` |

**沒寫過代碼？沒關係。** 只要會：
1. 在 GitHub 上開 issue 描述你想做什麼 / 看到什麼 bug
2. 開新 chat 跟 AI 說「處理 issue #N」，讓 AI 自己推 branch 跟 PR
3. 在 PR 頁面看 reviewer 留言，跟 AI 說「reviewer 說 X，你修一下」

就足夠了。

---

## 2. Branch 模型 / Branch Model

| Branch | 用途 | 規則 |
|---|---|---|
| `main` | 隨時可 deploy 的穩定版本 | **受保護**——只能透過 PR 進入；禁止 force-push；CI 必須通過 |
| `feat/<name>` | 新功能 | 一個 issue 一條 branch |
| `fix/<name>` | bug 修復 | 同上 |
| `chore/<name>` | 設定 / 工具類改動 | 同上 |
| `docs/<name>` | 文件改動 | 同上 |
| `assets/<name>` | 美術 / 音樂資產 | 同上 |

> Branch 名稱用**英文 kebab-case**，例如 `feat/night-firefly-particles`、`fix/seed-cost-overflow`。

---

## 3. 標準工作流（5 步）/ Standard Workflow

### Step 1. 開 / 認領 Issue

從 GitHub Issues 開新單，或從 Project 看板認領現成的。
新 issue 用模板填好「為什麼 / 接受標準 / 截圖」。

### Step 2. 開 Branch

```bash
git pull origin main          # 一定要先 pull
git checkout -b feat/your-thing
```

### Step 3. 動工 + Commit

- Commit 訊息用**中英文皆可**，但要描述**做了什麼 + 為什麼**
- 一個 commit 做一件事，不要把無關改動塞在一起
- 不要 `git add -A`，請 `git add <specific files>`

### Step 4. 推 + 開 PR

```bash
git push -u origin feat/your-thing
```

到 GitHub 開 PR，**標題格式**：`[#<issue-id>] 一句話描述`，例如 `[#42] 加入夜間螢火蟲粒子`。
PR 模板會自動套上，把空格填掉。

### Step 5. 等 Review + Merge

- CI（typecheck + build）會自動跑，必須全綠
- Reviewer（預設 Kevin）批准後可以 squash & merge
- Merge 後 GitHub Actions 會自動 deploy 到 GitHub Pages

---

## 4. PR 必備 / PR Requirements

每個 PR 都要：

- [ ] Link 到 issue（`Closes #N`）
- [ ] 列出 touched files
- [ ] **UI 改動 → 附 before/after 截圖**
- [ ] **玩法改動 → 附操作步驟**讓 reviewer 可以照著驗
- [ ] CI 綠燈
- [ ] Reviewer 看得懂為什麼這樣做（給非工程審查者一段白話說明）

詳見 [.github/pull_request_template.md](.github/pull_request_template.md)。

---

## 5. 美術 / 音樂資產通道

### 你不會 git？沒關係，三條路：

**路 A — 交給 AI session（最推薦）**
1. 把成品檔案丟到約定的共享位置（Notion / Google Drive / Dropbox）
2. 告訴 AI session：「我交付了 X 圖到 Y 位置，請整理進 repo」
3. AI session 會開 PR 把檔案放進 `public/assets/<分類>/`

**路 B — GitHub web UI 直接拖拉**
1. 登入 GitHub，到 repo 裡
2. 進入 `public/assets/incoming/` 資料夾
3. 點 `Add file` → `Upload files` → 把檔案拖進去
4. 下方會出現 `Commit changes`，選「Create a new branch and start a pull request」
5. 開好 PR 後 AI session 會接手整理路徑跟引用

**路 C — 設計檔（PSD / Figma / Procreate）**
不要 commit 大型原始檔到 repo。把它們放 Notion 連結 / 雲端硬碟，repo 裡只放**輸出後的 PNG / WebP / OGG / WAV**。

### 命名規則

- 全小寫 + kebab-case：`tomato-mature.png`，不要 `Tomato Mature.png`
- 作物精靈 → `public/crops/<commodity-id>-<stage>.png`
- 場景圖 → `public/scenes/<scene-name>.png`
- 音效 → `public/audio/<category>/<name>.ogg`

---

## 6. Issue 模板 / Issue Templates

點 **New issue** 會看到三種模板：

| 模板 | 用在哪 |
|---|---|
| 🚀 Feature | 新功能、新作物、新天氣事件 |
| 🐛 Bug | 玩起來壞掉了 |
| 🎨 Asset Request | 我需要一張圖 / 一段音 |

詳見 [.github/ISSUE_TEMPLATE/](.github/ISSUE_TEMPLATE/)。

---

## 7. 常見問題 / FAQ

**Q：我跟 AI 講話講半天，AI 寫的代碼壞了 CI，怎麼辦？**
A：把 CI 紅色錯誤訊息整段貼回 chat，跟 AI 說「修一下」。它會看 log 自己改。

**Q：我 PR 開錯 branch 了**
A：在 PR 頁面右上角可以改 base branch；或乾脆關掉重開。

**Q：我看不懂 reviewer 寫什麼**
A：把 review 留言整段貼給 AI，請它解釋 + 改。

**Q：我不小心推到 main 怎麼辦？**
A：分支保護會擋下來；如果擋不住請馬上喊 Kevin。

**Q：另一個 AI 跟我同時改同一個檔，merge conflict 了**
A：不要硬蓋。把 conflict 整段貼給 AI，請它依照 [CLAUDE.md](CLAUDE.md) 的「檔案歸屬規則」決定誰留誰退。

---

## 8. 行為準則 / Code of Conduct

- **不要 force-push 到別人的 branch**
- **不要刪除別人的 commit**
- **不要繞過 CI**（`--no-verify` 之類）
- **不要 commit 私人 token / 帳密**
- **意見不合時走 issue 討論，不要在 PR 互改**
