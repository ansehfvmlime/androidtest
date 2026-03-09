# Task 008 — Crit Source Normalization

## Context

계산 탭에서 최종 치명타 적중률을 계산할 수 있는 기능을 만들고자 한다.

이 계산기는 API에서 가져온 치명 관련 정보와
사용자가 직접 선택 또는 입력한 값을 합산하여
최종 치명타 적중률을 계산하는 기능의 기반이 된다.

이번 작업의 목적은
최종 치명타 계산 로직 자체를 완성하는 것이 아니라
치명 관련 source를 정규화하고
내부 입력 구조를 정의하는 것이다.

---

# Goal

치명타 적중률 계산에 필요한 source를
API 기반 값과 사용자 입력 값으로 분리하여
일관된 내부 데이터 구조를 만든다.

정규화 대상은 다음과 같다.

### API 기반 source

- 치명 스탯
- 팔찌 치명타 적중률
- 악세서리 치명타 적중률
- 아크그리드 치명타 적중률
- 아크패시브 치명타 적중률
- 펫 치명타 적중률

### 사용자 입력 source

- 파티 치명타 적중률 시너지
- 직업 각인 치명타 적중률
- 기타 치명타 적중률

---

# Scope

이번 작업에서 다루는 범위는 다음과 같다.

- 치명 관련 source 목록 정의
- source별 내부 key 정의
- API 기반 값과 사용자 입력값 분리
- 치명 스탯과 치명 적중률 환산값 분리 구조 정의
- 이후 계산 로직에서 사용할 수 있는 normalized input shape 정의

---

# Source Definition

## API 기반 source

### 1. 치명 스탯

- 원본 치명 스탯 값
- 치명 스탯으로부터 환산된 치명타 적중률

예시

- critStat = 1450
- critStatRate = 51.92

---

### 2. 팔찌 치명타 적중률

- 팔찌 효과로 증가하는 치명타 적중률

---

### 3. 악세서리 치명타 적중률

- 악세서리 옵션 또는 효과로 증가하는 치명타 적중률

---

### 4. 아크그리드 치명타 적중률

- 아크그리드 효과로 증가하는 치명타 적중률

---

### 5. 아크패시브 치명타 적중률

- 아크패시브 효과로 증가하는 치명타 적중률

---

### 6. 펫 치명타 적중률

- 펫 효과로 증가하는 치명타 적중률

---

## 사용자 입력 source

### 1. 파티 치명타 시너지

사용자는 다음 중 하나를 선택할 수 있다.

- 없음
- 1명
- 2명
- 3명

내부 계산 기준

- 없음 = 0%
- 1명 = 10%
- 2명 = 20%
- 3명 = 30%

---

### 2. 직업 각인 치명타 적중률

- 숫자 직접 입력
- 향후 직업별 프리셋 확장을 고려한다
- 이번 단계에서는 수동 입력만 지원한다

---

### 3. 기타 치명타 적중률

- 직업 스킬, 버프, 특정 상황에서 발생하는 추가 치명타 적중률
- 숫자 직접 입력
- 이번 단계에서는 수동 입력만 지원한다

---

# Internal Data Shape

치명 계산기 입력 구조는 다음과 같이 정의한다.

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

### Breakdown Shape

- 최종 계산 결과는 source별 breakdown이 가능해야 한다

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
```

### Result Shape

```js
const critCalculatorResult = {
  totalCritRate: 0,
  breakdown: critCalculatorBreakdown,
};
```

### Normalization Rules

### Rule 1 — 치명 스탯과 치명타 적중률을 분리한다

- 치명 스탯 원본과 치명 스탯으로부터 환산된 치명타 적중률은 서로 다른 값으로 관리한다.

- 예시:
- critStat = 1450
- critStatRate = 51.92

### Rule 2 — source별 값을 합산 전에 분리 보관한다

- 팔찌, 악세서리, 아크그리드, 아크패시브, 펫, 각인, 파티 시너지, 직업 각인 치명타 적중률, 기타 치명타 적중률ㅂ

### Rule 3 — 파티 시너지 level과 실제 값은 분리한다

- 예시
- partySynergyLevel = 2
- partySynergyCritRate = 20

- 이 구조를 사용하면 UI와 계산 로직을 분리할 수 있다.

### Rule 4 — 사용자 입력값은 manual 영역에만 저장한다

- 파티 시너지, 직업 각인 치명타 적중률, 기타 치명타 적중률

### Mapping Rules

- 파티 시너지 level은 다음 기준으로 환산한다.

```js
const partySynergyCritRateMap = {
  0: 0,
  1: 10,
  2: 20,
  3: 30,
};
```

### Files to Modify

- primary
  - services/characterService.js

- optional
  - services/parsers/\*
  - public/js/critCalc.js
  - views/spec.ejs

- 이번 단계에서는 실제 UI보다 source 정리와 내부 구조 정의를 우선한다.

### Data Assumptions

- 다음 정보는 API 또는 기존 서비스 로직에서 접근 가능하다고 가정한다.

- 치명 스탯
- 팔찌 관련 정보
- 악세서리 관련 정보
- 아크그리드 관련 정보
- 아크패시브 관련 정보
- 펫 효과
- 각인 정보

- 만약 일부 값이 현재 직접 파싱되지 않는다면 이번 단계에서는 placeholder 또는 0 기본값을 허용한다.

### Null-safe Rules

- 다음 값은 없을 수 있다.

- 팔찌 치명타 적중률
- 악세서리 치명타 적중률
- 아크그리드 치명타 적중률
- 아크패시브 치명타 적중률
- 펫 치명 관련 수치
- 각인 치명타 적중률

- 처리 규칙:

- 값이 없으면 0으로 정규화
- 계산기 전체가 깨지지 않아야 한다
- source 누락은 null 대신 0을 기본값으로 사용한다

### Non Goal

- 이번 작업에서는 다음 작업을 수행하지 않는다.

- 최종 치명타 적중률 계산 로직 완성
- 음속돌파 효율 계산
- 뭉툭한 가시 계산
- 직업별 자체 시너지 프리셋 구현
- 계산기 UI 완성
- API 구조 변경
- 서버 라우트 추가

### Done Criteria

- 다음 조건을 만족하면 완료로 간주한다.

- 치명 관련 source가 API / manual로 구분된다
- 치명 스탯과 치명타 적중률 환산값이 분리된다
- 각인 치명타 적중률 source가 포함된다
- 파티 시너지 level과 실제 치명타율 값이 분리된다
- 자체 시너지가 manual 입력 값으로 정의된다
- 이후 계산기 로직에서 재사용 가능한 내부 데이터 구조가 정리된다
- source 누락 시 0 기본값으로 안전하게 정규화된다

### Constraints

- 전체 파일 재작성 금지
- 기존 한글 텍스트 변경 금지
- 관련 없는 UI 수정 금지
- minimal diff 우선
- 이번 단계에서는 source normalization이 계산 로직보다 우선한다

### Suggested Implementation Order

- 현재 코드에서 치명 관련 source가 어디서 오는지 확인
- source별 key를 정리
- API 기반 값 / manual 값 구조 분리
- 치명 스탯과 환산 치명타율 분리
- party synergy mapping 구조 추가
- source 누락 시 0 기본값 처리
- 이후 계산기 로직에서 사용할 수 있도록 반환 구조 정리
