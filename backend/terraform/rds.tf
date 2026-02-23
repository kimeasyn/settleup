# ============================================
# rds.tf - PostgreSQL 데이터베이스
# ============================================
# RDS = AWS의 관리형 DB 서비스
# 직접 EC2에 PostgreSQL 설치하는 것 대비:
#   - 자동 백업, 패치, 모니터링
#   - Multi-AZ 장애 조치 (프로덕션용)
#   - 스냅샷으로 복원
#
# Free Tier: db.t3.micro, 20GB, 12개월 무료

# -----------------------------------------------
# DB Subnet Group
# -----------------------------------------------
# RDS가 어떤 서브넷에 배치될지 지정
# 최소 2개 AZ의 서브넷 필요 (AWS 규칙)
resource "aws_db_subnet_group" "main" {
  name = "${var.app_name}-db-subnet"
  subnet_ids = var.rds_publicly_accessible ? [
    aws_subnet.public_a.id,
    aws_subnet.public_b.id,
  ] : [
    aws_subnet.private_a.id,
    aws_subnet.private_b.id,
  ]

  tags = {
    Name = "${var.app_name}-db-subnet"
  }
}

# -----------------------------------------------
# RDS PostgreSQL Instance
# -----------------------------------------------
resource "aws_db_instance" "postgres" {
  identifier = "${var.app_name}-db"

  # 엔진 설정
  engine         = "postgres"
  engine_version = "15"

  # 인스턴스 크기 (Free Tier)
  instance_class = "db.t3.micro" # 1 vCPU, 1GB RAM, Free Tier

  # 스토리지
  allocated_storage     = 20  # GB, Free Tier 최대
  max_allocated_storage = 20  # 자동 확장 비활성화 (비용 통제)
  storage_type          = "gp2"

  # 데이터베이스 설정
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = 5432

  # 네트워크
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  # Public 접근 설정 (로컬 IDE 접속 시 true로 변경)
  publicly_accessible = var.rds_publicly_accessible

  # 백업 설정
  backup_retention_period = 7           # 7일간 자동 백업 보관
  backup_window           = "03:00-04:00" # UTC 03시 = KST 12시 (새벽)

  # 유지보수 윈도우
  maintenance_window = "Mon:04:00-Mon:05:00" # 백업 후 유지보수

  # Multi-AZ (Free Tier에서는 비활성화, 활성화하면 비용 2배)
  multi_az = false

  # 마이너 버전 자동 업그레이드
  auto_minor_version_upgrade = true

  # 삭제 보호 (실수 방지, terraform destroy 시에는 먼저 false로 변경 필요)
  deletion_protection = false # 학습용이므로 false, 프로덕션에서는 true

  # terraform destroy 시 최종 스냅샷 건너뛰기
  skip_final_snapshot = true # 학습용, 프로덕션에서는 false

  # Flyway 마이그레이션 적용을 위해 파라미터 그룹 설정
  parameter_group_name = aws_db_parameter_group.postgres.name

  tags = {
    Name = "${var.app_name}-db"
  }
}

# -----------------------------------------------
# DB Parameter Group
# -----------------------------------------------
# PostgreSQL 설정 커스터마이징 (postgresql.conf에 해당)
resource "aws_db_parameter_group" "postgres" {
  family = "postgres15"
  name   = "${var.app_name}-pg15-params"

  # 한국어 정렬 및 로깅 설정
  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # 1초 이상 걸리는 쿼리 로깅 (슬로우 쿼리 감지)
  }

  parameter {
    name  = "timezone"
    value = "Asia/Seoul"
  }

  tags = {
    Name = "${var.app_name}-pg15-params"
  }
}
