**기능 명세서: 캐릭터 데이터 API**

**목적**
- 캐릭터 요약/장비/스펙/아크그리드/아크패시브 데이터를 JSON으로 제공한다.
- 클라이언트에서 탭 전환 시 필요한 데이터를 비동기로 로드한다.

**엔드포인트**
1. `GET /api/characters/:name/summary`
2. `GET /api/characters/:name/equipment`
3. `GET /api/characters/:name/spec`
4. `GET /api/characters/:name/arkgrid`
5. `GET /api/characters/:name/arkpassive`
6. `POST /api/characters/:name/refresh`

**공통 입력**
- 경로 파라미터: `name` (캐릭터명, trim 처리)

**공통 응답**
- 성공: `{ ok: true, data: <payload> }`
- 실패: Express 에러 핸들러에 위임 (상태코드/메시지 반환)

**각 응답 데이터 요약**
- `summary`: 프로필 기반 요약 정보(레벨, 서버, 직업, 전투력, 스탯 등)
- `equipment`: 장비 목록과 `updatedAt`
- `spec`: 스탯/각인/보석 정규화 결과와 계산된 치명/공속 소스
- `arkgrid`: 아크그리드 원본 데이터 + 가용 여부/갱신 시간
- `arkpassive`: 아크패시브 원본 데이터 + 가용 여부/갱신 시간
- `refresh`: 캐시 삭제 후 `{ ok: true }` 반환

**처리 규칙**
- 요청은 서비스 레이어(`characterService`)에 위임한다.
- 각 서비스는 캐시 우선 조회, 미스 시 외부 API 호출 후 캐시에 저장한다.
- `refresh`는 캐시 키를 삭제만 수행한다.

**관련 파일**
- `routes/apiCharacters.js`
- `controllers/characterApiController.js`
- `services/characterService.js`
