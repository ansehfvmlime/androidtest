const cache = require('./cache');
const loa = require('./lostarkApi');

const TTL = Number(process.env.CACHE_TTL_MS || 120000);

function nowKSTISOString() {
  // 서버 시간이 KST가 아닐 수 있으니 그냥 ISO로 제공(화면에서 표시만)
  return new Date().toISOString();
}

// ---- 공통 유틸: 배열에서 특정 이름(치명/특화/신속 등) 찾기
function pickStatValue(statsArray, keyKorean) {
  if (!Array.isArray(statsArray)) return null;
  const it = statsArray.find(x => x?.Type === keyKorean || x?.Name === keyKorean);
  return it?.Value ?? null;
}

function normalizeEngravings(raw) {
  const source =
    raw?.Effects ??
    raw?.Engravings ??
    raw?.ArkPassiveEffects ??
    raw?.arkPassiveEffects ??
    raw?.effects ??
    raw?.engravings ??
    raw;

  const arr = Array.isArray(source) ? source : [];
  const list = arr.map(item => {
    if (typeof item === 'string') {
      return { name: item, level: null, description: null, icon: null, grade: null, abilityStoneLevel: null };
    }

    return {
      name: stripHtml(item?.Name ?? item?.EngravingName ?? item?.Title ?? item?.EffectName ?? null),
      level: item?.Level ?? item?.Grade ?? item?.EngravingLevel ?? null,
      description: stripHtml(item?.Description ?? item?.Effect ?? item?.Tooltip ?? item?.Desc ?? null),
      icon: item?.Icon ?? item?.IconPath ?? item?.IconUrl ?? null,
      grade: item?.Grade ?? item?.Rarity ?? null,
      abilityStoneLevel: item?.AbilityStoneLevel ?? null,
    };
  });

  const sorted = list.slice().sort((a, b) => {
    const aLv = Number(a.level ?? 0);
    const bLv = Number(b.level ?? 0);
    if (bLv !== aLv) return bLv - aLv;
    return String(a.name ?? '').localeCompare(String(b.name ?? ''), 'ko');
  });

  return { list: sorted, raw };
}

function stripHtml(input) {
  if (!input) return '';
  return String(input)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim();
}

function extractCritRateFromText(text) {
  if (!text) return 0;
  const input = String(text);
  const pattern = /(치명타\s*(적중률|확률)|치명\s*적중률|치명타율|치명률)\s*[^0-9+-]*([+-]?[0-9.]+)%/g;
  let sum = 0;
  let match = null;
  while ((match = pattern.exec(input)) !== null) {
    sum += Number(match[3] || 0);
  }
  return sum;
}

function collectEffectTexts(root) {
  const texts = [];
  const queue = [root];
  const seen = new Set();
  let safety = 0;

  while (queue.length && safety < 2000) {
    const node = queue.shift();
    safety += 1;
    if (!node || typeof node !== 'object') continue;
    if (seen.has(node)) continue;
    seen.add(node);

    if (Array.isArray(node)) {
      node.forEach((item) => queue.push(item));
      continue;
    }

    Object.keys(node).forEach((key) => {
      const value = node[key];
      if (typeof value === 'string') {
        if (['Description', 'Tooltip', 'ToolTip', 'Effect', 'Desc'].includes(key)) {
          texts.push(stripHtml(value));
        }
      } else if (value && typeof value === 'object') {
        queue.push(value);
      }
    });
  }

  return texts;
}

function normalizeKey(text) {
  return String(text || '')
    .replace(/\s+/g, '')
    .replace(/[^0-9a-zA-Z가-힣]/g, '')
    .toLowerCase();
}

function collectArkPassiveEntries(root) {
  const entries = [];
  const queue = [root];
  const seen = new Set();
  let safety = 0;

  while (queue.length && safety < 3000) {
    const node = queue.shift();
    safety += 1;
    if (!node || typeof node !== 'object') continue;
    if (seen.has(node)) continue;
    seen.add(node);

    if (Array.isArray(node)) {
      node.forEach((item) => queue.push(item));
      continue;
    }

    const name = node?.Name ?? node?.Title ?? node?.EffectName ?? node?.Type ?? null;
    const desc = node?.Description ?? node?.Tooltip ?? node?.ToolTip ?? node?.Effect ?? node?.Desc ?? null;
    if (name || desc) {
      entries.push({
        name: name ? stripHtml(name) : '',
        desc: desc ? stripHtml(desc) : '',
        raw: node,
      });
    }

    Object.keys(node).forEach((key) => {
      const value = node[key];
      if (value && typeof value === 'object') queue.push(value);
    });
  }

  return entries;
}

