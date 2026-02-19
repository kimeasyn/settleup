# ============================================
# outputs.tf - 생성된 리소스 정보 출력
# ============================================
# terraform apply 완료 후, 또는 terraform output으로
# 필요한 정보를 확인할 수 있습니다.
#
# Django의 print(settings.DATABASES) 같은 것

# --- 접속 URL ---

output "alb_dns_name" {
  description = "ALB DNS (이 URL로 API 접속)"
  value       = "http://${aws_lb.main.dns_name}"
}

output "api_base_url" {
  description = "API Base URL (모바일 앱에서 사용)"
  value       = "http://${aws_lb.main.dns_name}/api/v1"
}

# --- ECR ---

output "ecr_repository_url" {
  description = "ECR 레포지토리 URL (docker push 대상)"
  value       = aws_ecr_repository.app.repository_url
}

output "ecr_login_command" {
  description = "ECR 로그인 명령어"
  value       = "aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${aws_ecr_repository.app.repository_url}"
}

# --- RDS ---

output "rds_endpoint" {
  description = "RDS PostgreSQL 엔드포인트"
  value       = aws_db_instance.postgres.endpoint
}

# --- ECS ---

output "ecs_cluster_name" {
  description = "ECS 클러스터 이름 (CI/CD에서 사용)"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS 서비스 이름 (CI/CD에서 사용)"
  value       = aws_ecs_service.app.name
}

# --- 비용 참고 ---

output "cost_estimate" {
  description = "예상 월 비용 (대략적)"
  value       = <<-EOT
    === 예상 월 비용 ===
    RDS db.t3.micro:       Free Tier (12개월) / 이후 ~$15
    ECS Fargate 0.25vCPU:  ~$9
    ALB:                   ~$16
    ──────────────────
    합계:                  ~$25/월 (Free Tier 적용 시)
    
    ⚠️ 사용하지 않을 때는 terraform destroy!
  EOT
}
