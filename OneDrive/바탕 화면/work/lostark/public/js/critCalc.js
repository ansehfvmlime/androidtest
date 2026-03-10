function $(id) {
  return document.getElementById(id);
}

const TEMP_DATA = {
  critCoeffPercent: 0.035777,
  critCapPercent: 100,
  synergyPerPerson: 10,
  speedBuffs: {
    support: { atk: 9, move: 9 },
    feast: { atk: 5, move: 5 },
    food: { atk: 3, move: 0 },
  },
  jobCrit: {
    name: '기상술사 직업각인',
    value: 0,
    toggle: false,
    level: 1,
    atkScale: { 1: 0.40, 2: 0.80, 3: 1.20 },
    moveScale: { 1: 0.10, 2: 0.20, 3: 0.30 },
  },
  speedTargets: {
    entryAtkPercent: 21,
  },
  skills: [
    {
      id: 'wind_fog',
      name: '여우비',
      critBonus: 0,
      tripods: [
        { id: 'tripod_a', name: '치명 강화', critBonus: 10, selected: false },
        { id: 'tripod_b', name: '약점 포착', critBonus: 5, selected: false },
      ],
    },
    {
      id: 'wind_spike',
      name: '바람송곳',
      critBonus: 0,
      tripods: [
        { id: 'tripod_c', name: '치명 강화', critBonus: 10, selected: false },
      ],
    },
    {
      id: 'gale_walk',
      name: '회오리 걸음',
      critBonus: 0,
      tripods: [
        { id: 'tripod_d', name: '약점 포착', critBonus: 7, selected: false },
      ],
    },
  ],
};

const CRIT_INPUT_MAPS = {
  accessory: {
    none: 0,
    low: 0.4,
    mid: 0.95,
    high: 1.55,
  },
  bracelet: {
    none: 0,
    low: 3.4,
    mid: 4.2,
    high: 5.0,
    crit_dmg_low: 3.4,
    crit_dmg_mid: 4.2,
    crit_dmg_high: 5.0,
    resist_low: 3.4,
    resist_mid: 4.2,
    resist_high: 5.0,
  },
  adrenaline: {
    0: 14,
    1: 15.5,
    2: 17,
    3: 18.5,
    4: 20,
  },
};

const ARK_PASSIVE_LEVEL_MAPS = {
  sharp: { 0: 0, 1: 2, 2: 4 },
  blow: { 0: 0, 1: 2, 2: 4 },
  strike: { 0: 0, 1: 2, 2: 4 },
};

const CRIT_SELECT_TONES = {
  none: 'tone-none',
  low: 'tone-low',
  mid: 'tone-mid',
  high: 'tone-high',
  crit_dmg_low: 'tone-low',
  crit_dmg_mid: 'tone-mid',
  crit_dmg_high: 'tone-high',
  resist_low: 'tone-low',
  resist_mid: 'tone-mid',
  resist_high: 'tone-high',
  '-1': 'tone-none',
  0: 'tone-high',
  1: 'tone-relic',
  2: 'tone-relic',
  3: 'tone-relic',
  4: 'tone-relic',
};

function toSafeNumber(value) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

function sumMappedValues(values, map) {
  if (!Array.isArray(values)) return 0;
  return values.reduce((sum, value) => {
    if (value && typeof value === 'object') {
      if (value.key != null && map[value.key] != null) return sum + toSafeNumber(map[value.key]);
      if (value.rate != null || value.critRate != null || value.value != null) {
        return sum + toSafeNumber(value.rate ?? value.critRate ?? value.value);
      }
    }
    if (typeof value === 'string' && map[value] != null) return sum + toSafeNumber(map[value]);
    return sum + toSafeNumber(value);
  }, 0);
}

function getUserCritStat(input) {
  const manualCritStat = input?.manual?.critStat;
  if (manualCritStat != null) return toSafeNumber(manualCritStat);

  const critLevel = input?.manual?.critStatLevel ?? input?.manual?.arkGridLevel;
  if (critLevel != null) return Math.max(0, toSafeNumber(critLevel)) * 50;

  return toSafeNumber(input?.api?.critStat);
}

function getCritStatRate(input) {
  const directRate = input?.api?.critStatRate ?? input?.manual?.critStatRate;
  if (directRate != null) return toSafeNumber(directRate);

  const critStat = getUserCritStat(input);
  const coeff = toSafeNumber(input?.config?.critCoeffPercent ?? TEMP_DATA.critCoeffPercent);
  return critStat * coeff;
}

function getArkPassiveCritRate(input) {
  const directRate = input?.api?.arkPassiveCritRate ?? input?.manual?.arkPassiveCritRate;
  if (directRate != null) return toSafeNumber(directRate);

  const options = input?.manual?.arkPassiveOptions;
  if (!options || typeof options !== 'object') return 0;

  return Object.entries(options).reduce((sum, [key, option]) => {
    const levelMap = ARK_PASSIVE_LEVEL_MAPS[key];
    if (option && typeof option === 'object') {
      if (option.level != null && levelMap) {
        return sum + toSafeNumber(levelMap[option.level] ?? 0);
      }
      return sum + toSafeNumber(option.critRate ?? option.rate ?? option.value);
    }
    if (levelMap) return sum + toSafeNumber(levelMap[option] ?? 0);
    return sum + toSafeNumber(option);
  }, 0);
}

