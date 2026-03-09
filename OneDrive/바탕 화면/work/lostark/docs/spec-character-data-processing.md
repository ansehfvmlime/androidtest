**기능 명세서: 캐릭터 데이터 가공/정규화**

**목적**
- 외부 API의 다양한 스키마 차이를 흡수하고, 화면 표시/계산에 필요한 형태로 정규화한다.

**공통 규칙**
- 데이터가 없으면 `null` 또는 `0`으로 치환한다.
- HTML 문자열은 제거 후 텍스트로 정리한다.
- 배열/객체 구조는 방어적으로 순회한다.

**요약 데이터 가공 (`getSummary`)**
- 프로필에서 캐릭터명/서버/직업/아이템 레벨/전투력/레벨/길드/칭호/스탯을 추출한다.
- 전투력은 `CombatPower`, `BattlePower`, `TotalPower` 중 존재하는 값을 사용한다.
- 스탯은 `Stats` 배열에서 `치명/특화/신속` 키를 찾는다.
- `updatedAt`을 현재 시간 ISO 문자열로 기록한다.

**장비 데이터 가공 (`getEquipment`)**
- 장비 리스트를 그대로 보관하고 `updatedAt`만 추가한다.

**스펙 데이터 가공 (`getSpec`)**
- 병렬 조회: 프로필, 각인, 보석, 아크패시브, 장비
- 정규화:
  - 각인: 이름/레벨/설명/아이콘/등급/어빌리티스톤 레벨을 정리 후 레벨/이름 기준 정렬
  - 보석: 툴팁을 파싱해 스킬명, 효과 타입(피해/재사용 감소), 효과값을 추출
- 계산:
  - 아크패시브/각인/장비 툴팁에서 치명 확률 증가치 합산
  - 팔찌 툴팁에서 공속/이속 증가치 합산
  - 각인(아드레날린, 질량 증가)의 치명/공속 보정치를 텍스트에서 추출
- `critRateSources`와 `speedSources`에 계산 결과를 기록한다.

**핵심 파서/유틸**
- HTML 제거: `stripHtml`
- 배열 내 키 매칭: `pickStatValue`
- 각인/보석 정규화: `normalizeEngravings`, `normalizeGems`
- 툴팁 텍스트 추출: `parseItemTooltipText`, `parseGemTooltip`
- 치명/공속/이속 수치 추출:
  - `extractCritRateFromText`
  - `extractAtkSpeedPenaltyFromText`
  - `extractSpeedRatesFromText`
- 아크패시브 치명 파싱:
  - `collectArkPassiveEntries`로 후보 추출
  - 키워드 매칭 후 수치 합산

**관련 파일**
- `services/characterService.js`
