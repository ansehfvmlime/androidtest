**기능 명세서: Lost Ark Open API 연동**

**목적**
- 로스트아크 Open API로부터 캐릭터 관련 데이터를 조회한다.

**환경 변수**
- `LOSTARK_JWT`: API 인증 토큰 (필수)
- `LOSTARK_BASE`: API 베이스 URL (선택, 기본값 `https://developer-lostark.game.onstove.com`)

**요청 방식**
- HTTP `GET`
- 헤더:
  - `accept: application/json`
  - `authorization: bearer {LOSTARK_JWT}`

**지원 API**
- 프로필: `/armories/characters/{name}/profiles`
- 장비: `/armories/characters/{name}/equipment`
- 각인: `/armories/characters/{name}/engravings`
- 보석: `/armories/characters/{name}/gems`
- 아크패시브: `/armories/characters/{name}/arkpassive`
- 아크그리드: `/armories/characters/{name}/arkgrid`

**오류 처리**
- `LOSTARK_JWT`가 없으면 앱 시작 시 에러를 던진다.
- 비정상 응답(`!res.ok`)이면 상태코드와 본문을 포함한 에러를 던진다.

**관련 파일**
- `services/lostarkApi.js`
