const BASE = process.env.LOSTARK_BASE || 'https://developer-lostark.game.onstove.com';
const JWT = process.env.LOSTARK_JWT;

if (!JWT) {
  throw new Error('LOSTARK_JWT is missing. Put it in .env');
}

async function loaGet(path) {
  const url = `${BASE}${path}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      authorization: `bearer ${JWT}`,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`LOA API ${res.status} ${res.statusText} - ${text}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

// ✅ ARMORIES (캐릭터 상세)
function getProfile(name) {
  return loaGet(`/armories/characters/${encodeURIComponent(name)}/profiles`);
}
function getEquipment(name) {
  return loaGet(`/armories/characters/${encodeURIComponent(name)}/equipment`);
}
function getEngravings(name) {
  return loaGet(`/armories/characters/${encodeURIComponent(name)}/engravings`);
}
function getGems(name) {
  return loaGet(`/armories/characters/${encodeURIComponent(name)}/gems`);
}
function getArkpassive(name) {
  return loaGet(`/armories/characters/${encodeURIComponent(name)}/arkpassive`);
}
function getArkgrid(name) {
  return loaGet(`/armories/characters/${encodeURIComponent(name)}/arkgrid`);
}

module.exports = {
  getProfile,
  getEquipment,
  getEngravings,
  getGems,
  getArkpassive,
  getArkgrid,
};
