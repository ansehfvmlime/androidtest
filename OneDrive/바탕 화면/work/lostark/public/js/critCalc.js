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

function calculateCritRate(input) {
  const partySynergyCritRateMap = {
    0: 0,
    1: 10,
    2: 20,
    3: 30,
  };

  const partyLevel = Number(input?.manual?.partySynergyLevel ?? 0);

  const breakdown = {
    critStatRate: Number(input?.api?.critStatRate ?? 0),
    braceletCritRate: Number(input?.api?.braceletCritRate ?? 0),
    accessoryCritRate: Number(input?.api?.accessoryCritRate ?? 0),
    arkGridCritRate: Number(input?.api?.arkGridCritRate ?? 0),
    arkPassiveCritRate: Number(input?.api?.arkPassiveCritRate ?? 0),
    petCritRate: Number(input?.api?.petCritRate ?? 0),
    engravingCritRate: Number(input?.api?.engravingCritRate ?? 0),
    partySynergyCritRate: Number(partySynergyCritRateMap[partyLevel] ?? 0),
    classEngravingCritRate: Number(input?.manual?.classEngravingCritRate ?? 0),
    extraCritRate: Number(input?.manual?.extraCritRate ?? 0),
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
  const critStat = Number(spec?.stats?.crit ?? 0);
  const swiftStat = Number(spec?.stats?.swift ?? 0);
  const specStat = Number(spec?.stats?.spec ?? 0);

  const critStatInput = $('critStatInput');
  const coeffInput = $('critCoeffInput');
  const capInput = $('critCapInput');
  const synergyInput = $('synergyCountInput');
  const jobCritInput = $('jobCritInput');
  const jobCritToggle = $('jobCritToggle');
  const arkPassiveCritInput = $('arkPassiveCritInput');
  const accessoryCritInput = $('accessoryCritInput');
  const braceletCritInput = $('braceletCritInput');
  const adrenalineCritInput = $('adrenalineCritInput');
  const adrenalineToggle = $('adrenalineToggle');
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
  const petStatSelect = $('petStatSelect');
  const partySynergySelect = $('partySynergy');
  const classEngravingInput = $('classEngravingCritRate');
  const extraCritInput = $('extraCritRate');

  if (!critStatInput) return;

  critStatInput.value = critStat || '';
  coeffInput.value = TEMP_DATA.critCoeffPercent;
  capInput.value = TEMP_DATA.critCapPercent;
  synergyInput.value = '0';
  jobCritInput.value = TEMP_DATA.jobCrit.value;
  jobCritToggle.checked = TEMP_DATA.jobCrit.toggle;
  if (arkPassiveCritInput) arkPassiveCritInput.value = spec?.critRateSources?.arkpassive ?? 0;
  if (accessoryCritInput) accessoryCritInput.value = spec?.critRateSources?.accessory ?? 0;
  if (braceletCritInput) braceletCritInput.value = spec?.critRateSources?.bracelet ?? 0;
  const adrenalineBase = Number(spec?.critRateSources?.adrenaline ?? 0);
  if (adrenalineCritInput) adrenalineCritInput.value = adrenalineBase || 0;
  if (adrenalineToggle) adrenalineToggle.checked = adrenalineBase > 0;
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
  if (partySynergySelect) partySynergySelect.value = '0';
  if (classEngravingInput) classEngravingInput.value = 0;
  if (extraCritInput) extraCritInput.value = 0;

  // Skill select
  skillSelect.innerHTML = TEMP_DATA.skills.map((s) => `
    <option value="${s.id}">${s.name}</option>
  `).join('');

  renderSkillTripods(skillSelect.value);
  renderSkillSet();
  initPetStatUI({ crit: critStat, spec: specStat, swift: swiftStat });
  recalc();

  critStatInput.addEventListener('input', recalc);
  coeffInput.addEventListener('input', recalc);
  capInput.addEventListener('input', recalc);
  if (arkPassiveCritInput) arkPassiveCritInput.addEventListener('input', recalc);
  if (accessoryCritInput) accessoryCritInput.addEventListener('input', recalc);
  if (braceletCritInput) braceletCritInput.addEventListener('input', recalc);
  if (adrenalineCritInput) adrenalineCritInput.addEventListener('input', recalc);
  if (adrenalineToggle) adrenalineToggle.addEventListener('change', recalc);
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

  skillSelect.addEventListener('change', () => {
    renderSkillTripods(skillSelect.value);
    recalc();
  });
}

function initPetStatUI(baseStats) {
  const petStatSelect = $('petStatSelect');
  if (!petStatSelect) return;

  const options = {
    crit: baseStats.crit,
    spec: baseStats.spec,
    swift: baseStats.swift,
  };

  ['crit', 'spec', 'swift'].forEach((key) => {
    const opt = petStatSelect.querySelector(`option[value="${key}"]`);
    if (!opt) return;
    opt.disabled = options[key] < 800;
  });

  petStatSelect.addEventListener('change', () => {
    const selected = petStatSelect.value;
    if (selected !== 'none' && options[selected] < 800) {
      petStatSelect.value = 'none';
      setPetHint('선택한 특성이 800 미만입니다.');
    } else {
      setPetHint('');
    }
    applyPetBonus(baseStats, petStatSelect.value);
    recalc();
  });

  applyPetBonus(baseStats, petStatSelect.value || 'none');
}

function applyPetBonus(baseStats, selected) {
  const bonus = 160;
  const withBonus = {
    crit: baseStats.crit + (selected === 'crit' ? bonus : 0),
    spec: baseStats.spec + (selected === 'spec' ? bonus : 0),
    swift: baseStats.swift + (selected === 'swift' ? bonus : 0),
  };

  const critEl = $('statCritValue');
  const specEl = $('statSpecValue');
  const swiftEl = $('statSwiftValue');
  const critBonusEl = $('statCritBonus');
  const specBonusEl = $('statSpecBonus');
  const swiftBonusEl = $('statSwiftBonus');

  if (critEl) critEl.textContent = withBonus.crit || '-';
  if (specEl) specEl.textContent = withBonus.spec || '-';
  if (swiftEl) swiftEl.textContent = withBonus.swift || '-';

  if (critBonusEl) critBonusEl.textContent = selected === 'crit' ? `펫 +${bonus}` : '';
  if (specBonusEl) specBonusEl.textContent = selected === 'spec' ? `펫 +${bonus}` : '';
  if (swiftBonusEl) swiftBonusEl.textContent = selected === 'swift' ? `펫 +${bonus}` : '';

  const critInput = $('critStatInput');
  const swiftInput = $('swiftStatInput');
  if (critInput) critInput.value = withBonus.crit || '';
  if (swiftInput) swiftInput.value = withBonus.swift || '';
}

function setPetHint(text) {
  const hint = $('petStatHint');
  if (hint) hint.textContent = text;
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
  const synergyCount = Number($('synergyCountInput').value || 0);
  const synergy = synergyCount * TEMP_DATA.synergyPerPerson;

  const jobBonus = $('jobCritToggle').checked ? Number($('jobCritInput').value || 0) : 0;

  return { synergy, jobBonus };
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
  const base = getBaseCritRate();
  const cap = Number($('critCapInput').value || 0);
  const global = getGlobalCritBonus();
  const speed = getSpeedBonuses();
  const jobBonus = getJobEngravingBonus(speed.moveAlwaysInc, speed.atkAlwaysInc);
  const arkPassiveCrit = Number($('arkPassiveCritInput')?.value || 0);
  const accessoryCrit = Number($('accessoryCritInput')?.value || 0);
  const braceletCrit = Number($('braceletCritInput')?.value || 0);
  const adrenalineCrit = $('adrenalineToggle')?.checked ? Number($('adrenalineCritInput')?.value || 0) : 0;
  const classEngravingCrit = Number($('classEngravingCritRate')?.value || 0);
  const extraCritInput = Number($('extraCritRate')?.value || 0);
  const engineResult = calculateCritRate({
    api: {
      critStat: Number($('critStatInput')?.value || 0),
      critStatRate: base,
      braceletCritRate: braceletCrit,
      accessoryCritRate: accessoryCrit,
      arkGridCritRate: 0,
      arkPassiveCritRate: arkPassiveCrit,
      petCritRate: 0,
      engravingCritRate: adrenalineCrit,
    },
    manual: {
      partySynergyLevel: Number($('synergyCountInput')?.value || 0),
      partySynergyCritRate: 0,
      classEngravingCritRate: classEngravingCrit,
      extraCritRate: extraCritInput,
    },
  });
  const currentCrit = clamp(
    base + arkPassiveCrit + accessoryCrit + braceletCrit + adrenalineCrit + extraCritInput + global.synergy + classEngravingCrit + jobBonus.critFromMove,
    cap
  );

  const selectedSkillId = $('skillSelect').value;
  const skillCrit = clamp(currentCrit + getSkillCritBonus(selectedSkillId), cap);

  // Average over selected skills
  let totalWeight = 0;
  let totalCrit = 0;
  document.querySelectorAll('[data-skill-set-id]').forEach((el) => {
    if (!el.checked) return;
    const id = el.dataset.skillSetId;
    const weightInput = document.querySelector(`[data-skill-weight="${id}"]`);
    const weight = Number(weightInput?.value || 0);
    const crit = clamp(currentCrit + getSkillCritBonus(id), cap);
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
  const baseInput = spec?.critCalculatorInput || {};
  const critStatRate = getBaseCritRate();
  const partyLevel = Number($('partySynergy')?.value || 0);
  const adrenalineCrit = $('adrenalineToggle')?.checked ? Number($('adrenalineCritInput')?.value || 0) : 0;
  const extraCritInput = Number($('extraCritRate')?.value || 0);

  const input = {
    api: {
      critStat: Number($('critStatInput')?.value || baseInput.api?.critStat || 0),
      critStatRate,
      braceletCritRate: Number(baseInput.api?.braceletCritRate ?? spec?.critRateSources?.bracelet ?? 0),
      accessoryCritRate: Number(baseInput.api?.accessoryCritRate ?? spec?.critRateSources?.accessory ?? 0),
      arkGridCritRate: Number(baseInput.api?.arkGridCritRate ?? 0),
      arkPassiveCritRate: Number(baseInput.api?.arkPassiveCritRate ?? spec?.critRateSources?.arkpassive ?? 0),
      petCritRate: Number(baseInput.api?.petCritRate ?? 0),
      engravingCritRate: Number(baseInput.api?.engravingCritRate ?? spec?.critRateSources?.adrenaline ?? 0),
    },
    manual: {
      partySynergyLevel: partyLevel,
      partySynergyCritRate: 0,
      classEngravingCritRate: Number($('classEngravingCritRate')?.value || 0),
      extraCritRate: extraCritInput,
    },
  };

  const result = calculateCritRate(input);

  const setText = (id, value) => {
    const el = $(id);
    if (!el) return;
    el.textContent = `${Number(value || 0).toFixed(2)}%`;
  };

  const critStatEl = $('apiCritStat');
  if (critStatEl) critStatEl.textContent = Number(input.api.critStat || 0) || '-';
  setText('apiBraceletCritRate', input.api.braceletCritRate);
  setText('apiAccessoryCritRate', input.api.accessoryCritRate);
  setText('apiArkGridCritRate', input.api.arkGridCritRate);
  setText('apiArkPassiveCritRate', input.api.arkPassiveCritRate);
  setText('apiPetCritRate', input.api.petCritRate);
  setText('apiEngravingCritRate', input.api.engravingCritRate);

  const totalEl = $('totalCritRate');
  if (totalEl) totalEl.textContent = `${result.totalCritRate.toFixed(2)}%`;

  const breakdownRoot = $('critBreakdown');
  if (breakdownRoot) {
    const b = result.breakdown;
    breakdownRoot.innerHTML = `
      <div class="calc-row"><label>치명 스탯</label><div>${b.critStatRate.toFixed(2)}%</div></div>
      <div class="calc-row"><label>팔찌</label><div>${b.braceletCritRate.toFixed(2)}%</div></div>
      <div class="calc-row"><label>악세서리</label><div>${b.accessoryCritRate.toFixed(2)}%</div></div>
      <div class="calc-row"><label>아크그리드</label><div>${b.arkGridCritRate.toFixed(2)}%</div></div>
      <div class="calc-row"><label>아크패시브</label><div>${b.arkPassiveCritRate.toFixed(2)}%</div></div>
      <div class="calc-row"><label>펫</label><div>${b.petCritRate.toFixed(2)}%</div></div>
      <div class="calc-row"><label>각인(아드레날린)</label><div>${b.engravingCritRate.toFixed(2)}%</div></div>
      <div class="calc-row"><label>파티 시너지</label><div>${b.partySynergyCritRate.toFixed(2)}%</div></div>
      <div class="calc-row"><label>직업 각인(깨달음)</label><div>${b.classEngravingCritRate.toFixed(2)}%</div></div>
      <div class="calc-row"><label>기타</label><div>${b.extraCritRate.toFixed(2)}%</div></div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', initCritCalc);
