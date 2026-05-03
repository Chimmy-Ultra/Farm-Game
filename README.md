# 🌾 Farm Futures

> 寫實 2.5D 等角視角農場經營遊戲 + 農產品期貨避險機制
> Realistic 2.5D isometric farm management game with agricultural commodity futures hedging.

[![CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)
[![Deploy](../../actions/workflows/deploy.yml/badge.svg)](../../actions/workflows/deploy.yml)

## 介紹 / About

Farm Futures 是一款結合 Stardew Valley 級農場經營體驗與真實農產品期貨市場的策略遊戲。
玩家經營單一農場，種植 29 種作物 / 畜牧產品，同時透過期貨市場為自己的收成避險。

A farm-management strategy game that pairs Stardew-Valley-depth gameplay with realistic
agricultural commodity futures. You run a single farm, raise 29 crops / livestock products,
and hedge your harvest in a global futures market.

## 玩法亮點 / Highlights

- **單一農場 + 全球期貨代理**：你只看自己這塊地，但合約跟隨真實市場節奏起伏
- **避險為主、投機為輔**：tutorial 教你「鎖定未來賣價」；解鎖後可純投機
- **環境真實感**：ENSO 週期、季節、夜間機制（螢火蟲 / 夜間作物 / 老鼠害蟲）
- **歷史彩蛋**：2012 大旱、2018 中國 ASF、2004 大豆銹病等真實事件以新聞形式觸發
- **半透明資訊揭露**：新聞 + 歷史對照，無上帝視角數值
- **中英雙語**：i18n from day one

## 技術棧 / Tech Stack

TypeScript · Vite · React 18 · Three.js / R3F · Zustand · Tailwind CSS · Zod · i18next

部署於 GitHub Pages。

## 線上 demo / Live demo

部署設定完成後會出現在這裡：`https://<account>.github.io/<repo-name>/`

## 快速啟動 / Quick start

```bash
npm install
npm run dev          # 本地開發 http://localhost:5173
npm run typecheck    # TypeScript 檢查
npm run build        # 生產 build
npm run preview      # 預覽 build 結果
```

## 專案文件 / Project docs

- [reference/GAMEPLAY_DECISIONS.md](reference/GAMEPLAY_DECISIONS.md) — 玩法 / 系統決策
- [reference/ALIGNMENT_v1.md](reference/ALIGNMENT_v1.md) — 跨 AI session 對齊文件
- [reference/ART_DIRECTION.md](reference/ART_DIRECTION.md) — 美術方向
- [docs/economic-model.md](docs/economic-model.md) — 期貨經濟模型
- [docs/environmental-systems.md](docs/environmental-systems.md) — 環境系統
- [docs/asset-prompts.md](docs/asset-prompts.md) — AI 美術 prompt 庫

## 合作 / Contributing

歡迎合作。請先讀 [CONTRIBUTING.md](CONTRIBUTING.md)；如果你是 AI session，務必讀 [CLAUDE.md](CLAUDE.md)。

## License

TBD（作品集 / 學習用途）