function parseArkPassiveLevel(entry) {
  const direct = entry?.raw?.Level ?? entry?.raw?.Grade ?? entry?.raw?.EngravingLevel ?? entry?.raw?.level ?? null;
  if (Number.isFinite(Number(direct))) {
    const value = Number(direct);
    return value >= 1 ? value : null;
  }
  const text = `${entry?.name ?? ''} ${entry?.desc ?? ''}`;
  const lvMatch = text.match(/lv\.?\s*(\d+)/i) || text.match(/레벨\s*(\d+)/i) || text.match(/Lv\.\s*(\d+)/);
  if (!lvMatch) return null;
  const parsed = Number(lvMatch[1]);
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : null;
}

function parseArkPassiveCritBreakdown(arkpassive) {
  const source = arkpassive?.data ?? arkpassive ?? null;
  if (!source) return { total: 0, items: [] };

  const targets = [
    { key: '달인', display: '달인', fixedCrit: 7 },
    { key: '예리한감각', display: '예리한 감각' },
    { key: '혼신의강타', display: '혼신의 강타' },
    { key: '일격', display: '일격' },
  ];

  const entries = collectArkPassiveEntries(source);
  const map = new Map();

  entries.forEach((e) => {
    const nameKey = normalizeKey(e.name);
    const descKey = normalizeKey(e.desc);
    const target = targets.find((t) => nameKey.includes(t.key) || descKey.includes(t.key));
    if (!target) return;

    const level = parseArkPassiveLevel(e);
    let crit = 0;
    if (Number.isFinite(target.fixedCrit)) {
      crit = target.fixedCrit;
    } else {
      crit = extractCritRateFromText(e.desc);
      if (!crit && e.raw) {
        const texts = collectEffectTexts(e.raw);
        crit = texts.reduce((acc, t) => acc + extractCritRateFromText(t), 0);
      }
    }

    if (!crit) return;

    const existing = map.get(target.key);
    if (!existing || crit > existing.critRate || (level && !existing.level)) {
      map.set(target.key, {
        name: target.display,
        level: Number.isFinite(level) ? level : null,
        critRate: crit,
      });
    }
  });

  const items = targets
    .map((t) => map.get(t.key))
    .filter(Boolean);

  const total = items.reduce((sum, it) => sum + Number(it.critRate || 0), 0);

  return { total, items };
}

function parseAdrenalineCritRate(engravingList) {
  if (!Array.isArray(engravingList)) return 0;
  const target = engravingList.find((it) => {
    const name = String(it?.name ?? '');
    return name.includes('아드레날린') || name.toLowerCase().includes('adrenaline');
  });
  if (!target) return 0;
  const desc = target?.description ?? target?.desc ?? target?.effect ?? '';
  return extractCritRateFromText(desc);
}

function extractAtkSpeedPenaltyFromText(text) {
  if (!text) return 0;
  const input = String(text);
  const decPattern = /(공격\s*속도|공격속도|attack\s*speed)\s*[^0-9+-]*([+-]?[0-9.]+)%\s*(감소|down|decrease)/gi;
  let sum = 0;
  let match = null;
  while ((match = decPattern.exec(input)) !== null) {
    const value = Number(match[2] || 0);
    if (Number.isFinite(value)) sum += Math.abs(value);
  }
  if (sum > 0) return sum;

  const signedPattern = /(공격\s*속도|공격속도|attack\s*speed)\s*[^0-9+-]*([+-][0-9.]+)%/gi;
  while ((match = signedPattern.exec(input)) !== null) {
    const value = Number(match[2] || 0);
    if (Number.isFinite(value) && value < 0) sum += Math.abs(value);
  }
  return sum;
}

function parseMassIncreaseAtkSpeedPenalty(engravingList) {
  if (!Array.isArray(engravingList)) return 0;
  const target = engravingList.find((it) => {
    const name = String(it?.name ?? '');
    return name.includes('질량 증가') || name.toLowerCase().includes('mass increase');
  });
  if (!target) return 0;
  const desc = target?.description ?? target?.desc ?? target?.effect ?? '';
  return extractAtkSpeedPenaltyFromText(desc);
}

