# ============================================
# providers.tf - AWS 프로바이더 설정
# ============================================
# Django에서 DATABASES 설정하는 것처럼,
# Terraform에게 "AWS를 쓸 거야, 서울 리전이야"를 알려주는 파일

terraform {
  # Terraform 최소 버전
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0" # 5.x 최신 버전 사용
    }
  }
}

provider "aws" {
  region = var.aws_region

  # 모든 리소스에 공통 태그 추가 (비용 추적, 리소스 식별용)
  default_tags {
    tags = {
      Project     = "settleup"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