function getAccessoryCritRate(input) {
  const directRate = input?.api?.accessoryCritRate ?? input?.manual?.accessoryCritRate;
  if (directRate != null) return toSafeNumber(directRate);
  return sumMappedValues(input?.manual?.accessoryCritRates, CRIT_INPUT_MAPS.accessory);
}

function getBraceletCritRate(input) {
  const directRate = input?.api?.braceletCritRate ?? input?.manual?.braceletCritRate;
  if (directRate != null) return toSafeNumber(directRate);

  const option = input?.manual?.braceletCritOption;
  if (option != null) return sumMappedValues([option], CRIT_INPUT_MAPS.bracelet);

  return sumMappedValues(input?.manual?.braceletCritOptions, CRIT_INPUT_MAPS.bracelet);
}

function getAdrenalineCritRate(input) {
  const directRate = input?.api?.engravingCritRate ?? input?.manual?.engravingCritRate ?? input?.manual?.adrenalineCritRate;
  if (directRate != null) return toSafeNumber(directRate);

  const level = input?.manual?.adrenalineLevel;
  if (level == null) return 0;
  return toSafeNumber(CRIT_INPUT_MAPS.adrenaline[level] ?? 0);
}

function findClosestKey(map, target) {
  const entries = Object.entries(map);
  let closestKey = entries[0]?.[0] ?? '';
  let minDiff = Number.POSITIVE_INFINITY;

  entries.forEach(([key, value]) => {
    const diff = Math.abs(toSafeNumber(value) - toSafeNumber(target));
    if (diff < minDiff) {
      minDiff = diff;
      closestKey = key;
    }
  });

  return closestKey;
}

function splitAccessoryCritRate(total) {
  const keys = Object.keys(CRIT_INPUT_MAPS.accessory);
  let best = ['none', 'none'];
  let minDiff = Number.POSITIVE_INFINITY;

  keys.forEach((first) => {
    keys.forEach((second) => {
      const sum = toSafeNumber(CRIT_INPUT_MAPS.accessory[first]) + toSafeNumber(CRIT_INPUT_MAPS.accessory[second]);
      const diff = Math.abs(sum - toSafeNumber(total));
      if (diff < minDiff) {
        minDiff = diff;
        best = [first, second];
      }
    });
  });

  return best;
}

function setSelectTone(select) {
  if (!select) return;
  select.classList.remove('tone-none', 'tone-low', 'tone-mid', 'tone-high', 'tone-relic');
  const tone = CRIT_SELECT_TONES[select.value] ?? 'tone-none';
  select.classList.add(tone);
}

function syncArkGridCritUI() {
  const levelInput = $('arkGridCritLevelInput');
  const critStatInput = $('critStatInput');
  const levelText = $('arkGridCritLevelText');
  const statText = $('arkGridCritStatText');
  if (!levelInput || !critStatInput) return;

  const level = toSafeNumber(levelInput.value);
  const critStat = level * 50;
  const critRate = critStat * TEMP_DATA.critCoeffPercent;

  critStatInput.value = String(critStat);
  if (levelText) levelText.textContent = `Lv ${level}`;
  if (statText) statText.textContent = `치명 스탯 ${critStat} / 치명타 적중률 ${critRate.toFixed(2)}%`;
}

function getManualArkPassiveOptions() {
  const sharpLevel = Math.max(0, Math.min(2, toSafeNumber($('arkPassiveSharpSelect')?.value)));
  const blowLevel = Math.max(0, Math.min(2, toSafeNumber($('arkPassiveBlowSelect')?.value)));
  const strikeLevel = Math.max(0, Math.min(2, toSafeNumber($('arkPassiveStrikeSelect')?.value)));

  return {
    sharp: { level: sharpLevel, critRate: toSafeNumber(ARK_PASSIVE_LEVEL_MAPS.sharp[sharpLevel] ?? 0), name: '예리한 감각' },
    blow: { level: blowLevel, critRate: toSafeNumber(ARK_PASSIVE_LEVEL_MAPS.blow[blowLevel] ?? 0), name: '혼신의 강타' },
    strike: { level: strikeLevel, critRate: toSafeNumber(ARK_PASSIVE_LEVEL_MAPS.strike[strikeLevel] ?? 0), name: '일격' },
  };
}

function getAccessoryCritSelections() {
  return ['accessoryCritSlot1', 'accessoryCritSlot2'].map((id) => {
    const key = $('' + id)?.value || 'none';
    return { key, rate: toSafeNumber(CRIT_INPUT_MAPS.accessory[key] ?? 0) };
  });
}

function getBraceletCritSelection() {
  const key = $('braceletCritSelect')?.value || 'none';
  return { key, rate: toSafeNumber(CRIT_INPUT_MAPS.bracelet[key] ?? 0) };
}

function getManualArkPassiveBreakdownItems() {
  return Object.values(getManualArkPassiveOptions())
    .filter((item) => toSafeNumber(item.level) > 0)
    .map((item) => ({
      name: item.name,
      level: item.level,
      critRate: item.critRate,
    }));
}

