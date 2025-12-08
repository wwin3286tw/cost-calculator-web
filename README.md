# 3D 列印成本計算機 (Web)

此專案提供瀏覽器即可使用的 3D 列印成本計算工具，將逐步顯示每個成本項目的計算過程，方便分享與複製。所有耗材價格皆來自淘寶，同步加上 45 TWD/kg × 1.3 kg 的集運成本，故預設值相對便宜；若有不同採購來源，歡迎 fork 專案自行調整。原始碼採自由改作、可商用、無須記名授權，使用者可依需求延伸。

## 功能亮點

- 內建 P1S / P2S / H2S 印表機與 PLA、ABS/ASA…等耗材檔案，可自動帶出建議折舊、功率與噴嘴攤提成本。
- 耗材選單整合拓竹 / SUNLU 第一梯隊價格（人民幣 + 集運 45TWD/kg × 1.3kg），可快速切換 PLA、ASA、ABS、ABS FR、ABS-GF，以及 TPU 95A / TPU for AMS。
- 選擇「自定義價格」時會顯示專屬輸入框，並會同步記錄於分享連結中。
- 顯示「機器折舊 / 噴嘴攤提」公式：機台以 4000 小時折舊、噴嘴依材料分類 (30kg / 10kg) 攤提並換算此次列印重量。
- 提供噴嘴類型選擇，高流量與一般熱端對應不同價格。
- 可複製整份計算文字方便貼進 IM 或工單。
- 產生專屬參數連結，一鍵分享給同事重現相同設定，亦可用「清除當前參數」快速恢復預設值與網址。

## 使用方式

### 透過靜態伺服器快速預覽

1. 使用任何靜態伺服器（例如 `python3 -m http.server 8000` 或 `php -S 0.0.0.0:8000`）啟動專案目錄。
2. 在瀏覽器開啟 `http://localhost:8000/index.html`，輸入列印參數後按下「計算成本」。

### 使用 Docker

從專案根目錄執行下列指令，依需求挑選對應的 Dockerfile：

| Web Server | 建置與執行指令 |
| --- | --- |
| nginx | `docker build -f docker/nginx/Dockerfile -t cost-calculator-web:nginx .`<br>`docker run --rm -p 8080:80 cost-calculator-web:nginx` |
| Apache (httpd:2.4) | `docker build -f docker/apache/Dockerfile -t cost-calculator-web:apache .`<br>`docker run --rm -p 8080:80 cost-calculator-web:apache` |
| httpd (Alpine) | `docker build -f docker/httpd/Dockerfile -t cost-calculator-web:httpd .`<br>`docker run --rm -p 8080:80 cost-calculator-web:httpd` |

執行後即可在 `http://localhost:8080` 使用成本計算器。

計算完成後，可利用結果區右上方按鈕複製計算文字或分享帶參數連結。若僅需快速檢視，也可以直接以檔案模式開啟 `index.html`。

---

## English Overview

This repository hosts a browser-based 3D printing cost calculator with sharable URLs, clipboard exports, and printer/material presets.

### Highlights

- Built-in presets for Bambu Lab P1S/P2S/H2S, including depreciation (4,000 h lifetime), power profiles, and nozzle amortization.
- Filament prices are sourced from Taobao plus an additional 45 TWD/kg × 1.3 kg consolidation fee, so the defaults are intentionally low-cost. Feel free to fork and replace them to match your vendor.
- Material selector covers PLA/PETG, ASA, ABS, ABS FR, ABS-GF, TPU 95A, and TPU for AMS, plus a custom-price mode.
- Nozzle wear is calculated per kilogram (30 kg for general materials, 10 kg for CF) and shown alongside the machine depreciation formula.
- Results can be copied as text or shared through a generated URL; “Clear Parameters” resets the form and the query string.

### Usage

**Quick preview:** Serve the repository root with any static server (e.g., `python3 -m http.server 8000` or `php -S 0.0.0.0:8000`), then open `http://localhost:8000/index.html`.

**Docker options:** Build and run one of the provided images:

| Web Server | Commands |
| --- | --- |
| nginx | `docker build -f docker/nginx/Dockerfile -t cost-calculator-web:nginx .`<br>`docker run --rm -p 8080:80 cost-calculator-web:nginx` |
| Apache (httpd:2.4) | `docker build -f docker/apache/Dockerfile -t cost-calculator-web:apache .`<br>`docker run --rm -p 8080:80 cost-calculator-web:apache` |
| httpd (Alpine) | `docker build -f docker/httpd/Dockerfile -t cost-calculator-web:httpd .`<br>`docker run --rm -p 8080:80 cost-calculator-web:httpd` |

After launching, browse to `http://localhost:8080` to use the calculator.

The project is open for modification, commercial use, and redistribution without attribution—fork it and adapt it to your workflow.
