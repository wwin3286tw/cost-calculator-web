const RMB_TO_TWD = 4.5;
const CONSOLIDATION_WEIGHT_KG = 1.3;
const CONSOLIDATION_FEE_TWD = 45;
const SHIPPING_SURCHARGE_TWD = CONSOLIDATION_WEIGHT_KG * CONSOLIDATION_FEE_TWD;
const CUSTOM_MATERIAL_ID = "custom";
const MACHINE_LIFETIME_HOURS = 4000;
const NOZZLE_LIFETIME_KG = {
  general: 30,
  cf: 10,
};

function filamentCostTwd(priceRmb) {
  return priceRmb * RMB_TO_TWD + SHIPPING_SURCHARGE_TWD;
}

const MACHINE_PRESETS = {
  P1S: {
    label: "Bambu Lab P1S",
    priceTwd: 27500,
    powerProfiles: {
      standard: 0.241, // 241 W (熱端+熱床典型功率)
      engineering: 0.249, // 248.81 W (熱端+熱床 PID 動態）
    },
    nozzles: [
      { id: "p1s-normal", label: "一般熱端 (P1S)", priceRmb: 84.15 },
    ],
  },
  P2S: {
    label: "Bambu Lab P2S",
    priceTwd: 29900,
    powerProfiles: {
      standard: 0.27, // 270 W (一般材料)
      engineering: 0.37, // 370 W (工程材料+倉溫/熱床長時間)
    },
    nozzles: [
      { id: "p2s-standard", label: "一般熱端 (P2S)", priceRmb: 119 },
      { id: "p2s-hf", label: "高流量熱端 (P2S)", priceRmb: 239 },
    ],
  },
  H2S: {
    label: "Bambu Lab H2S",
    priceTwd: 46000,
    powerProfiles: {
      standard: 0.26,
      engineering: 0.336,
    },
    nozzles: [
      { id: "h2s-normal", label: "一般熱端 (H2S)", priceRmb: 119 },
      { id: "h2s-hf", label: "高流量熱端 (H2S)", priceRmb: 239 },
    ],
  },
};

const MATERIAL_OPTIONS = [
  { id: "pla_petg", label: "PLA / PETG", profile: "standard", materialClass: "general", costTwd: filamentCostTwd(50), note: "一般材料，無需加熱倉" },
  { id: "asa", label: "ASA", profile: "engineering", materialClass: "general", costTwd: filamentCostTwd(70), note: "工程材料，需倉溫加熱" },
  { id: "abs", label: "ABS", profile: "engineering", materialClass: "general", costTwd: filamentCostTwd(60), note: "工程材料，需倉溫加熱" },
  { id: "abs_fr", label: "ABS FR (阻燃)", profile: "engineering", materialClass: "general", costTwd: filamentCostTwd(80), note: "耐火阻燃等級" },
  { id: "abs_gf", label: "ABS-GF (玻纖)", profile: "engineering", materialClass: "cf", costTwd: filamentCostTwd(103), note: "玻纖增強 ABS" },
  { id: "tpu_95a", label: "TPU 95A", profile: "standard", materialClass: "general", costTwd: filamentCostTwd(170), note: "柔性耗材，一般 95A 硬度" },
  { id: "tpu_ams", label: "TPU for AMS (68D)", profile: "standard", materialClass: "general", costTwd: filamentCostTwd(145), note: "AMS 友善 68D TPU" },
  { id: CUSTOM_MATERIAL_ID, label: "自定義價格", profile: "engineering", materialClass: "general", custom: true, note: "自訂每公斤成本" },
];

const DEFAULT_SELECTS = {
  machine: "P1S",
  material: MATERIAL_OPTIONS[0].id,
  nozzle: MACHINE_PRESETS.P1S.nozzles[0].id,
};

