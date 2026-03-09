const characterService = require('../services/characterService');

function getName(req) {
  return (req.params.name || '').trim();
}

async function getSummary(req, res, next) {
  try {
    const data = await characterService.getSummary(getName(req));
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

async function getEquipment(req, res, next) {
  try {
    const data = await characterService.getEquipment(getName(req));
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

async function getSpec(req, res, next) {
  try {
    const data = await characterService.getSpec(getName(req));
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

async function getArkgrid(req, res, next) {
  try {
    const data = await characterService.getArkgrid(getName(req));
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

async function getArkpassive(req, res, next) {
  try {
    const data = await characterService.getArkpassive(getName(req));
    res.json({ ok: true, data });
  } catch (e) { next(e); }
}

async function refreshCache(req, res, next) {
  try {
    await characterService.refresh(getName(req));
    res.json({ ok: true });
  } catch (e) { next(e); }
}

module.exports = {
  getSummary, getEquipment, getSpec, getArkgrid, getArkpassive, refreshCache,
};
