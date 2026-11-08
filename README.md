# 예스부동산 영등포구 아파트 대시보드

공인중개사 고객 브리핑을 위한 영등포구 아파트 시장 대시보드입니다.

## 주요 기능

- 영등포구 동별·주간·월간 기간 조회
- 매매·전세·월세 TOP 10과 OpenStreetMap 위치 표시
- 국토교통부 아파트 실거래가 API 서버 연동
- 지도 핀 선택 시 회오리 애니메이션과 단지 상세·입지분석 표시
- 추천매물 4개, 시장지표·거래량·전세가율 요약
- 반응형 화면과 배포용 대표 이미지

## 프로젝트 구조

- `public/index.html`: 대시보드 화면
- `worker/index.js`: 공공데이터 API를 호출하는 서버 프록시
- `assets/yeongdeungpo-hero.png`: 배포 대표 이미지
- `scripts/build.mjs`: 배포 번들 생성
- `scripts/validate.mjs`: 기본 검증

## 환경 변수

실제 키는 GitHub에 올리지 않습니다. 배포 환경의 비밀 변수로만 설정하세요.

```text
PUBLIC_DATA_API_KEY=...
REB_API_KEY=...
```

자세한 변수 이름은 `.env.example`을 참고하세요.

## 고객용 배포 주소

https://hongbh7-bm.github.io/PROPERTY/

GitHub Pages 화면은 별도 서버의 `/api/market`을 호출합니다. 공공데이터 API 키는 서버 비밀 변수에만 저장되며 브라우저와 GitHub 소스에는 포함되지 않습니다.

> 실거래 자료는 신고·정정 시점에 따라 달라질 수 있으므로 고객 브리핑 전 원문을 최종 확인하세요.
