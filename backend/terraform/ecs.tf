# ============================================
# ecs.tf - ECS Fargate (컨테이너 실행 환경)
# ============================================
# ECS = AWS의 컨테이너 오케스트레이션 서비스
# Kubernetes와 비슷한 역할이지만 훨씬 간단함
#
# 핵심 개념 (k8s와 비교):
#   ECS Cluster     = k8s Cluster
#   Task Definition = k8s Pod spec (컨테이너 설정서)
#   Service         = k8s Deployment (원하는 개수만큼 태스크 유지)
#   Task            = k8s Pod (실행 중인 컨테이너)
#
# Fargate = 서버리스 컨테이너
#   EC2 방식: 서버를 직접 관리 (OS 패치, 스케일링...)
#   Fargate:  컨테이너만 정의하면 AWS가 서버 관리

# -----------------------------------------------
# ECS Cluster
# -----------------------------------------------
resource "aws_ecs_cluster" "main" {
  name = "${var.app_name}-cluster"

  # CloudWatch Container Insights (모니터링)
  setting {
    name  = "containerInsights"
    value = "disabled" # 비용 절약, 필요 시 "enabled"
  }

  tags = {
    Name = "${var.app_name}-cluster"
  }
}

# -----------------------------------------------
# IAM Role - ECS Task Execution Role
# -----------------------------------------------
# ECS가 "컨테이너를 실행하기 위해" 필요한 권한
# (ECR에서 이미지 pull, CloudWatch에 로그 전송 등)
# → k8s의 ServiceAccount와 비슷

resource "aws_iam_role" "ecs_execution" {
  name = "${var.app_name}-ecs-execution-role"

  # "ECS 태스크가 이 역할을 사용할 수 있다"는 신뢰 정책
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

# AWS 관리형 정책 연결 (ECR pull + CloudWatch 로그)
resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# -----------------------------------------------
# IAM Role - ECS Task Role
# -----------------------------------------------
# 컨테이너 "안에서 실행되는 앱"이 AWS 서비스를 호출할 때 필요한 권한
# (지금은 특별히 필요 없지만, 나중에 S3 접근 등에 사용)
resource "aws_iam_role" "ecs_task" {
  name = "${var.app_name}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

# -----------------------------------------------
# CloudWatch Log Group
# -----------------------------------------------
# 컨테이너의 stdout/stderr가 여기에 저장됨
# Django의 logging → 파일 대신 CloudWatch로 보내는 것
resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${var.app_name}"
  retention_in_days = 14 # 14일 보관 후 자동 삭제 (비용 절약)

  tags = {
    Name = "${var.app_name}-logs"
  }
}

# -----------------------------------------------
# Task Definition (컨테이너 설정서)
# -----------------------------------------------
# "이 이미지를, 이 CPU/메모리로, 이 환경변수와 함께 실행해라"
resource "aws_ecs_task_definition" "app" {
  family                   = "${var.app_name}-task"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc" # Fargate는 awsvpc 필수

  cpu    = var.ecs_cpu    # 256 = 0.25 vCPU
  memory = var.ecs_memory # 512 MB

  execution_role_arn = aws_iam_role.ecs_execution.arn
  task_role_arn      = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "${var.app_name}-backend"
      image = "${aws_ecr_repository.app.repository_url}:latest"

      # 포트 매핑 (Spring Boot 8080)
      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]

      # 환경변수
      # ⚠️ DB_PASSWORD, JWT_SECRET 등 민감값이 평문으로 들어감
      #    Step 6에서 Secrets Manager로 전환 예정
      environment = [
        { name = "SPRING_PROFILES_ACTIVE", value = "prod" },
        { name = "DB_HOST", value = aws_db_instance.postgres.address },
        { name = "DB_PORT", value = "5432" },
        { name = "DB_NAME", value = var.db_name },
        { name = "DB_USERNAME", value = var.db_username },
        { name = "DB_PASSWORD", value = var.db_password },
        { name = "GOOGLE_CLIENT_ID_IOS", value = var.google_client_id_ios },
        { name = "GOOGLE_CLIENT_ID_ANDROID", value = var.google_client_id_android },
        { name = "KAKAO_REST_API_KEY", value = var.kakao_rest_api_key },
        { name = "JWT_SECRET", value = var.jwt_secret },
      ]

      # 로그 설정 (CloudWatch로 전송)
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.app.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      # 컨테이너가 죽으면 태스크 전체를 종료 (재시작은 Service가 담당)
      essential = true
    }
  ])

  tags = {
    Name = "${var.app_name}-task"
  }
}

# -----------------------------------------------
# ECS Service (태스크를 원하는 개수만큼 유지)
# -----------------------------------------------
# "항상 1개의 태스크가 실행되도록 유지해라"
# 태스크가 죽으면 자동으로 새 태스크 시작
resource "aws_ecs_service" "app" {
  name            = "${var.app_name}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn

  desired_count = var.ecs_desired_count # 1
  launch_type   = "FARGATE"

  # 네트워크 설정
  network_configuration {
    subnets = [
      aws_subnet.public_a.id,
      aws_subnet.public_b.id,
    ]
    security_groups = [aws_security_group.ecs.id]

    # Public Subnet이므로 공인 IP 필요 (ECR 이미지 pull용)
    # NAT Gateway 대신 이 방법으로 비용 절약
    assign_public_ip = true
  }

  # ALB와 연결
  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "${var.app_name}-backend"
    container_port   = 8080
  }

  # 배포 설정
  deployment_maximum_percent         = 200 # 배포 시 새 태스크를 먼저 띄우고
  deployment_minimum_healthy_percent = 100 # 기존 태스크 유지 → 무중단 배포

  # ALB Target Group이 먼저 생성되어야 함
  depends_on = [aws_lb_listener.http]

  # Task Definition이 변경되어도 service 자체는 재생성하지 않음
  # (CI/CD에서 task definition만 업데이트)
  lifecycle {
    ignore_changes = [task_definition]
  }

  tags = {
    Name = "${var.app_name}-service"
  }
}
