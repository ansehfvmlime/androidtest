const characterService = require('../services/characterService');

function renderHome(req, res) {
  res.render('index', { siteName: 'My LOA Dashboard' });
}

async function renderDashboard(req, res, next) {
  try {
    const name = (req.params.name || '').trim();
    if (!name) return res.status(400).send('캐릭터명이 필요합니다.');

    // ✅ 초기 렌더: summary + equipment + spec (체감 좋은 3개)
    const [summary, equipment, spec] = await Promise.all([
      characterService.getSummary(name),
      characterService.getEquipment(name),
      characterService.getSpec(name),
    ]);

    res.render('dashboard', {
      siteName: 'My LOA Dashboard',
      name,
      summary,
      equipment,
      spec,
      // 나머지 탭은 클릭 시 AJAX로 로드
      arkgrid: null,
      arkpassive: null,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { renderHome, renderDashboard };
