**기능 명세서: 캐릭터 검색 및 대시보드 페이지**

**목적**
- 캐릭터명을 입력해 대시보드로 이동하고, 요약/장비/스펙 데이터를 초기 렌더링한다.

**진입 경로**
- `GET /` 홈 페이지
- `GET /c/:name` 대시보드 페이지

**주요 흐름**
1. 홈 페이지에서 캐릭터명을 입력하고 `/c/{name}`로 이동한다.
2. 대시보드 요청 시 서버가 `summary`, `equipment`, `spec`을 병렬로 조회한다.
3. 대시보드가 초기 HTML로 요약/장비/스펙을 렌더링한다.
4. 아크그리드/아크패시브는 탭 클릭 시 AJAX로 로드한다.

**입력**
- 경로 파라미터: `name` (캐릭터명, trim 처리)

**처리 규칙**
- `name`이 비어 있으면 400 응답을 반환한다.
- 초기 렌더링에 필요한 데이터는 서버에서 먼저 가져온다.
- 아크그리드/아크패시브는 초기값 `null`로 렌더링 후, 프런트에서 호출한다.

**출력**
- 홈: 검색 폼과 안내 문구
- 대시보드: 요약 카드, 탭 영역(장비/스펙/아크그리드/아크패시브), 새로고침 버튼

**오류 처리**
- 서비스 조회 실패 시 Express 에러 핸들러로 전달한다.

**관련 파일**
- `routes/page.js`
- `controllers/pageController.js`
- `views/index.ejs`
- `views/dashboard.ejs`
- `views/partials/summary.ejs`
- `views/partials/equipment.ejs`
- `views/partials/spec.ejs`
- `views/partials/arkgrid.ejs`
- `views/partials/arkpassive.ejs`
