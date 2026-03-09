# Task 009 — Crit Rate Calculator

## Context

Task 008에서 치명타 적중률 계산에 필요한 source를 API 기반 값과 사용자 입력 값으로 정규화하였다.

이제 이 normalized input을 사용하여 최종 치명타 적중률을 계산하는 로직을 구현한다.

이번 작업의 목적은 치명타 관련 source를 합산하여 최종 치명타 적중률과 source별 breakdown을 계산할 수 있는 계산 엔진을 만드는 것이다.

---

## Goal

Task 008에서 정의한 `critCalculatorInput` 구조를 기반으로 최종 치명타 적중률을 계산하는 로직을 구현한다.

계산 결과는 다음을 포함해야 한다.

- 최종 치명타 적중률
- source별 breakdown

---

## Input Shape

계산기는 다음 입력 구조를 사용한다.

```js
const critCalculatorInput = {
  api: {
    critStat: 0,
    critStatRate: 0,
    braceletCritRate: 0,
    accessoryCritRate: 0,
    arkGridCritRate: 0,
    arkPassiveCritRate: 0,
    petCritRate: 0,
  },
  manual: {
    partySynergyLevel: 0,
    partySynergyCritRate: 0,
    classEngravingCritRate: 0,
    extraCritRate: 0,
  },
};
```

---

## Output Shape

```js
const critCalculatorBreakdown = {
  critStatRate: 0,
  braceletCritRate: 0,
  accessoryCritRate: 0,
  arkGridCritRate: 0,
  arkPassiveCritRate: 0,
  petCritRate: 0,
  partySynergyCritRate: 0,
  classEngravingCritRate: 0,
  extraCritRate: 0,
};

const critCalculatorResult = {
  totalCritRate: 0,
  breakdown: critCalculatorBreakdown,
};
```

---

## Calculation Rules

### Rule 1 — 최종 치명타 적중률은 모든 source 합산값이다

최종 치명타 적중률은 다음 source를 합산한다.

- critStatRate
- braceletCritRate
- accessoryCritRate
- arkGridCritRate
- arkPassiveCritRate
- petCritRate
- partySynergyCritRate
- classEngravingCritRate
- extraCritRate

---

### Rule 2 — critStat는 직접 합산하지 않고 critStatRate를 사용한다

치명 스탯 원본값은 입력으로 보관하되 최종 계산에는 치명 스탯으로부터 환산된 `critStatRate`를 사용한다.

즉

- `critStat`는 원본 보관용
- `critStatRate`는 실제 계산용

---

### Rule 3 — partySynergyLevel은 partySynergyCritRate로 환산 후 사용한다

사용자가 선택한 파티 시너지 레벨은 다음 매핑 규칙으로 환산한다.

```js
const partySynergyCritRateMap = {
  0: 0,
  1: 10,
  2: 20,
  3: 30,
};
```

계산 시에는 `partySynergyLevel`이 아니라 환산된 `partySynergyCritRate`를 사용한다.

---

### Rule 4 — 누락 값은 0으로 계산한다

입력 source가 없거나 `undefined` 또는 `null`인 경우 계산 로직에서는 0으로 처리한다.

---

### Rule 5 — breakdown은 계산에 사용된 실제 값을 그대로 보여준다

예를 들어

- `partySynergyLevel = 2`라면
- breakdown에는 `partySynergyCritRate = 20`이 들어가야 한다

즉 breakdown은 최종 계산에 실제 사용된 값 기준으로 구성한다.

---

## Example Breakdown Logic

```js
function calculateCritRate(input) {
  const partySynergyCritRateMap = {
    0: 0,
    1: 10,
    2: 20,
    3: 30,
  };

  const partyLevel = input?.manual?.partySynergyLevel ?? 0;

  const breakdown = {
    critStatRate: input?.api?.critStatRate ?? 0,
    braceletCritRate: input?.api?.braceletCritRate ?? 0,
    accessoryCritRate: input?.api?.accessoryCritRate ?? 0,
    arkGridCritRate: input?.api?.arkGridCritRate ?? 0,
    arkPassiveCritRate: input?.api?.arkPassiveCritRate ?? 0,
    petCritRate: input?.api?.petCritRate ?? 0,
    partySynergyCritRate: partySynergyCritRateMap[partyLevel] ?? 0,
    classEngravingCritRate: input?.manual?.classEngravingCritRate ?? 0,
    extraCritRate: input?.manual?.extraCritRate ?? 0,
  };

  const totalCritRate =
    breakdown.critStatRate +
    breakdown.braceletCritRate +
    breakdown.accessoryCritRate +
    breakdown.arkGridCritRate +
    breakdown.arkPassiveCritRate +
    breakdown.petCritRate +
    breakdown.partySynergyCritRate +
    breakdown.classEngravingCritRate +
    breakdown.extraCritRate;

  return {
    totalCritRate,
    breakdown,
  };
}
```

---

## Files to Modify

primary

- `public/js/critCalc.js`

optional

- `services/characterService.js`
- `views/spec.ejs`
- `services/parsers/*`

이번 단계에서는 계산 엔진을 우선 구현하고 UI 연결은 최소화한다.

---

## Data Assumptions

다음 값은 이미 normalization 이후 입력으로 들어온다고 가정한다.

- critStatRate
- braceletCritRate
- accessoryCritRate
- arkGridCritRate
- arkPassiveCritRate
- petCritRate
- partySynergyLevel
- classEngravingCritRate
- extraCritRate

만약 일부 값이 아직 파싱되지 않았다면 0 기본값으로 계산할 수 있어야 한다.

---

## Null-safe Rules

다음 조건을 만족해야 한다.

- input.api가 없더라도 계산기가 깨지지 않는다
- input.manual이 없더라도 계산기가 깨지지 않는다
- 각 source 누락 시 0으로 처리한다
- 최종 totalCritRate 계산에서 NaN이 발생하지 않아야 한다

---

## Non Goal

이번 작업에서는 다음을 수행하지 않는다.

- 음속돌파 효율 계산
- 뭉툭한 가시 계산
- 직업별 프리셋 자동 적용
- 계산기 UI 완성
- API 구조 변경
- 서버 라우트 추가

---

## Done Criteria

다음 조건을 만족하면 완료로 간주한다.

- critCalculatorInput을 기반으로 계산 함수가 구현된다
- partySynergyLevel이 partySynergyCritRate로 환산된다
- 최종 totalCritRate가 계산된다
- source별 breakdown이 반환된다
- 누락 값이 있어도 0으로 안전하게 계산된다
- NaN 없이 계산된다
- 이후 UI에서 바로 사용할 수 있는 결과 구조가 반환된다

---

## Constraints

- 전체 파일 재작성 금지
- 기존 한글 텍스트 변경 금지
- 관련 없는 UI 수정 금지
- minimal diff 우선
- 계산 엔진 구현이 UI 작업보다 우선한다

---

## Suggested Implementation Order

1. 현재 `critCalc.js` 구조 확인
2. `partySynergyLevel → partySynergyCritRate` 매핑 추가
3. breakdown 객체 생성
4. totalCritRate 계산
5. 누락 값 0 처리
6. 결과 객체 반환 구조 정리
7. 간단한 테스트 입력으로 동작 확인