function buildCritCalculatorInput(spec) {
  const critStat = toSafeNumber($('critStatInput')?.value);
  const braceletCritOption = getBraceletCritSelection();

  return {
    api: {
      critStat: toSafeNumber(spec?.critCalculatorInput?.api?.critStat ?? spec?.stats?.crit ?? 0),
      arkGridCritRate: toSafeNumber(spec?.critCalculatorInput?.api?.arkGridCritRate ?? 0),
      petCritRate: 0,
    },
    manual: {
      critStatLevel: toSafeNumber($('arkGridCritLevelInput')?.value),
      critStat,
      arkPassiveOptions: getManualArkPassiveOptions(),
      accessoryCritRates: getAccessoryCritSelections(),
      braceletCritOption,
      adrenalineLevel: $('adrenalineCritSelect')?.value ?? '-1',
      classEngravingCritRate: toSafeNumber($('classEngravingCritRate')?.value),
      extraCritRate: toSafeNumber($('extraCritRate')?.value),
      partySynergyLevel: toSafeNumber($('partySynergy')?.value),
    },
    config: {
      critCoeffPercent: TEMP_DATA.critCoeffPercent,
    },
  };
}

function buildApiCritCalculatorInput(spec) {
  const baseInput = spec?.critCalculatorInput ?? {};
  return {
    api: {
      critStat: toSafeNumber(baseInput.api?.critStat ?? spec?.stats?.crit ?? 0),
      braceletCritRate: toSafeNumber(baseInput.api?.braceletCritRate ?? spec?.critRateSources?.bracelet ?? 0),
      accessoryCritRate: toSafeNumber(baseInput.api?.accessoryCritRate ?? spec?.critRateSources?.accessory ?? 0),
      arkGridCritRate: toSafeNumber(baseInput.api?.arkGridCritRate ?? 0),
      arkPassiveCritRate: toSafeNumber(baseInput.api?.arkPassiveCritRate ?? spec?.critRateSources?.arkpassive ?? 0),
      petCritRate: 0,
      engravingCritRate: toSafeNumber(baseInput.api?.engravingCritRate ?? spec?.critRateSources?.adrenaline ?? 0),
    },
    manual: {
      partySynergyLevel: 0,
      partySynergyCritRate: 0,
      classEngravingCritRate: 0,
      extraCritRate: 0,
    },
    config: {
      critCoeffPercent: TEMP_DATA.critCoeffPercent,
    },
  };
}

function calculateCritRate(input) {
  const partySynergyCritRateMap = {
    0: 0,
    1: 10,
    2: 20,
    3: 30,
  };

  const rawPartyLevel = input?.manual?.partySynergyLevel;
  const partyLevel = rawPartyLevel == null ? null : Number(rawPartyLevel);
  const partySynergyCritRate =
    partyLevel == null
      ? toSafeNumber(input?.manual?.partySynergyCritRate)
      : toSafeNumber(partySynergyCritRateMap[partyLevel] ?? 0);

  const breakdown = {
    critStatRate: getCritStatRate(input),
    braceletCritRate: getBraceletCritRate(input),
    accessoryCritRate: getAccessoryCritRate(input),
    arkGridCritRate: toSafeNumber(input?.api?.arkGridCritRate),
    arkPassiveCritRate: getArkPassiveCritRate(input),
    petCritRate: toSafeNumber(input?.api?.petCritRate),
    engravingCritRate: getAdrenalineCritRate(input),
    partySynergyCritRate,
    classEngravingCritRate: toSafeNumber(input?.manual?.classEngravingCritRate),
    extraCritRate: toSafeNumber(input?.manual?.extraCritRate),
  };

  const totalCritRate =
    breakdown.critStatRate +
    breakdown.braceletCritRate +
    breakdown.accessoryCritRate +
    breakdown.arkGridCritRate +
    breakdown.arkPassiveCritRate +
    breakdown.petCritRate +
    breakdown.engravingCritRate +
    breakdown.partySynergyCritRate +
    breakdown.classEngravingCritRate +
    breakdown.extraCritRate;

  return {
    totalCritRate,
    breakdown,
  };
}