function parseItemTooltipText(rawTooltip) {
  if (!rawTooltip) return '';
  try {
    const obj = typeof rawTooltip === 'string' ? JSON.parse(rawTooltip) : rawTooltip;
    const values = [];
    const queue = [obj];
    const seen = new Set();
    let safety = 0;
    while (queue.length && safety < 4000) {
      const node = queue.shift();
      safety += 1;
      if (!node || typeof node !== 'object') continue;
      if (seen.has(node)) continue;
      seen.add(node);

      if (Array.isArray(node)) {
        node.forEach((item) => queue.push(item));
        continue;
      }

      Object.keys(node).forEach((key) => {
        const value = node[key];
        if (typeof value === 'string') {
          values.push(value);
        } else if (value && typeof value === 'object') {
          if (typeof value.value === 'string') values.push(value.value);
          queue.push(value);
        }
      });
    }
    return stripHtml(values.join('\n'));
  } catch {
    return stripHtml(String(rawTooltip));
  }
}

function parseEquipmentCritRates(equipmentList) {
  const list = Array.isArray(equipmentList) ? equipmentList : [];
  let accessory = 0;
  let bracelet = 0;

  list.forEach((it) => {
    const type = [
      it?.Type,
      it?.ItemType,
      it?.Slot,
      it?.Name,
      it?.ItemName,
      it?.TypeName,
      it?.Category,
    ].filter(Boolean).join(' ');
    const typeLower = String(type).toLowerCase();
    const tooltipText = parseItemTooltipText(it?.Tooltip ?? it?.tooltip ?? it?.ToolTip ?? '');
    const critRate = extractCritRateFromText(tooltipText);
    if (!critRate) return;

    const isBracelet = type.includes('팔찌') || typeLower.includes('bracelet');
    const isAccessory =
      type.includes('목걸이') ||
      type.includes('귀걸이') ||
      type.includes('반지') ||
      typeLower.includes('necklace') ||
      typeLower.includes('earring') ||
      typeLower.includes('ring');

    if (isBracelet) {
      bracelet += critRate;
      return;
    }
    if (isAccessory) {
      accessory += critRate;
    }
  });

  return { accessory, bracelet };
}

function extractSpeedRatesFromText(text) {
  if (!text) return { atk: 0, move: 0 };
  const input = String(text);
  const atkPattern = /(공격\s*속도|공격속도|attack\s*speed)\s*[^0-9+-]*([+-]?[0-9.]+)%/gi;
  const movePattern = /(이동\s*속도|이동속도|move\s*speed|movement\s*speed)\s*[^0-9+-]*([+-]?[0-9.]+)%/gi;

  let atk = 0;
  let move = 0;
  let match = null;

  while ((match = atkPattern.exec(input)) !== null) {
    const value = Number(match[2] || 0);
    if (Number.isFinite(value)) atk += value;
  }
  while ((match = movePattern.exec(input)) !== null) {
    const value = Number(match[2] || 0);
    if (Number.isFinite(value)) move += value;
  }

  return { atk, move };
}

function parseBraceletSpeedRates(equipmentList) {
  const list = Array.isArray(equipmentList) ? equipmentList : [];
  let atk = 0;
  let move = 0;

  list.forEach((it) => {
    const type = [
      it?.Type,
      it?.ItemType,
      it?.Slot,
      it?.Name,
      it?.ItemName,
      it?.TypeName,
      it?.Category,
    ].filter(Boolean).join(' ');
    const typeLower = String(type).toLowerCase();
    const isBracelet = type.includes('팔찌') || typeLower.includes('bracelet');
    if (!isBracelet) return;

    const tooltipText = parseItemTooltipText(it?.Tooltip ?? it?.tooltip ?? it?.ToolTip ?? '');
    const speed = extractSpeedRatesFromText(tooltipText);
    atk += speed.atk;
    move += speed.move;
  });

  return { atk, move };
}

function parseGemTooltip(rawTooltip) {
  if (!rawTooltip) return null;
  try {
    const obj = typeof rawTooltip === 'string' ? JSON.parse(rawTooltip) : rawTooltip;
    const effectBox = obj?.Element_006?.value?.Element_001 ?? obj?.Element_006?.value ?? null;
    const effectText = stripHtml(effectBox || '');
    return effectText || null;
  } catch {
    return null;
  }
}

