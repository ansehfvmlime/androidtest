# Task 001 — Navbar Layout Update

## Context

현재 dashboard 내 네비게이션 구조가
장비 / 스탯 / 아크그리드 / 아크패시브 기준으로 나뉘어 있어
향후 프로젝트 확장 방향과 맞지 않는다.

기능 중심 구조로 재구성하기 위해
기존 nav를 다음 4개 영역으로 변경한다.

- 메인
- 아크그리드
- 원정대
- 계산

이번 작업은 페이지 라우팅 변경이 아니라
dashboard 내부 탭/section 전환 구조를 재정리하는 작업이다.

---

## Goal

dashboard nav를 다음 4개 탭으로 변경한다.

- 메인
  - equipment 영역 표시
  - spec 영역 중 각인 / 보석 관련 내용 표시
  - 메인 탭은 상단 summary, 하단에 equipment와 각인/보석 정보를 세로 순서로 배치한다

- 아크그리드
  - arkpassive 영역 표시
  - arkgrid 영역 표시

- 원정대
  - 이번 작업에서는 placeholder 영역만 생성
  - 추후 API에서 원정대 관련 정보를 받아와 별도 페이지/영역으로 확장 예정

- 계산
  - spec 영역 중 각인 / 보석을 제외한 계산 관련 정보 표시
  - 이번 작업에서는 계산 로직 구현이 아니라 계산용 section 구조만 정리

---

## Interaction Rules

- nav 클릭 시 같은 dashboard 페이지 내에서 section 전환
- 새로운 route 추가는 하지 않음
- 기본 활성 탭은 `메인`
- 활성 탭은 시각적으로 구분되어야 함

---

## Files to Modify

- views/dashboard.ejs
- views/spec.ejs

optional:

- public/css/style.css

---

## Non Goal

- 원정대 실제 데이터 구현
- 계산 로직 구현
- 전투력 계산 구현
- API 구조 변경
- 서버 라우트 추가
- arkgrid / arkpassive 내부 데이터 구조 변경

---

## Done Criteria

- nav에 4개 메뉴가 표시된다
- 기본 활성 탭은 메인이다
- 각 메뉴 클릭 시 같은 페이지 내에서 해당 section만 표시된다
- 메인 탭에서 equipment + 각인/보석 정보가 보인다
- 아크그리드 탭에서 arkpassive + arkgrid가 보인다
- 원정대 탭에서 placeholder가 보인다
- 계산 탭에서 각인/보석 제외 spec 기반 영역이 보인다
- 기존 페이지 렌더링이 깨지지 않는다

---

## Constraints

- 기존 partial 구조를 가능한 유지한다
- 전체 파일 재작성 금지
- 관련 없는 section은 수정하지 않는다
- 기존 한글 텍스트는 가능한 유지한다