function initCritCalc() {
  const spec = window.__SPEC__ || null;
  const baseInput = spec?.critCalculatorInput ?? {};
  const apiDefaults = baseInput.api ?? {};
  const critStat = Number(apiDefaults.critStat ?? spec?.stats?.crit ?? 0);
  const swiftStat = Number(spec?.stats?.swift ?? 0);
  const manualDefaults = baseInput.manual ?? {};
  const apiAccessoryCritRate = toSafeNumber(apiDefaults.accessoryCritRate ?? spec?.critRateSources?.accessory ?? 0);
  const apiBraceletCritRate = toSafeNumber(apiDefaults.braceletCritRate ?? spec?.critRateSources?.bracelet ?? 0);
  const apiAdrenalineCritRate = toSafeNumber(apiDefaults.engravingCritRate ?? spec?.critRateSources?.adrenaline ?? 0);
  const defaultCritStatLevel = Math.max(0, Math.min(30, Math.floor(critStat / 50)));

  const critStatInput = $('critStatInput');
  const coeffInput = $('critCoeffInput');
  const capInput = $('critCapInput');
  const synergyInput = $('synergyCountInput');
  const jobCritInput = $('jobCritInput');
  const jobCritToggle = $('jobCritToggle');
  const arkGridCritLevelInput = $('arkGridCritLevelInput');
  const arkPassiveSharpSelect = $('arkPassiveSharpSelect');
  const arkPassiveBlowSelect = $('arkPassiveBlowSelect');
  const arkPassiveStrikeSelect = $('arkPassiveStrikeSelect');
  const accessoryCritSlot1 = $('accessoryCritSlot1');
  const accessoryCritSlot2 = $('accessoryCritSlot2');
  const braceletCritSelect = $('braceletCritSelect');
  const adrenalineCritSelect = $('adrenalineCritSelect');
  const swiftStatInput = $('swiftStatInput');
  const atkSpeedCoeffInput = $('atkSpeedCoeffInput');
  const moveSpeedCoeffInput = $('moveSpeedCoeffInput');
  const jobAtkSpeedInput = $('jobAtkSpeedInput');
  const jobMoveSpeedInput = $('jobMoveSpeedInput');
  const braceletAtkSpeedInput = $('braceletAtkSpeedInput');
  const braceletMoveSpeedInput = $('braceletMoveSpeedInput');
  const tripodAtkSpeedInput = $('tripodAtkSpeedInput');
  const tripodMoveSpeedInput = $('tripodMoveSpeedInput');
  const baseAtkSpeedInput = $('baseAtkSpeedInput');
  const massIncreaseAtkSpeedInput = $('massIncreaseAtkSpeedInput');
  const massIncreaseToggle = $('massIncreaseToggle');
  const baseMoveSpeedInput = $('baseMoveSpeedInput');
  const swiftCoeffToggle = $('swiftCoeffToggle');
  const speedCapInput = $('speedCapInput');
  const supportBuffToggle = $('supportBuffToggle');
  const feastBuffToggle = $('feastBuffToggle');
  const atkFoodToggle = $('atkFoodToggle');
  const arkCoreAtkSpeedInput = $('arkCoreAtkSpeedInput');
  const arkCoreSpeedInput = $('arkCoreSpeedInput');
  const skillSelect = $('skillSelect');
  const skillTripodList = $('skillTripodList');
  const skillSetList = $('skillSetList');
  const partySynergySelect = $('partySynergy');
  const classEngravingInput = $('classEngravingCritRate');
  const extraCritInput = $('extraCritRate');

  if (!critStatInput) return;

  critStatInput.value = '0';
  coeffInput.value = TEMP_DATA.critCoeffPercent;
  capInput.value = 0;
  synergyInput.value = '0';
  jobCritInput.value = TEMP_DATA.jobCrit.value;
  jobCritToggle.checked = TEMP_DATA.jobCrit.toggle;
  if (arkGridCritLevelInput) {
    arkGridCritLevelInput.value = String(
      Math.max(0, Math.min(30, toSafeNumber(manualDefaults.critStatLevel ?? manualDefaults.arkGridLevel ?? defaultCritStatLevel)))
    );
  }
  const arkPassiveItems = spec?.critRateSources?.arkpassiveBreakdown?.items ?? [];
  const sharpItem = arkPassiveItems.find((item) => item?.name === '예리한 감각');
  const blowItem = arkPassiveItems.find((item) => item?.name === '혼신의 강타');
  const strikeItem = arkPassiveItems.find((item) => item?.name === '일격');
  const apiArkPassiveOptions = manualDefaults.arkPassiveOptions ?? {};
  if (arkPassiveSharpSelect) arkPassiveSharpSelect.value = String(Math.max(0, Math.min(2, toSafeNumber(apiArkPassiveOptions.sharp?.level ?? sharpItem?.level))));
  if (arkPassiveBlowSelect) arkPassiveBlowSelect.value = String(Math.max(0, Math.min(2, toSafeNumber(apiArkPassiveOptions.blow?.level ?? blowItem?.level))));
  if (arkPassiveStrikeSelect) arkPassiveStrikeSelect.value = String(Math.max(0, Math.min(2, toSafeNumber(apiArkPassiveOptions.strike?.level ?? strikeItem?.level))));
  const apiAccessorySelections = Array.isArray(manualDefaults.accessoryCritRates) && manualDefaults.accessoryCritRates.length >= 2
    ? [
      manualDefaults.accessoryCritRates[0]?.key ?? 'none',
      manualDefaults.accessoryCritRates[1]?.key ?? 'none',
    ]
    : splitAccessoryCritRate(apiAccessoryCritRate);
  const [accessorySlot1, accessorySlot2] = apiAccessorySelections;
  if (accessoryCritSlot1) accessoryCritSlot1.value = accessorySlot1;
  if (accessoryCritSlot2) accessoryCritSlot2.value = accessorySlot2;
  if (braceletCritSelect) {
    braceletCritSelect.value = manualDefaults.braceletCritOption?.key
      ?? findClosestKey(CRIT_INPUT_MAPS.bracelet, apiBraceletCritRate);
  }
  const adrenalineBase = Number(apiAdrenalineCritRate || 0);
  if (adrenalineCritSelect) {
    adrenalineCritSelect.value = manualDefaults.adrenalineLevel != null
      ? String(manualDefaults.adrenalineLevel)
      : (adrenalineBase > 0 ? findClosestKey(CRIT_INPUT_MAPS.adrenaline, adrenalineBase) : '-1');
  }
  swiftStatInput.value = swiftStat || '';
  atkSpeedCoeffInput.value = 0.0171;
  moveSpeedCoeffInput.value = 0.0171;
  if (jobAtkSpeedInput) jobAtkSpeedInput.value = 0;
  if (jobMoveSpeedInput) jobMoveSpeedInput.value = 0;
  if (tripodAtkSpeedInput) tripodAtkSpeedInput.value = 0;
  if (tripodMoveSpeedInput) tripodMoveSpeedInput.value = 0;
  const braceletAtk = Number(spec?.speedSources?.braceletAtkSpeed ?? 0);
  const braceletMove = Number(spec?.speedSources?.braceletMoveSpeed ?? 0);
  if (braceletAtkSpeedInput) braceletAtkSpeedInput.value = braceletAtk || 0;
  if (braceletMoveSpeedInput) braceletMoveSpeedInput.value = braceletMove || 0;
  baseAtkSpeedInput.value = 0;
  const massIncreasePenalty = Number(spec?.speedSources?.massIncreaseAtkSpeed ?? 0);
  if (massIncreaseAtkSpeedInput) massIncreaseAtkSpeedInput.value = massIncreasePenalty || 0;
  if (massIncreaseToggle) massIncreaseToggle.checked = massIncreasePenalty > 0;
  baseMoveSpeedInput.value = 0;
  if (supportBuffToggle) supportBuffToggle.checked = false;
  if (feastBuffToggle) feastBuffToggle.checked = false;
  if (atkFoodToggle) atkFoodToggle.checked = false;
  if (arkCoreAtkSpeedInput) arkCoreAtkSpeedInput.value = 0;
  if (arkCoreSpeedInput) arkCoreSpeedInput.value = 0;
  swiftCoeffToggle.checked = true;
  speedCapInput.value = 140;
  if (partySynergySelect) partySynergySelect.value = String(toSafeNumber(manualDefaults.partySynergyLevel));
  if (classEngravingInput) classEngravingInput.value = toSafeNumber(manualDefaults.classEngravingCritRate);
  if (extraCritInput) extraCritInput.value = toSafeNumber(manualDefaults.extraCritRate);
  syncArkGridCritUI();
  [accessoryCritSlot1, accessoryCritSlot2, braceletCritSelect, adrenalineCritSelect]
    .forEach(setSelectTone);

  // Skill select
  skillSelect.innerHTML = TEMP_DATA.skills.map((s) => `
    <option value="${s.id}">${s.name}</option>
  `).join('');

  renderSkillTripods(skillSelect.value);
  renderSkillSet();
  recalc();

  if (arkGridCritLevelInput) arkGridCritLevelInput.addEventListener('input', () => {
    syncArkGridCritUI();
    recalc();
  });
  swiftStatInput.addEventListener('input', recalc);
  atkSpeedCoeffInput.addEventListener('input', recalc);
  moveSpeedCoeffInput.addEventListener('input', recalc);
  if (jobAtkSpeedInput) jobAtkSpeedInput.addEventListener('input', recalc);
  if (jobMoveSpeedInput) jobMoveSpeedInput.addEventListener('input', recalc);
  if (braceletAtkSpeedInput) braceletAtkSpeedInput.addEventListener('input', recalc);
  if (braceletMoveSpeedInput) braceletMoveSpeedInput.addEventListener('input', recalc);
  if (tripodAtkSpeedInput) tripodAtkSpeedInput.addEventListener('input', recalc);
  if (tripodMoveSpeedInput) tripodMoveSpeedInput.addEventListener('input', recalc);
  baseAtkSpeedInput.addEventListener('input', recalc);
  if (massIncreaseAtkSpeedInput) massIncreaseAtkSpeedInput.addEventListener('input', recalc);
  if (massIncreaseToggle) massIncreaseToggle.addEventListener('change', recalc);
  baseMoveSpeedInput.addEventListener('input', recalc);
  swiftCoeffToggle.addEventListener('change', recalc);
  speedCapInput.addEventListener('input', recalc);
  if (supportBuffToggle) supportBuffToggle.addEventListener('change', recalc);
  if (feastBuffToggle) feastBuffToggle.addEventListener('change', recalc);
  if (atkFoodToggle) atkFoodToggle.addEventListener('change', recalc);
  if (arkCoreAtkSpeedInput) arkCoreAtkSpeedInput.addEventListener('input', recalc);
  if (arkCoreSpeedInput) arkCoreSpeedInput.addEventListener('input', recalc);
  synergyInput.addEventListener('change', recalc);
  jobCritInput.addEventListener('input', recalc);
  jobCritToggle.addEventListener('change', recalc);
  if (partySynergySelect) partySynergySelect.addEventListener('change', recalc);
  if (classEngravingInput) classEngravingInput.addEventListener('input', recalc);
  if (extraCritInput) extraCritInput.addEventListener('input', recalc);
  [arkPassiveSharpSelect, arkPassiveBlowSelect, arkPassiveStrikeSelect]
    .filter(Boolean)
    .forEach((el) => {
      el.addEventListener('change', recalc);
    });
  [accessoryCritSlot1, accessoryCritSlot2, braceletCritSelect, adrenalineCritSelect]
    .filter(Boolean)
    .forEach((el) => {
      el.addEventListener('change', () => {
        setSelectTone(el);
        recalc();
      });
    });

  skillSelect.addEventListener('change', () => {
    renderSkillTripods(skillSelect.value);
    recalc();
  });
}