function parseGemEffect(effectText) {
  if (!effectText) return { skill: null, effectType: null, effectValue: null, extra: null };
  const lines = effectText.split('\n').map(s => s.trim()).filter(Boolean);
  const effectLine = lines.find(l => l.includes('피해') || l.includes('재사용 대기시간')) || lines[0] || '';
  const extraLine = lines.find(l => l.includes('기본 공격력')) || null;

  const skillMatch = effectLine.match(/\[(.+?)\]\s*(.+?)\s*(피해|재사용 대기시간)/);
  const skill = skillMatch ? skillMatch[2] : null;

  const dmgMatch = effectLine.match(/피해\s*([0-9.]+)%\s*증가/);
  const cdMatch = effectLine.match(/재사용 대기시간\s*([0-9.]+)%\s*감소/);
  const extraMatch = extraLine ? extraLine.match(/기본 공격력\s*([0-9.]+)%\s*증가/) : null;

  return {
    skill,
    effectType: dmgMatch ? '피해 증가' : (cdMatch ? '재사용 감소' : null),
    effectValue: dmgMatch ? dmgMatch[1] : (cdMatch ? cdMatch[1] : null),
    extra: extraMatch ? `기본 공격력 ${extraMatch[1]}% 증가` : null,
  };
}

function normalizeGems(raw) {
  const source =
    raw?.Gems ??
    raw?.gems ??
    raw?.Items ??
    raw;

  const arr = Array.isArray(source) ? source : [];
  const list = arr.map(item => {
    if (typeof item === 'string') {
      return {
        name: item,
        level: null,
        grade: null,
        icon: null,
        slot: null,
        effectType: null,
        effectValue: null,
        skill: null,
        extra: null,
      };
    }

    const name = stripHtml(item?.Name ?? item?.ItemName ?? item?.GemName ?? '');
    const tooltipEffectText = parseGemTooltip(item?.Tooltip ?? item?.tooltip ?? null);
    const parsed = parseGemEffect(tooltipEffectText);

    return {
      name: name || null,
      level: item?.Level ?? null,
      grade: item?.Grade ?? null,
      icon: item?.Icon ?? item?.IconPath ?? item?.IconUrl ?? null,
      slot: item?.Slot ?? null,
      skill: item?.SkillName ?? item?.Skill?.Name ?? item?.Skill ?? parsed.skill ?? null,
      effectType: parsed.effectType,
      effectValue: parsed.effectValue,
      extra: parsed.extra,
      rawName: item?.Name ?? null,
    };
  });

  const sorted = list.slice().sort((a, b) => {
    const bLv = Number(b.level ?? 0);
    const aLv = Number(a.level ?? 0);
    if (bLv !== aLv) return bLv - aLv;
    const aSlot = Number(a.slot ?? 999);
    const bSlot = Number(b.slot ?? 999);
    if (aSlot !== bSlot) return aSlot - bSlot;
    return String(a.name ?? '').localeCompare(String(b.name ?? ''), 'ko');
  });

  return { list: sorted, raw };
}

async function getSummary(name) {
  const key = `summary:${name}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const profile = await loa.getProfile(name);

  // ✅ 전투력 필드는 실제 응답에서 정확히 확인해야 해서,
  // 여러 후보 키를 두고 "있으면 표시" 전략으로.
  const combatPower =
    profile?.CombatPower ??
    profile?.BattlePower ??
    profile?.TotalPower ??
    null;

  const vm = {
    characterName: profile?.CharacterName ?? name,
    serverName: profile?.ServerName ?? null,
    className: profile?.CharacterClassName ?? null,
    itemLevel: profile?.ItemAvgLevel ?? profile?.ItemMaxLevel ?? null,
    combatPower, // 인게임 전투력(있으면)
    levels: {
      combat: profile?.CharacterLevel ?? null,
      expedition: profile?.ExpeditionLevel ?? null,
    },
    guild: profile?.GuildName ?? null,
    title: profile?.Title ?? null,
    stats: {
      crit: pickStatValue(profile?.Stats, '치명'),
      spec: pickStatValue(profile?.Stats, '특화'),
      swift: pickStatValue(profile?.Stats, '신속'),
    },
    updatedAt: nowKSTISOString(),
  };

  cache.set(key, vm, TTL);
  return vm;
}

async function getEquipment(name) {
  const key = `equipment:${name}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const equipment = await loa.getEquipment(name);

  // MVP: 원본 일부를 그대로 보여주되, 뷰에서 보기 좋게 최소 가공
  // (나중에 무기/방어구/악세/팔찌/돌로 분류해주면 로아와 느낌이 난다)
  const vm = {
    list: Array.isArray(equipment) ? equipment : [],
    updatedAt: nowKSTISOString(),
  };

  cache.set(key, vm, TTL);
  return vm;
}

