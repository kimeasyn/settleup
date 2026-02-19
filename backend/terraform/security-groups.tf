# ============================================
# security-groups.tf - 보안 그룹
# ============================================
# 보안 그룹 = 리소스별 방화벽
#
# Django에서 ALLOWED_HOSTS로 접근을 제한하듯,
# 보안 그룹으로 네트워크 레벨에서 접근을 제한합니다.
#
# 핵심 원칙: "필요한 포트만, 필요한 소스에서만 허용"
#
# 트래픽 흐름:
#   인터넷 →(80/443)→ ALB →(8080)→ ECS →(5432)→ RDS
#                                      →(6379)→ Redis

# -----------------------------------------------
# ALB 보안 그룹
# -----------------------------------------------
# 인터넷에서 HTTP/HTTPS 트래픽만 허용
resource "aws_security_group" "alb" {
  name        = "${var.app_name}-alb-sg"
  description = "ALB - Allow HTTP/HTTPS from internet"
  vpc_id      = aws_vpc.main.id

  # 인바운드: 인터넷에서 80, 443 허용
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # 전체 인터넷
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # 아웃바운드: 모든 트래픽 허용 (ECS로 포워딩 필요)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1" # 모든 프로토콜
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-alb-sg"
  }
}

# -----------------------------------------------
# ECS 보안 그룹
# -----------------------------------------------
# ALB에서 오는 8080 트래픽만 허용
resource "aws_security_group" "ecs" {
  name        = "${var.app_name}-ecs-sg"
  description = "ECS - Allow traffic from ALB only"
  vpc_id      = aws_vpc.main.id

  # 인바운드: ALB 보안 그룹에서 8080만 허용
  # ↓ cidr_blocks 대신 security_groups를 쓰면
  #   "이 보안 그룹에 속한 리소스에서만" 이라는 뜻
  ingress {
    description     = "Spring Boot from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id] # ALB SG에서만!
  }

  # 아웃바운드: 모든 트래픽 허용
  # (RDS, Redis 접근 + ECR 이미지 pull + 외부 API 호출)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-ecs-sg"
  }
}

# -----------------------------------------------
# RDS 보안 그룹
# -----------------------------------------------
# ECS에서 오는 5432(PostgreSQL) 트래픽만 허용
resource "aws_security_group" "rds" {
  name        = "${var.app_name}-rds-sg"
  description = "RDS - Allow PostgreSQL from ECS only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "PostgreSQL from ECS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id] # ECS SG에서만!
  }

  # RDS는 아웃바운드 불필요 (요청을 받기만 함)
  # 하지만 응답을 보내려면 egress가 필요
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-rds-sg"
  }
}