function renderSkillTripods(skillId) {
  const skill = TEMP_DATA.skills.find(s => s.id === skillId);
  const skillTripodList = $('skillTripodList');
  if (!skill || !skillTripodList) return;

  skillTripodList.innerHTML = skill.tripods.map((t) => `
    <label class="toggle">
      <input type="checkbox" data-skill-id="${skill.id}" data-tripod-id="${t.id}" ${t.selected ? 'checked' : ''} />
      <span>${t.name} (+${t.critBonus}%)</span>
    </label>
  `).join('');

  skillTripodList.querySelectorAll('input[type="checkbox"]').forEach((el) => {
    el.addEventListener('change', () => {
      const tripod = skill.tripods.find(t => t.id === el.dataset.tripodId);
      if (tripod) tripod.selected = el.checked;
      recalc();
    });
  });
}

function renderSkillSet() {
  const skillSetList = $('skillSetList');
  if (!skillSetList) return;
  skillSetList.innerHTML = TEMP_DATA.skills.map((s) => `
    <div class="skill-set-item">
      <label class="toggle">
        <input type="checkbox" data-skill-set-id="${s.id}" />
        <span>${s.name}</span>
      </label>
      <input type="number" min="0" step="1" value="1" data-skill-weight="${s.id}" class="weight-input" />
      <button type="button" class="mini-btn" data-skill-expand="${s.id}">트포</button>
      <div class="tripod-sublist" id="tripod-sub-${s.id}" style="display:none;"></div>
    </div>
  `).join('');

  TEMP_DATA.skills.forEach((s) => {
    const sub = $(`tripod-sub-${s.id}`);
    if (!sub) return;
    sub.innerHTML = s.tripods.map((t) => `
      <label class="toggle small">
        <input type="checkbox" data-skill-id="${s.id}" data-tripod-id="${t.id}" ${t.selected ? 'checked' : ''} />
        <span>${t.name} (+${t.critBonus}%)</span>
      </label>
    `).join('');
  });

  skillSetList.querySelectorAll('[data-skill-expand]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.skillExpand;
      const sub = $(`tripod-sub-${id}`);
      if (sub) sub.style.display = sub.style.display === 'none' ? 'block' : 'none';
    });
  });

  skillSetList.querySelectorAll('input[type="checkbox"][data-skill-set-id]').forEach((el) => {
    el.addEventListener('change', recalc);
  });

  skillSetList.querySelectorAll('input[type="number"][data-skill-weight]').forEach((el) => {
    el.addEventListener('input', recalc);
  });

  skillSetList.querySelectorAll('input[type="checkbox"][data-tripod-id]').forEach((el) => {
    el.addEventListener('change', () => {
      const skill = TEMP_DATA.skills.find(s => s.id === el.dataset.skillId);
      const tripod = skill?.tripods.find(t => t.id === el.dataset.tripodId);
      if (tripod) tripod.selected = el.checked;
      recalc();
    });
  });
}

