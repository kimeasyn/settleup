# ============================================
# alb.tf - Application Load Balancer
# ============================================
# ALB = 트래픽을 받아서 ECS 컨테이너로 분배하는 역할
#
# Nginx 리버스 프록시와 비슷한 개념:
#   Nginx: proxy_pass http://upstream;
#   ALB:   Target Group → ECS 태스크들
#
# 추가로 ALB가 해주는 것:
#   - SSL 종료 (HTTPS → HTTP 변환, ACM 인증서 사용)
#   - 헬스체크 (죽은 컨테이너로 트래픽 안 보냄)
#   - 다중 컨테이너 간 부하 분산

# -----------------------------------------------
# ALB
# -----------------------------------------------
resource "aws_lb" "main" {
  name               = "${var.app_name}-alb"
  internal           = false # 인터넷에서 접근 가능 (true면 내부용)
  load_balancer_type = "application"

  security_groups = [aws_security_group.alb.id]
  subnets = [
    aws_subnet.public_a.id,
    aws_subnet.public_b.id,
  ]

  tags = {
    Name = "${var.app_name}-alb"
  }
}

# -----------------------------------------------
# Target Group (트래픽을 보낼 대상 그룹)
# -----------------------------------------------
# "ECS 태스크들의 8080 포트로 트래픽을 보내라"
resource "aws_lb_target_group" "app" {
  name = "${var.app_name}-tg"

  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip" # Fargate는 IP 기반 (EC2는 instance)

  # -----------------------------------------------
  # 헬스체크 설정
  # -----------------------------------------------
  # ALB가 주기적으로 이 경로에 요청을 보내서 컨테이너 상태 확인
  # application-prod.yml의 Actuator 엔드포인트와 일치해야 함
  health_check {
    path                = "/api/v1/actuator/health"
    protocol            = "HTTP"
    port                = "traffic-port" # Target Group 포트와 동일 (8080)
    healthy_threshold   = 2              # 2번 연속 성공 → healthy
    unhealthy_threshold = 3              # 3번 연속 실패 → unhealthy → 태스크 교체
    timeout             = 10             # 10초 내 응답 없으면 실패
    interval            = 30             # 30초마다 체크
    matcher             = "200"          # HTTP 200이면 성공
  }

  # ECS 배포 시 기존 타겟 등록 해제를 기다리는 시간
  deregistration_delay = 30 # Graceful Shutdown(25초)보다 약간 길게

  tags = {
    Name = "${var.app_name}-tg"
  }
}

# -----------------------------------------------
# HTTP Listener (80 → HTTPS 리다이렉트)
# -----------------------------------------------
# HTTP로 들어오면 HTTPS로 리다이렉트
# 도메인이 없을 때는 임시로 Target Group으로 직접 포워딩
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  # 도메인 없을 때: 80 포트로 직접 접근 허용
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }

  # 나중에 도메인 + SSL 인증서 설정 후에는 아래로 변경:
  # default_action {
  #   type = "redirect"
  #   redirect {
  #     port        = "443"
  #     protocol    = "HTTPS"
  #     status_code = "HTTP_301"
  #   }
  # }
}

# -----------------------------------------------
# HTTPS Listener (도메인 설정 후 활성화)
# -----------------------------------------------
# ACM 인증서 + 도메인이 준비되면 주석 해제
#
# resource "aws_lb_listener" "https" {
#   load_balancer_arn = aws_lb.main.arn
#   port              = 443
#   protocol          = "HTTPS"
#   ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
#   certificate_arn   = aws_acm_certificate.main.arn
#
#   default_action {
#     type             = "forward"
#     target_group_arn = aws_lb_target_group.app.arn
#   }
# }
