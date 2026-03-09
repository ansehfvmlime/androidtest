# Task 003 — Main Grid Layout

## Context

현재 dashboard 메인 영역의 레이아웃은
향후 확장과 카드 기반 UI 구조를 고려한 설계가 되어 있지 않다.

Task 002에서 정의한 summary 영역 이후의 메인 컨텐츠 구조를 기준으로
dashboard 메인 영역을 CSS Grid 기반의 카드 레이아웃으로 재구성한다.

이번 작업의 목적은
데이터 로직 변경이 아니라
메인 컨텐츠의 layout / card structure를 정리하는 것이다.

---

# Goal

summary 아래 메인 영역을
3 column grid 기반의 card layout으로 재구성한다.

---

# Layout Structure

메인 영역은 **3 column grid 구조**를 따른다.

### Row 1

- 보석 카드 (full width)

### Row 2

- 전투력 + 특성 카드
- 무기 / 방어구 카드
- 악세서리 / 스톤 카드

### Row 3

- 각인 카드 (full width)

예시 구조
┌─────────────────────────────┐
│ 보석 │
├──────────┬──────────┬───────┤
│ 전투력+특성 │ 무기/방어구 │ 악세/스톤 │
├─────────────────────────────┤
│ 각인 │
└─────────────────────────────┘

각 영역은 독립적인 **card UI** 형태로 표시한다.

---

# Card Roles

### 보석 카드

표시 정보

- 보석 리스트
- 보석 레벨

보석 카드는 **상단 full width 카드**로 표시한다.

---

### 전투력 + 특성 카드

표시 정보

- 전투력
- 치명
- 특화
- 신속

전투력과 특성은 하나의 카드로 묶는다.

---

### 무기 / 방어구 카드

표시 정보

- 무기
- 방어구

---

### 악세서리 / 스톤 카드

표시 정보

- 목걸이
- 귀걸이
- 반지
- 어빌리티 스톤

---

### 각인 카드

표시 정보

- 각인 목록
- 각인 레벨

각인 카드는 **하단 full width 카드**로 표시한다.

---

# Interaction Rules

- 새로운 route 추가는 하지 않는다
- 같은 dashboard 페이지 내 section 구조만 수정한다
- 기존 데이터 source는 유지한다

---

# Files to Modify

primary

- views/dashboard.ejs

optional

- public/css/style.css
- views/partials/summary.ejs

서비스 로직 수정은 필요한 경우에만 수행한다.

---

# Layout Rules

- CSS Grid 기반 layout 사용
- 카드 UI 구조 사용
- 카드 간 간격(gap)을 유지
- 기존 UI 스타일과 충돌하지 않도록 최소 변경

---

# Responsive Rules

### Desktop

- 3 column grid 유지

### Tablet

- 상황에 따라 2 column으로 전환 가능

### Mobile

- 1 column stack 구조

모바일 순서

1. 보석
2. 전투력 + 특성
3. 무기 / 방어구
4. 악세서리 / 스톤
5. 각인

---

# Data Assumptions

다음 데이터는 이미 존재한다고 가정한다.

- 전투력
- 치명 / 특화 / 신속
- 보석 정보
- 장비 정보
- 악세서리 / 스톤 정보
- 각인 정보

이번 작업에서는
데이터 구조를 새로 설계하지 않는다.

---

# Non Goal

이번 작업에서는 다음을 수행하지 않는다.

- 전투력 계산식 구현
- 계산 기능 구현
- 원정대 기능 구현
- API 구조 변경
- 서버 라우트 추가
- 장비 데이터 로직 변경
- 각인 데이터 로직 변경

---

# Done Criteria

다음 조건을 만족하면 완료로 간주한다.

- 메인 영역이 3 column grid 구조로 재구성된다
- 보석 카드가 상단 full width로 표시된다
- 전투력과 특성이 하나의 카드로 표시된다
- 무기/방어구 카드와 악세서리/스톤 카드가 분리된다
- 각인 카드가 하단 full width로 표시된다
- 모바일 화면에서 레이아웃이 심하게 깨지지 않는다
- 기존 페이지 렌더링이 깨지지 않는다
- summary 및 nav와 구조 충돌이 없다

---

# Constraints

- 전체 파일 재작성 금지
- 기존 한글 텍스트 변경 금지
- 관련 없는 partial 수정 금지
- minimal diff 우선

---

# Revision Note

기존 2 column 레이아웃에서
3 column 구조로 변경하였다.

또한 보석 카드를 상단 full width 카드로 이동하였다.