function getBaseCritRate() {
  const critStat = Number($('critStatInput').value || 0);
  const coeff = Number($('critCoeffInput').value || 0);
  return critStat * coeff;
}

function getGlobalCritBonus() {
  const jobBonus = $('jobCritToggle').checked ? Number($('jobCritInput').value || 0) : 0;

  return { synergy: 0, jobBonus };
}

function getSpeedBonuses() {
  const swift = Number($('swiftStatInput').value || 0);
  const atkCoeff = Number($('atkSpeedCoeffInput').value || 0);
  const moveCoeff = Number($('moveSpeedCoeffInput').value || 0);
  const jobAtk = Number($('jobAtkSpeedInput')?.value || 0);
  const jobMove = Number($('jobMoveSpeedInput')?.value || 0);
  const braceletAtk = Number($('braceletAtkSpeedInput')?.value || 0);
  const braceletMove = Number($('braceletMoveSpeedInput')?.value || 0);
  const tripodAtk = Number($('tripodAtkSpeedInput')?.value || 0);
  const tripodMove = Number($('tripodMoveSpeedInput')?.value || 0);
  const arkCoreAtk = Number($('arkCoreAtkSpeedInput')?.value || 0);
  const arkCoreBoth = Number($('arkCoreSpeedInput')?.value || 0);
  const baseAtk = Number($('baseAtkSpeedInput').value || 0);
  const massPenalty = $('massIncreaseToggle')?.checked
    ? Number($('massIncreaseAtkSpeedInput')?.value || 0)
    : 0;
  const baseMove = Number($('baseMoveSpeedInput').value || 0);
  const useSwift = $('swiftCoeffToggle').checked;
  const speedCap = Number($('speedCapInput').value || 140);

  const swiftAtk = useSwift ? swift * atkCoeff : 0;
  const swiftMove = useSwift ? swift * moveCoeff : 0;

  const atkBase = baseAtk + swiftAtk + jobAtk + braceletAtk + tripodAtk + arkCoreAtk + arkCoreBoth - massPenalty;
  const moveBase = baseMove + swiftMove + jobMove + braceletMove + tripodMove + arkCoreBoth;

  let buffAtk = 0;
  let buffMove = 0;
  if ($('supportBuffToggle')?.checked) {
    buffAtk += TEMP_DATA.speedBuffs.support.atk;
    buffMove += TEMP_DATA.speedBuffs.support.move;
  }
  if ($('feastBuffToggle')?.checked) {
    buffAtk += TEMP_DATA.speedBuffs.feast.atk;
    buffMove += TEMP_DATA.speedBuffs.feast.move;
  }
  if ($('atkFoodToggle')?.checked) {
    buffAtk += TEMP_DATA.speedBuffs.food.atk;
    buffMove += TEMP_DATA.speedBuffs.food.move;
  }

  const atkTotal = clamp(100 + atkBase + buffAtk, speedCap);
  const moveTotal = clamp(100 + moveBase + buffMove, speedCap);
  const atkAlways = clamp(100 + atkBase, speedCap);
  const moveAlways = clamp(100 + moveBase, speedCap);

  return {
    atkTotal,
    moveTotal,
    atkAlways,
    moveAlways,
    atkInc: Math.max(0, atkTotal - 100),
    moveInc: Math.max(0, moveTotal - 100),
    atkAlwaysInc: Math.max(0, atkAlways - 100),
    moveAlwaysInc: Math.max(0, moveAlways - 100),
  };
}