const defaultNozzle = MACHINE_PRESETS[DEFAULT_SELECTS.machine].nozzles[0];
const defaultMaterialLifetimeKg = getMaterialLifetimeKg(DEFAULT_SELECTS.material);
const DEFAULT_VALUES = {
  weight_g: 120,
  hours: 3,
  minutes: 15,
  material_cost_per_kg: getMaterialCostById(DEFAULT_SELECTS.material) ?? 300,
  depreciation_per_hour: getMachineDepreciation(DEFAULT_SELECTS.machine),
  power_kw: MACHINE_PRESETS.P1S.powerProfiles.standard,
  electricity_cost_per_kwh: 3,
  nozzle_cost_per_kg: calculateNozzleCostPerKg(defaultNozzle.priceRmb, defaultMaterialLifetimeKg),
  labor_rate_per_hour: 0,
  labor_hours: 0,
  overhead_per_unit: 0,
};

const FIELD_CONFIG = [
  { name: "weight_g", label: "列印重量 (克)", min: 0, step: 1 },
  { name: "hours", label: "列印時間 (小時)", min: 0, step: 0.25 },
  { name: "minutes", label: "列印時間 (分鐘)", min: 0, max: 59, step: 1 },
  { name: "material_cost_per_kg", label: "耗材成本 (TWD/kg)", min: 0, step: 0.01 },
  { name: "depreciation_per_hour", label: "機器折舊成本 (TWD/h)", min: 0, step: 0.01 },
  { name: "power_kw", label: "列印功率 (kW)", min: 0, step: 0.001 },
  { name: "electricity_cost_per_kwh", label: "電費單價 (TWD/kWh)", min: 0, step: 0.1 },
  { name: "nozzle_cost_per_kg", label: "噴嘴攤提成本 (TWD/kg)", min: 0, step: 0.01 },
  { name: "labor_rate_per_hour", label: "人力時薪 (TWD/h)", min: 0, step: 1 },
  { name: "labor_hours", label: "人力工時 (小時)", min: 0, step: 0.25 },
  { name: "overhead_per_unit", label: "間接成本/每件 (TWD)", min: 0, step: 1 },
];

const urlParams = new URLSearchParams(window.location.search);
const initialState = buildInitialState(urlParams);
const initialInputs = initialState.inputs;

const machineOptionsMarkup = Object.entries(MACHINE_PRESETS)
  .map(([value, data]) => `<option value="${value}" ${value === initialState.machine ? "selected" : ""}>${data.label}</option>`)
  .join("");

const materialOptionsMarkup = MATERIAL_OPTIONS.map((option) => {
  const attr = option.id === initialState.material ? "selected" : "";
  return `<option value="${option.id}" ${attr}>${option.label}</option>`;
}).join("");

const app = document.getElementById("app");

