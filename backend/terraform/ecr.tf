# ============================================
# ecr.tf - Docker 이미지 저장소
# ============================================
# ECR = AWS의 Docker Hub
# Docker 이미지를 빌드하면 여기에 push하고,
# ECS가 여기서 이미지를 pull해서 컨테이너를 실행합니다.
#
# Docker Hub와의 차이:
#   Docker Hub: 공개 저장소 (누구나 pull 가능)
#   ECR: 프라이빗 저장소 (IAM 인증 필요)

resource "aws_ecr_repository" "app" {
  name = "${var.app_name}-backend"

  # 같은 태그로 push하면 덮어쓰기 허용
  # (latest 태그를 계속 업데이트할 때 필요)
  image_tag_mutability = "MUTABLE"

  # 이미지 push 시 자동 취약점 스캔
  image_scanning_configuration {
    scan_on_push = true
  }

  # terraform destroy 시 이미지가 있어도 삭제 허용
  force_delete = true

  tags = {
    Name = "${var.app_name}-backend"
  }
}

# -----------------------------------------------
# 이미지 수명 정책 (비용 절약)
# -----------------------------------------------
# 오래된 이미지를 자동 삭제. 안 하면 이미지가 계속 쌓여서 스토리지 비용 발생
resource "aws_ecr_lifecycle_policy" "app" {
  repository = aws_ecr_repository.app.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "최근 5개 이미지만 유지"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 5
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