function getJobEngravingBonus(moveSpeed, atkSpeed) {
  if (!$('jobCritToggle').checked) return { critFromMove: 0, critDmgFromAtk: 0 };
  const level = Number(TEMP_DATA.jobCrit.level || 1);
  const moveScale = TEMP_DATA.jobCrit.moveScale[level] || 0;
  const atkScale = TEMP_DATA.jobCrit.atkScale[level] || 0;
  return {
    critFromMove: moveSpeed * moveScale,
    critDmgFromAtk: atkSpeed * atkScale,
  };
}

function getSkillCritBonus(skillId) {
  const skill = TEMP_DATA.skills.find(s => s.id === skillId);
  if (!skill) return 0;
  const tripodSum = skill.tripods.filter(t => t.selected).reduce((sum, t) => sum + Number(t.critBonus || 0), 0);
  return Number(skill.critBonus || 0) + tripodSum;
}

function clamp(value, cap) {
  if (cap <= 0) return value;
  return Math.min(value, cap);
}

function recalc() {
  updateCritCalculatorUI();
  const global = getGlobalCritBonus();
  const speed = getSpeedBonuses();
  const jobBonus = getJobEngravingBonus(speed.moveAlwaysInc, speed.atkAlwaysInc);
  const engineResult = calculateCritRate(buildCritCalculatorInput(window.__SPEC__ || null));
  const currentCrit = engineResult.totalCritRate + global.jobBonus + jobBonus.critFromMove;

  const selectedSkillId = $('skillSelect').value;
  const skillCrit = currentCrit + getSkillCritBonus(selectedSkillId);

  // Average over selected skills
  let totalWeight = 0;
  let totalCrit = 0;
  document.querySelectorAll('[data-skill-set-id]').forEach((el) => {
    if (!el.checked) return;
    const id = el.dataset.skillSetId;
    const weightInput = document.querySelector(`[data-skill-weight="${id}"]`);
    const weight = Number(weightInput?.value || 0);
    const crit = currentCrit + getSkillCritBonus(id);
    totalWeight += weight;
    totalCrit += crit * weight;
  });
  const avgCrit = totalWeight > 0 ? (totalCrit / totalWeight) : 0;

  $('currentCritRate').textContent = `${currentCrit.toFixed(2)}%`;
  $('skillCritRate').textContent = `${skillCrit.toFixed(2)}%`;
  $('avgCritRate').textContent = totalWeight > 0 ? `${avgCrit.toFixed(2)}%` : '-';
  $('totalAtkSpeed').textContent = `${speed.atkTotal.toFixed(2)}%`;
  $('totalMoveSpeed').textContent = `${speed.moveTotal.toFixed(2)}%`;
  if ($('alwaysAtkSpeed')) $('alwaysAtkSpeed').textContent = `${speed.atkAlways.toFixed(2)}%`;
  if ($('alwaysMoveSpeed')) $('alwaysMoveSpeed').textContent = `${speed.moveAlways.toFixed(2)}%`;
  if ($('neededSwiftStat')) {
    const atkCoeff = Number($('atkSpeedCoeffInput').value || 0);
    const baseAtk = Number($('baseAtkSpeedInput').value || 0);
    const jobAtk = Number($('jobAtkSpeedInput')?.value || 0);
    const braceletAtk = Number($('braceletAtkSpeedInput')?.value || 0);
    const tripodAtk = Number($('tripodAtkSpeedInput')?.value || 0);
    const arkCoreAtk = Number($('arkCoreAtkSpeedInput')?.value || 0);
    const arkCoreBoth = Number($('arkCoreSpeedInput')?.value || 0);
    const massPenalty = $('massIncreaseToggle')?.checked
      ? Number($('massIncreaseAtkSpeedInput')?.value || 0)
      : 0;
    const target = TEMP_DATA.speedTargets.entryAtkPercent;
    if (atkCoeff <= 0 || !$('swiftCoeffToggle').checked) {
      $('neededSwiftStat').textContent = '-';
    } else {
      const baseWithoutSwift = baseAtk + jobAtk + braceletAtk + tripodAtk + arkCoreAtk + arkCoreBoth - massPenalty;
      const needed = Math.max(0, (target - baseWithoutSwift) / atkCoeff);
      $('neededSwiftStat').textContent = `${Math.ceil(needed)}`;
    }
  }
  $('jobCritDmg').textContent = `${jobBonus.critDmgFromAtk.toFixed(2)}%`;
  $('jobCritFromMove').textContent = `${jobBonus.critFromMove.toFixed(2)}%`;

  const breakdown = [
    `기본=${engineResult.breakdown.critStatRate.toFixed(2)}%`,
    `아크패시브=${engineResult.breakdown.arkPassiveCritRate.toFixed(2)}%`,
    `악세=${engineResult.breakdown.accessoryCritRate.toFixed(2)}%`,
    `팔찌=${engineResult.breakdown.braceletCritRate.toFixed(2)}%`,
    `각인(아드레날린)=${engineResult.breakdown.engravingCritRate.toFixed(2)}%`,
    `시너지=${engineResult.breakdown.partySynergyCritRate.toFixed(2)}%`,
    `직각(깨달음)=${engineResult.breakdown.classEngravingCritRate.toFixed(2)}%`,
    `기타=${engineResult.breakdown.extraCritRate.toFixed(2)}%`
  ];
  $('calcBreakdown').textContent = `합산: ${breakdown.join(' / ')}`;
}

