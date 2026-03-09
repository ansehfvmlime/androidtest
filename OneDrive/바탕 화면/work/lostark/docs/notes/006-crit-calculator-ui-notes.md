# 006 — Crit Calculator UI Notes

## 목적
- Task 006(crit-calculator-ui) 진행 중 합의/변경사항을 기록한다.
- 원본 스펙은 유지하고, 본 메모는 변경 이력만 추적한다.

## 변경 요약
- 각인/직업 각인 용어를 명확히 분리했다.

## 합의된 정의
- 각인 치명타 적중률: 메인에서 다루는 아드레날린 계열 각인
- 직업 각인 치명타 적중률: 아크패시브 깨달음 기반 치명타 적중률

## UI 반영 사항
- API 기반 표시: "각인(아드레날린)" 항목 추가
- 사용자 입력: "직업 각인 치명타(깨달음)"로 라벨 정리
- Breakdown: "각인(아드레날린)"과 "기타"를 분리 표시

## 계산 반영 사항
- "각인(아드레날린)"은 API 기반 source로 합산
- "기타"는 수동 입력(extra) 값만 합산
- "직업 각인(깨달음)"은 manual 입력값으로 합산

## 영향 파일
- views/partials/spec.ejs
- public/js/critCalc.js

## 참고
- 원본 스펙: docs/tasks/006-crit-calculator-ui.md
