**기능 명세서: 인메모리 캐시**

**목적**
- 동일 캐릭터 요청에 대해 외부 API 호출을 줄여 응답 속도를 개선한다.

**저장 구조**
- `Map`에 `{ value, expiresAt }` 형태로 저장한다.

**API**
- `set(key, value, ttlMs)`
- `get(key)`:
  - 미존재 또는 만료 시 `null` 반환
  - 만료된 엔트리는 즉시 삭제
- `del(key)`

**TTL**
- `CACHE_TTL_MS` 환경변수 사용
- 기본값: `120000` ms (2분)

**관련 파일**
- `services/cache.js`
- `services/characterService.js`