const formFieldsMarkup = FIELD_CONFIG.map((field) => {
  const optional = (attribute, value) => (value !== undefined ? `${attribute}="${value}"` : "");
  const isMaterialCost = field.name === "material_cost_per_kg";
  const attributes = [
    `for="${field.name}"`,
    isMaterialCost ? 'class="custom-material-field"' : "",
    isMaterialCost ? "data-custom-material-field" : "",
    isMaterialCost && initialState.material !== CUSTOM_MATERIAL_ID ? "hidden" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `
    <label ${attributes}>
      ${field.label}
      <input
        id="${field.name}"
        name="${field.name}"
        type="number"
        inputmode="decimal"
        ${optional("min", field.min)}
        ${optional("max", field.max)}
        ${optional("step", field.step)}
        value="${initialInputs[field.name]}"
        required
      />
    </label>
  `;
}).join("");

app.innerHTML = `
  <div class="container">
    <h1>3D 列印成本計算機</h1>
    <p class="lead">輸入列印條件與成本參數，即可即時取得逐步計算結果，並支援分享連結與複製輸出。</p>
    <form id="cost-form">
      <div class="select-grid">
        <label for="machine-select">
          印表機型號
          <select id="machine-select" name="machine">
            ${machineOptionsMarkup}
          </select>
        </label>
        <label for="material-select">
          耗材類型
          <select id="material-select" name="material">
            ${materialOptionsMarkup}
          </select>
        </label>
        <label for="nozzle-select">
          噴嘴 / 熱端
          <select id="nozzle-select" name="nozzle"></select>
        </label>
      </div>
      ${formFieldsMarkup}
      <div class="actions">
        <button type="submit" class="calculate">計算成本</button>
        <button type="button" class="reset" id="reset-btn">重設</button>
      </div>
    </form>
    <section class="results">
      <div class="results-header">
        <h2>計算結果</h2>
        <div class="result-actions">
          <button type="button" id="copy-btn" disabled>複製計算文字</button>
          <button type="button" id="share-btn" disabled>分享連結</button>
          <button type="button" id="clear-btn">清除當前參數</button>
        </div>
      </div>
      <p id="result-placeholder" class="placeholder">請輸入參數並按下「計算成本」以查看詳細計算。</p>
      <div id="result-inputs" class="result-group"></div>
      <div id="result-steps" class="result-group"></div>
      <div id="result-total" class="total"></div>
      <div id="result-formulas" class="result-group formula-group"></div>
      <p class="hint">電力／折舊／噴嘴成本會依印表機與耗材類型自動建議，可視需求再微調。</p>
    </section>
  </div>
`;

const form = document.getElementById("cost-form");
const resetButton = document.getElementById("reset-btn");
const placeholder = document.getElementById("result-placeholder");
const inputsBlock = document.getElementById("result-inputs");
const stepsBlock = document.getElementById("result-steps");
const totalBlock = document.getElementById("result-total");
const formulasBlock = document.getElementById("result-formulas");
const machineSelect = document.getElementById("machine-select");
const materialSelect = document.getElementById("material-select");
const nozzleSelect = document.getElementById("nozzle-select");
const copyButton = document.getElementById("copy-btn");
const shareButton = document.getElementById("share-btn");
const clearParamsButton = document.getElementById("clear-btn");
const customMaterialField = document.querySelector("[data-custom-material-field]");
const materialCostInput = document.getElementById("material_cost_per_kg");

let lastResultText = "";
let lastResultValues = null;
let lastMaterialSelection = initialState.material;
let customMaterialCost = initialInputs.material_cost_per_kg;

populateNozzleOptions(initialState.machine, initialState.nozzle);
const needsMaterialCost = !urlParams.has("material_cost_per_kg");
const needsNozzleFromQuery = !(urlParams.has("nozzle_cost_per_kg") || urlParams.has("nozzle_cost_per_hour"));
applyMaterialPreset({ forceCostUpdate: needsMaterialCost, overrideNozzleCost: needsNozzleFromQuery });

if (!initialState.hasQueryParams) {
  applyMachinePreset({ overrideDepreciation: true, overridePower: true, overrideNozzleCost: true });
} else {
  const needsDep = !urlParams.has("depreciation_per_hour");
  const needsPower = !urlParams.has("power_kw");
  const needsNozzle = !(urlParams.has("nozzle_cost_per_kg") || urlParams.has("nozzle_cost_per_hour"));
  if (needsDep || needsPower || needsNozzle) {
    applyMachinePreset({
      overrideDepreciation: needsDep,
      overridePower: needsPower,
      overrideNozzleCost: needsNozzle,
    });
  }
}

if (initialState.shouldAutoCalculate) {
  triggerCalculation();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  triggerCalculation();
});

resetButton.addEventListener("click", () => {
  resetFormToDefaults();
  clearResults();
  history.replaceState({}, document.title, window.location.pathname);
});

machineSelect.addEventListener("change", () => {
  populateNozzleOptions(machineSelect.value);
  applyMachinePreset({ overrideDepreciation: true, overridePower: true, overrideNozzleCost: true });
});

