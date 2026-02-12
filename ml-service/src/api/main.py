"""
SettleUp ML Service
AI 기반 비용 카테고리 분류 서비스
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SettleUp ML Service",
    description="AI 기반 비용 카테고리 분류",
    version="0.0.1"
)


# Request/Response 모델
class CategoryRequest(BaseModel):
    description: str


class Alternative(BaseModel):
    category: str
    confidence: float


class CategoryResponse(BaseModel):
    category: str
    confidence: float
    alternatives: List[Alternative]


# Mock 카테고리 분류기 (Phase 1)
# TODO: Phase 2에서 실제 FastText 모델로 교체
CATEGORY_KEYWORDS = {
    "교통": ["택시", "버스", "지하철", "기차", "비행기", "렌터카", "주차", "톨게이트", "하이패스"],
    "식사": ["식당", "카페", "커피", "밥", "점심", "저녁", "아침", "술", "맥주", "치킨"],
    "숙박": ["호텔", "모텔", "숙소", "에어비앤비", "airbnb", "펜션", "게스트하우스"],
    "쇼핑": ["편의점", "마트", "쇼핑", "옷", "화장품", "기념품", "선물"],
    "엔터테인먼트": ["영화", "공연", "놀이공원", "입장료", "티켓", "노래방", "pc방", "게임"],
}


def classify_mock(description: str) -> CategoryResponse:
    """Mock 분류기: 키워드 기반 간단한 분류"""
    description_lower = description.lower()

    scores = {}
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for keyword in keywords if keyword in description_lower)
        if score > 0:
            scores[category] = score / len(keywords)

    if not scores:
        # 매칭되는 키워드가 없으면 "기타"
        return CategoryResponse(
            category="기타",
            confidence=0.5,
            alternatives=[
                Alternative(category="교통", confidence=0.1),
                Alternative(category="식사", confidence=0.1),
            ]
        )

    # 가장 높은 스코어의 카테고리 선택
    top_category = max(scores, key=scores.get)
    top_confidence = min(0.95, scores[top_category] * 2)  # 최대 0.95

    # 대안 카테고리 생성
    alternatives = [
        Alternative(category=cat, confidence=min(0.95, conf * 2))
        for cat, conf in sorted(scores.items(), key=lambda x: x[1], reverse=True)[1:3]
    ]

    return CategoryResponse(
        category=top_category,
        confidence=top_confidence,
        alternatives=alternatives
    )


@app.get("/")
async def root():
    """서비스 정보"""
    return {
        "service": "SettleUp ML Service",
        "version": "0.0.1",
        "status": "running",
        "model": "mock (Phase 1) - will be replaced with FastText"
    }


@app.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    return {"status": "healthy"}


@app.post("/categorize", response_model=CategoryResponse)
async def categorize_expense(request: CategoryRequest):
    """
    비용 설명을 기반으로 카테고리를 추천합니다.

    Args:
        request: 비용 설명이 포함된 요청

    Returns:
        추천 카테고리, 신뢰도, 대안 카테고리들
    """
    try:
        logger.info(f"Categorizing: {request.description}")

        # Mock 분류기 사용
        result = classify_mock(request.description)

        logger.info(f"Result: {result.category} ({result.confidence:.2f})")
        return result

    except Exception as e:
        logger.error(f"Error during categorization: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
