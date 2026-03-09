# Task 010 — Crit Calculator UI

## Context

Task 008에서 치명타 계산에 필요한 source를 정규화하였다.

Task 009에서는 해당 source를 기반으로
최종 치명타 적중률을 계산하는 계산 엔진을 구현하였다.

이제 사용자가 실제로 치명타 적중률을 확인할 수 있도록
계산 탭에 UI를 구현한다.

이번 작업의 목적은

- 치명타 계산 입력 UI 제공
- 계산 결과 표시
- source별 breakdown 표시

이다.

---

# Goal

계산 탭에서 다음 기능을 제공하는 UI를 구현한다.

1. 치명 관련 입력값 표시
2. 사용자 입력값 수정
3. 계산 결과 표시
4. source별 breakdown 표시

---

# UI Layout

계산 탭 내부에 다음 구조를 만든다.

```
치명 계산기

[API 기반 값]

치명 스탯
팔찌 치명타
악세서리 치명타
아크그리드 치명타
아크패시브 치명타
펫 치명타

[사용자 입력]

파티 치명 시너지
직업 각인 치명타
기타 치명타

[결과]

최종 치명타 적중률

[Breakdown]

치명 스탯
팔찌
악세서리
아크그리드
아크패시브
펫
파티 시너지
직업 각인
기타
```

---

# Input UI

다음 입력 UI를 제공한다.

## 파티 치명 시너지

select UI

옵션

- 없음
- 1명
- 2명
- 3명

내부 값

- 0
- 1
- 2
- 3

---

## 직업 각인 치명타

number input

예시

```
<input type="number" id="classEngravingCritRate">
```

단위

```
%
```

---

## 기타 치명타

number input

예시

```
<input type="number" id="extraCritRate">
```

단위

```
%
```

---

# API Value Display

다음 값은 **읽기 전용 표시값**이다.

- 치명 스탯
- 팔찌 치명타
- 악세서리 치명타
- 아크그리드 치명타
- 아크패시브 치명타
- 펫 치명타

사용자가 직접 수정하지 않는다.

---

# Result Display

계산 결과 영역

```
최종 치명타 적중률
```

예시

```
82.45 %
```

---

# Breakdown Display

다음 source별 값을 표시한다.

```
치명 스탯
팔찌
악세서리
아크그리드
아크패시브
펫
파티 시너지
직업 각인
기타
```

예시

```
치명 스탯        51.92%
팔찌              3%
악세서리          0%
아크그리드        6%
아크패시브        0%
펫                5%
파티 시너지       20%
직업 각인         6%
기타              0%
```

---

# UI Structure Example

```html
<div class="crit-calculator">
  <h2>치명 계산기</h2>

  <div class="crit-input">
    <label>파티 치명 시너지</label>
    <select id="partySynergy">
      <option value="0">없음</option>
      <option value="1">1명</option>
      <option value="2">2명</option>
      <option value="3">3명</option>
    </select>

    <label>직업 각인 치명타</label>
    <input type="number" id="classEngravingCritRate" />

    <label>기타 치명타</label>
    <input type="number" id="extraCritRate" />
  </div>

  <div class="crit-result">
    <h3>최종 치명타 적중률</h3>
    <div id="totalCritRate"></div>
  </div>

  <div class="crit-breakdown">
    <div id="critBreakdown"></div>
  </div>
</div>
```

---

# Calculation Trigger

다음 이벤트에서 계산을 실행한다.

- 파티 시너지 변경
- 직업 각인 치명타 입력
- 기타 치명타 입력

예시

```js
calculateCritRate(input);
```

---

# Files to Modify

primary

```
views/spec.ejs
```

optional

```
public/js/critCalc.js
public/css/spec.css
```

---

# Non Goal

이번 작업에서는 다음을 수행하지 않는다.

- 음속돌파 계산기
- 뭉툭한 가시 계산기
- 직업별 자동 치명타 적용
- API 구조 변경
- 서버 라우트 변경

---

# Done Criteria

다음 조건을 만족하면 완료로 간주한다.

- 계산 탭에 치명 계산기가 표시된다
- 파티 시너지 select UI가 동작한다
- 직업 각인 치명타 입력이 가능하다
- 기타 치명타 입력이 가능하다
- 최종 치명타 적중률이 표시된다
- breakdown이 표시된다
- 입력 변경 시 계산이 업데이트된다
- 기존 페이지 렌더링이 깨지지 않는다

---

# Constraints

- 전체 파일 재작성 금지
- 기존 한글 텍스트 변경 금지
- minimal diff 우선
- UI 구조는 기존 spec.ejs와 충돌하지 않아야 한다