materialSelect.addEventListener("change", () => {
  if (lastMaterialSelection === CUSTOM_MATERIAL_ID) {
    const raw = materialCostInput.value;
    if (raw !== "") {
      customMaterialCost = toNumber(raw);
    }
  }
  lastMaterialSelection = materialSelect.value;
  applyMaterialPreset({ forceCostUpdate: true, overrideNozzleCost: true });
  applyMachinePreset({ overrideDepreciation: false, overridePower: true, overrideNozzleCost: false });
});

nozzleSelect.addEventListener("change", () => {
  applyNozzlePreset();
});

materialCostInput.addEventListener("input", () => {
  if (materialSelect.value === CUSTOM_MATERIAL_ID) {
    const raw = materialCostInput.value;
    if (raw !== "") {
      customMaterialCost = toNumber(raw);
    }
  }
});

clearParamsButton.addEventListener("click", () => {
  resetFormToDefaults();
  clearResults();
  history.replaceState({}, document.title, window.location.pathname);
});

copyButton.addEventListener("click", async () => {
  if (!lastResultText) return;
  const success = await copyToClipboard(lastResultText);
  if (!success) {
    window.prompt("複製以下文字", lastResultText);
  }
});

shareButton.addEventListener("click", async () => {
  if (!lastResultValues) return;
  const shareUrl = buildShareUrl(lastResultValues);
  const success = await copyToClipboard(shareUrl);
  if (success) {
    notify("已複製分享連結到剪貼簿。");
  } else {
    window.prompt("請手動複製連結", shareUrl);
  }
});

if (!initialState.shouldAutoCalculate) {
  clearResults();
}

function triggerCalculation() {
  const values = collectValues(form);
  const result = calculateCost(values);
  renderResults(result);
  updateUrlParams(values);
}

function collectValues(formElement) {
  const formData = new FormData(formElement);
  const values = { machine: formData.get("machine"), material: formData.get("material"), nozzle: formData.get("nozzle") };

  FIELD_CONFIG.forEach((field) => {
    const raw = formData.get(field.name);
    values[field.name] = toNumber(raw);
  });

  values.minutes = clamp(values.minutes, 0, 59);
  return values;
}

