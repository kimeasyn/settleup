# ============================================
# variables.tf - 변수 정의
# ============================================
# Django의 settings.py에서 변수를 정의하는 것과 같습니다.
# 실제 값은 terraform.tfvars에서 설정합니다.
#
# variable "이름" {
#   type        = 타입
#   description = 설명
#   default     = 기본값 (없으면 terraform apply 시 입력 필요)
# }

# --- 공통 ---

variable "aws_region" {
  description = "AWS 리전"
  type        = string
  default     = "ap-northeast-2" # 서울
}

variable "environment" {
  description = "환경 (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "app_name" {
  description = "애플리케이션 이름 (리소스 네이밍에 사용)"
  type        = string
  default     = "settleup"
}

# --- 네트워크 ---

variable "vpc_cidr" {
  description = "VPC CIDR 블록 (전체 네트워크 범위)"
  type        = string
  default     = "10.0.0.0/16" # 10.0.0.0 ~ 10.0.255.255 (65,536개 IP)
}

# --- RDS (PostgreSQL) ---

variable "db_name" {
  description = "데이터베이스 이름"
  type        = string
  default     = "settleup"
}

variable "db_username" {
  description = "데이터베이스 마스터 유저명"
  type        = string
  default     = "settleup_admin"
}

variable "db_password" {
  description = "데이터베이스 마스터 비밀번호 (16자 이상 권장)"
  type        = string
  sensitive   = true # terraform plan 출력에서 마스킹됨
}

# --- JWT ---

variable "jwt_secret" {
  description = "JWT 서명 키 (32자 이상)"
  type        = string
  sensitive   = true
}

# --- OAuth ---

variable "google_client_id_ios" {
  description = "Google OAuth Client ID (iOS)"
  type        = string
}

variable "google_client_id_android" {
  description = "Google OAuth Client ID (Android)"
  type        = string
}

variable "kakao_native_app_key" {
  description = "Kakao Native App Key"
  type        = string
  sensitive   = true
}

# --- ECS ---

variable "ecs_cpu" {
  description = "ECS 태스크 CPU (256 = 0.25 vCPU)"
  type        = number
  default     = 256 # 최소 비용: 0.25 vCPU
}

variable "ecs_memory" {
  description = "ECS 태스크 메모리 (MB)"
  type        = number
  default     = 512 # 0.25 vCPU일 때 최소 512MB
}

variable "ecs_desired_count" {
  description = "실행할 태스크 수"
  type        = number
  default     = 1 # 비용 절약: 1개만
}

# --- 도메인 (선택사항) ---

variable "domain_name" {
  description = "도메인 이름 (없으면 ALB DNS 사용)"
  type        = string
  default     = "" # 비워두면 ALB DNS로 접속
}