function updateCritCalculatorUI() {
  const spec = window.__SPEC__ || null;
  const apiInput = buildApiCritCalculatorInput(spec);
  const result = calculateCritRate(apiInput);

  const formatPercent = (value) => {
    const num = Number(value || 0);
    if (!Number.isFinite(num)) return '0%';
    const fixed = num.toFixed(2);
    return `${fixed.replace(/\.00$/, '')}%`;
  };

  const buildArkPassiveLabel = (total, items, withStyle) => {
    const base = formatPercent(total);
    if (!Array.isArray(items) || items.length === 0) return base;
    const details = items.map((it) => {
      const level = Number(it.level);
      const levelText = Number.isFinite(level) && level >= 1 ? ` ${level}lv` : '';
      return `${it.name}${levelText} (${formatPercent(it.critRate)})`;
    }).join(' + ');
    if (!withStyle) return `${base} (${details})`;
    return `${base} <span class="arkpassive-breakdown">(${details})</span>`;
  };

  const setText = (id, value) => {
    const el = $(id);
    if (!el) return;
    el.textContent = `${Number(value || 0).toFixed(2)}%`;
  };

  const critStatEl = $('apiCritStat');
  if (critStatEl) critStatEl.textContent = Number(spec?.critCalculatorInput?.api?.critStat || spec?.stats?.crit || 0) || '-';
  setText('apiBraceletCritRate', spec?.critRateSources?.bracelet ?? 0);
  setText('apiAccessoryCritRate', spec?.critRateSources?.accessory ?? 0);
  setText('apiArkGridCritRate', spec?.critCalculatorInput?.api?.arkGridCritRate ?? 0);
  const arkPassiveEl = $('apiArkPassiveCritRate');
  if (arkPassiveEl) {
    arkPassiveEl.innerHTML = buildArkPassiveLabel(
      spec?.critRateSources?.arkpassive ?? 0,
      spec?.critRateSources?.arkpassiveBreakdown?.items,
      true
    );
  }
  setText('apiEngravingCritRate', spec?.critRateSources?.adrenaline ?? 0);

  const totalEl = $('totalCritRate');
  if (totalEl) totalEl.textContent = `${result.totalCritRate.toFixed(2)}%`;

  const breakdownRoot = $('critBreakdown');
  if (breakdownRoot) {
    const b = result.breakdown;
    const arkPassiveBreakdown = buildArkPassiveLabel(
      b.arkPassiveCritRate,
      getManualArkPassiveBreakdownItems(),
      true
    );
    breakdownRoot.innerHTML = `
      <div class="calc-row"><label>치명 스탯</label><div>${b.critStatRate.toFixed(2)}%</div></div>
      <div class="calc-row"><label>팔찌</label><div>${b.braceletCritRate.toFixed(2)}%</div></div>
      <div class="calc-row"><label>악세서리</label><div>${b.accessoryCritRate.toFixed(2)}%</div></div>
      <div class="calc-row"><label>아크그리드</label><div>${b.arkGridCritRate.toFixed(2)}%</div></div>
      <div class="calc-row"><label>아크패시브</label><div>${arkPassiveBreakdown}</div></div>
      <div class="calc-row"><label>각인(아드레날린)</label><div>${b.engravingCritRate.toFixed(2)}%</div></div>
      <div class="calc-row"><label>파티 시너지</label><div>${b.partySynergyCritRate.toFixed(2)}%</div></div>
      <div class="calc-row"><label>직업 각인(깨달음)</label><div>${b.classEngravingCritRate.toFixed(2)}%</div></div>
      <div class="calc-row"><label>기타</label><div>${b.extraCritRate.toFixed(2)}%</div></div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', initCritCalc);