function calculateCost(values) {
  const machine = MACHINE_PRESETS[values.machine];
  const materialProfile = MATERIAL_OPTIONS.find((item) => item.id === values.material);
  const nozzle = getNozzle(values.machine, values.nozzle);

  const timeHours = values.hours + values.minutes / 60;
  const weightKg = values.weight_g / 1000;
  const materialCost = weightKg * values.material_cost_per_kg;
  const depreciationCost = values.depreciation_per_hour * timeHours;
  const electricityCost = values.power_kw * timeHours * values.electricity_cost_per_kwh;
  const nozzleCost = values.nozzle_cost_per_kg * weightKg;
  const laborCost = values.labor_rate_per_hour * values.labor_hours;
  const overheadCost = values.overhead_per_unit;
  const totalCost = materialCost + depreciationCost + electricityCost + nozzleCost + laborCost + overheadCost;
  const nozzleLifetimeKg = getMaterialLifetimeKg(values.material);

  const summary = [
    { label: "列印機型", value: machine ? machine.label : values.machine },
    { label: "耗材類型", value: materialProfile ? materialProfile.label : values.material },
    { label: "噴嘴配置", value: nozzle ? nozzle.label : values.nozzle },
    { label: "列印重量", value: `${values.weight_g} g` },
    { label: "列印時間", value: `${values.hours} h ${values.minutes} min` },
    { label: "耗材成本", value: `${values.material_cost_per_kg} TWD/kg` },
    { label: "機器折舊成本", value: `${values.depreciation_per_hour.toFixed(2)} TWD/h` },
    { label: "列印功率", value: `${values.power_kw.toFixed(3)} kW` },
    { label: "電費單價", value: `${values.electricity_cost_per_kwh} TWD/kWh` },
    { label: "噴嘴攤提成本", value: `${values.nozzle_cost_per_kg.toFixed(2)} TWD/kg` },
    { label: "人力時薪", value: `${values.labor_rate_per_hour} TWD/h` },
    { label: "人力工時", value: `${values.labor_hours} h` },
    { label: "間接成本/每件", value: `${values.overhead_per_unit} TWD` },
  ];

  const steps = [
    { label: "1. 列印時數計算", value: `${values.hours} + ${values.minutes}/60 = ${timeHours.toFixed(3)} h` },
    { label: "2. 材料成本", value: `${values.weight_g} /1000 * ${values.material_cost_per_kg} = ${formatMoney(materialCost)}` },
    { label: "3. 設備折舊", value: `${values.depreciation_per_hour.toFixed(2)} * ${timeHours.toFixed(3)} = ${formatMoney(depreciationCost)}` },
    { label: "4. 電費成本", value: `${values.power_kw.toFixed(3)} * ${timeHours.toFixed(3)} * ${values.electricity_cost_per_kwh} = ${formatMoney(electricityCost)}` },
    { label: "5. 噴嘴攤提成本", value: `${values.nozzle_cost_per_kg.toFixed(2)} * ${weightKg.toFixed(3)} kg = ${formatMoney(nozzleCost)}` },
    { label: "6. 人力成本", value: `${values.labor_rate_per_hour} * ${values.labor_hours} = ${formatMoney(laborCost)}` },
    { label: "7. 間接與場地成本", value: `= ${formatMoney(overheadCost)}` },
  ];

  const formulas = [];
  if (machine?.priceTwd) {
    const perHour = machine.priceTwd / MACHINE_LIFETIME_HOURS;
    formulas.push({
      title: "機器折舊計算",
      value: `${machine.priceTwd} ÷ ${MACHINE_LIFETIME_HOURS} h = ${perHour.toFixed(2)} TWD/h`,
    });
  }
  if (nozzle && nozzleLifetimeKg) {
    const nozzlePriceTwd = nozzle.priceRmb * RMB_TO_TWD;
    const perKg = nozzlePriceTwd / nozzleLifetimeKg;
    formulas.push({
      title: "噴嘴攤提計算",
      value: `${nozzlePriceTwd.toFixed(2)} ÷ ${nozzleLifetimeKg} kg = ${perKg.toFixed(2)} TWD/kg；列印重量 ${weightKg.toFixed(
        3,
      )} kg → ${formatMoney(nozzleCost)}`,
    });
  }

  return { summary, steps, totalCost, values, timeHours, formulas };
}

function renderResults(result) {
  placeholder.hidden = true;
  inputsBlock.innerHTML = `<h3>輸入參數</h3>${result.summary.map(renderLine).join("")}`;
  stepsBlock.innerHTML = `<h3>計算步驟</h3>${result.steps.map(renderLine).join("")}`;
  totalBlock.textContent = `總成本 = ${formatMoney(result.totalCost)}`;
  if (result.formulas?.length) {
    formulasBlock.hidden = false;
    formulasBlock.innerHTML = `<h3>折舊 / 噴嘴計算</h3>${result.formulas.map(renderFormulaLine).join("")}`;
  } else {
    formulasBlock.hidden = true;
    formulasBlock.innerHTML = "";
  }
  lastResultText = buildResultText(result);
  lastResultValues = result.values;
  copyButton.disabled = false;
  shareButton.disabled = false;
}

function clearResults() {
  placeholder.hidden = false;
  inputsBlock.innerHTML = "";
  stepsBlock.innerHTML = "";
  totalBlock.textContent = "";
  formulasBlock.hidden = true;
  formulasBlock.innerHTML = "";
  lastResultText = "";
  lastResultValues = null;
  copyButton.disabled = true;
  shareButton.disabled = true;
}