async function getSpec(name) {
  const key = `spec:${name}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const [profile, engravings, gems, arkpassive, equipment] = await Promise.all([
    loa.getProfile(name),
    loa.getEngravings(name),
    loa.getGems(name),
    loa.getArkpassive(name).catch(() => null),
    loa.getEquipment(name).catch(() => null),
  ]);

  const arkPassiveBreakdown = parseArkPassiveCritBreakdown(arkpassive);
  const arkPassiveCritRate = Number(arkPassiveBreakdown.total ?? 0);
  const equipCritRates = parseEquipmentCritRates(Array.isArray(equipment) ? equipment : equipment?.list);
  const braceletSpeedRates = parseBraceletSpeedRates(Array.isArray(equipment) ? equipment : equipment?.list);
  const normalizedEngravings = normalizeEngravings(engravings);
  const adrenalineCritRate = parseAdrenalineCritRate(normalizedEngravings.list);
  const massIncreaseAtkSpeedPenalty = parseMassIncreaseAtkSpeedPenalty(normalizedEngravings.list);
  const partySynergyCritRateMap = { 0: 0, 1: 10, 2: 20, 3: 30 };

  const vm = {
    stats: {
      crit: pickStatValue(profile?.Stats, '치명'),
      spec: pickStatValue(profile?.Stats, '특화'),
      swift: pickStatValue(profile?.Stats, '신속'),
    },
    engravings: normalizedEngravings,
    gems: normalizeGems(gems),
    updatedAt: nowKSTISOString(),
    critRateSources: {
      arkpassive: arkPassiveCritRate,
      accessory: equipCritRates.accessory,
      bracelet: equipCritRates.bracelet,
      adrenaline: adrenalineCritRate,
      arkpassiveBreakdown: arkPassiveBreakdown,
    },
    critCalculatorInput: {
      api: {
        critStat: Number(pickStatValue(profile?.Stats, '치명') ?? 0),
        critStatRate: 0,
        braceletCritRate: Number(equipCritRates.bracelet ?? 0),
        accessoryCritRate: Number(equipCritRates.accessory ?? 0),
        arkGridCritRate: 0,
        arkPassiveCritRate: Number(arkPassiveCritRate ?? 0),
        petCritRate: 0,
        engravingCritRate: Number(adrenalineCritRate ?? 0),
      },
      manual: {
        partySynergyLevel: 0,
        partySynergyCritRate: partySynergyCritRateMap[0],
        selfSynergyCritRate: 0,
      },
    },
    speedSources: {
      massIncreaseAtkSpeed: massIncreaseAtkSpeedPenalty,
      braceletAtkSpeed: braceletSpeedRates.atk,
      braceletMoveSpeed: braceletSpeedRates.move,
    },
  };

  cache.set(key, vm, TTL);
  return vm;
}

async function getArkgrid(name) {
  const key = `arkgrid:${name}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const arkgrid = await loa.getArkgrid(name);
  const vm = {
    data: arkgrid,
    available: true,
    updatedAt: nowKSTISOString(),
  };
  cache.set(key, vm, TTL);
  return vm;
}

async function getArkpassive(name) {
  const key = `arkpassive:${name}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const arkpassive = await loa.getArkpassive(name);
  const vm = {
    data: arkpassive,
    available: true,
    updatedAt: nowKSTISOString(),
  };
  cache.set(key, vm, TTL);
  return vm;
}

async function refresh(name) {
  cache.del(`summary:${name}`);
  cache.del(`equipment:${name}`);
  cache.del(`spec:${name}`);
  cache.del(`arkgrid:${name}`);
  cache.del(`arkpassive:${name}`);
  // arkgrid/arkpassive는 현재 캐시 사용 안 함
}

module.exports = {
  getSummary,
  getEquipment,
  getSpec,
  getArkgrid,
  getArkpassive,
  refresh,
};
