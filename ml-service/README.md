# SettleUp ML Service

AI 기반 비용 카테고리 분류 서비스

## 기능

- 비용 설명 텍스트를 입력받아 자동으로 카테고리 추천
- 신뢰도 점수와 대안 카테고리 제공

## 개발 환경 설정

```bash
# 가상환경 생성
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
cd src
uvicorn api.main:app --reload --port 8000
```

## API 사용법

### 카테고리 분류

```bash
curl -X POST http://localhost:8000/categorize \
  -H "Content-Type: application/json" \
  -d '{"description": "택시 요금"}'
```

응답:
```json
{
  "category": "교통",
  "confidence": 0.85,
  "alternatives": [
    {"category": "식사", "confidence": 0.15},
    {"category": "기타", "confidence": 0.10}
  ]
}
```

## Phase 1 vs Phase 2

- **Phase 1 (현재)**: 키워드 기반 Mock 분류기
- **Phase 2 (향후)**: FastText 기반 실제 ML 모델