function renderLine(item) {
  return `<div class="result-line"><span>${item.label}</span><span>${item.value}</span></div>`;
}

function renderFormulaLine(item) {
  return `<div class="result-line formula"><span>${item.title}</span><span>${item.value}</span></div>`;
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatMoney(amount) {
  return `${amount.toFixed(2)} TWD`;
}

function populateNozzleOptions(machineKey, desiredNozzle) {
  const options = MACHINE_PRESETS[machineKey]?.nozzles ?? [];
  const markup = options
    .map((option, index) => {
      const shouldSelect = desiredNozzle ? option.id === desiredNozzle : index === 0;
      return `<option value="${option.id}" ${shouldSelect ? "selected" : ""}>${option.label}</option>`;
    })
    .join("");
  nozzleSelect.innerHTML = markup;
}

function applyMachinePreset({ overrideDepreciation, overridePower, overrideNozzleCost }) {
  const machineKey = machineSelect.value;
  const machine = MACHINE_PRESETS[machineKey];
  if (!machine) return;

  if (overrideDepreciation) {
    const perHour = getMachineDepreciation(machineKey);
    setInputValue("depreciation_per_hour", perHour, 2);
  }

  if (overridePower) {
    const materialProfile = MATERIAL_OPTIONS.find((item) => item.id === materialSelect.value);
    const profileKey = materialProfile?.profile ?? "standard";
    const recommendedPower = machine.powerProfiles[profileKey] ?? machine.powerProfiles.standard;
    setInputValue("power_kw", recommendedPower, 3);
  }

  if (overrideNozzleCost) {
    applyNozzlePreset();
  }
}

function applyMaterialPreset({ forceCostUpdate, overrideNozzleCost } = { forceCostUpdate: true, overrideNozzleCost: true }) {
  const materialId = materialSelect.value;
  const option = getMaterialOption(materialId);
  const isCustom = option?.custom || materialId === CUSTOM_MATERIAL_ID;
  toggleCustomMaterialField(isCustom);

  if (isCustom) {
    const raw = materialCostInput.value;
    if (raw !== "") {
      customMaterialCost = toNumber(raw);
    }
    if (!Number.isFinite(customMaterialCost) || customMaterialCost <= 0) {
      customMaterialCost = DEFAULT_VALUES.material_cost_per_kg;
    }
    setInputValue("material_cost_per_kg", customMaterialCost, 2);
    if (overrideNozzleCost) {
      applyNozzlePreset();
    }
    return;
  }

  if (!forceCostUpdate) {
    if (overrideNozzleCost) {
      applyNozzlePreset();
    }
    return;
  }

  if (option?.costTwd) {
    setInputValue("material_cost_per_kg", option.costTwd, 2);
  }
  if (overrideNozzleCost) {
    applyNozzlePreset();
  }
}

function resetFormToDefaults() {
  form.reset();
  machineSelect.value = DEFAULT_SELECTS.machine;
  materialSelect.value = DEFAULT_SELECTS.material;
  populateNozzleOptions(machineSelect.value, DEFAULT_SELECTS.nozzle);
  lastMaterialSelection = DEFAULT_SELECTS.material;
  customMaterialCost = DEFAULT_VALUES.material_cost_per_kg;
  applyMachinePreset({ overrideDepreciation: true, overridePower: true, overrideNozzleCost: true });
  applyMaterialPreset({ forceCostUpdate: true, overrideNozzleCost: true });
}

function applyNozzlePreset() {
  const machineKey = machineSelect.value;
  const nozzle = getNozzle(machineKey, nozzleSelect.value);
  if (!nozzle) return;
  const lifetimeKg = getMaterialLifetimeKg(materialSelect.value);
  if (!lifetimeKg) return;
  const perKg = calculateNozzleCostPerKg(nozzle.priceRmb, lifetimeKg);
  setInputValue("nozzle_cost_per_kg", perKg, 2);
}

function setInputValue(fieldName, value, fractionDigits = 2) {
  const field = document.getElementById(fieldName);
  if (!field) return;
  field.value = Number(value).toFixed(fractionDigits);
}

function calculateNozzleCostPerKg(priceRmb, lifetimeKg) {
  if (!lifetimeKg) return 0;
  return (priceRmb * RMB_TO_TWD) / lifetimeKg;
}

function toggleCustomMaterialField(visible) {
  if (!customMaterialField) return;
  customMaterialField.hidden = !visible;
}

function getMaterialLifetimeKg(materialId) {
  const option = getMaterialOption(materialId);
  const classKey = option?.materialClass === "cf" ? "cf" : "general";
  return NOZZLE_LIFETIME_KG[classKey];
}

function getNozzle(machineKey, nozzleId) {
  const machine = MACHINE_PRESETS[machineKey];
  if (!machine) return undefined;
  return machine.nozzles.find((option) => option.id === nozzleId);
}

function getMachineDepreciation(machineKey) {
  const machine = MACHINE_PRESETS[machineKey];
  if (!machine || !machine.priceTwd) return 0;
  return machine.priceTwd / MACHINE_LIFETIME_HOURS;
}

function buildResultText(result) {
  const lines = [];
  lines.push("=== 輸入參數 ===");
  result.summary.forEach((item) => lines.push(`${item.label}: ${item.value}`));
  lines.push("");
  lines.push("=== 計算步驟 ===");
  result.steps.forEach((item) => lines.push(`${item.label}: ${item.value}`));
  lines.push("");
  lines.push(`總成本 = ${result.totalCost.toFixed(2)} TWD`);
  return lines.join("\n");
}

function copyToClipboard(text) {
  if (!navigator.clipboard) {
    return Promise.resolve(false);
  }
  return navigator.clipboard
    .writeText(text)
    .then(() => true)
    .catch(() => false);
}

function notify(message) {
  const live = document.createElement("div");
  live.className = "toast";
  live.textContent = message;
  document.body.appendChild(live);
  setTimeout(() => {
    live.classList.add("visible");
    setTimeout(() => {
      live.classList.remove("visible");
      setTimeout(() => live.remove(), 400);
    }, 1800);
  }, 20);
}

function buildShareUrl(values) {
  const params = createSearchParams(values);
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

function updateUrlParams(values) {
  const params = createSearchParams(values);
  const query = params.toString();
  const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  history.replaceState({}, document.title, newUrl);
}

function createSearchParams(values) {
  const params = new URLSearchParams();
  params.set("machine", values.machine);
  params.set("material", values.material);
  params.set("nozzle", values.nozzle);
  FIELD_CONFIG.forEach((field) => {
    params.set(field.name, values[field.name]);
  });
  return params;
}

function buildInitialState(params) {
  const inputs = { ...DEFAULT_VALUES };
  FIELD_CONFIG.forEach((field) => {
    if (params.has(field.name)) {
      inputs[field.name] = toNumber(params.get(field.name));
    } else if (field.name === "nozzle_cost_per_kg" && params.has("nozzle_cost_per_hour")) {
      inputs[field.name] = toNumber(params.get("nozzle_cost_per_hour"));
    }
  });
  const machine = params.get("machine") || DEFAULT_SELECTS.machine;
  const material = params.get("material") || DEFAULT_SELECTS.material;
  const nozzle = params.get("nozzle") || DEFAULT_SELECTS.nozzle;
  const hasQueryParams = [...params.keys()].length > 0;
  return {
    inputs,
    machine,
    material,
    nozzle,
    hasQueryParams,
    shouldAutoCalculate: hasQueryParams,
  };
}

function getMaterialOption(materialId) {
  return MATERIAL_OPTIONS.find((item) => item.id === materialId);
}

function getMaterialCostById(materialId) {
  return getMaterialOption(materialId)?.costTwd;
}
