# ============================================
# vpc.tf - 네트워크 구성
# ============================================
# VPC = 가상 네트워크. AWS에서 리소스들이 살아가는 "동네"
#
# 비유하면:
#   VPC         = 아파트 단지 전체
#   Subnet      = 각 동 (101동, 102동...)
#   Public      = 도로에 면한 1층 상가 (인터넷 접근 가능)
#   Private     = 내부에 있는 주거동 (외부 접근 불가)
#   Internet GW = 단지 정문
#   Route Table = 동별 우편함 (트래픽을 어디로 보낼지)

# 서울 리전의 가용영역(AZ) 목록 조회
# ap-northeast-2a, ap-northeast-2b 등을 자동으로 가져옴
data "aws_availability_zones" "available" {
  state = "available"
}

# -----------------------------------------------
# VPC (전체 네트워크)
# -----------------------------------------------
resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr # 10.0.0.0/16

  # DNS 관련 설정 (RDS 엔드포인트 등 도메인 이름 해석에 필요)
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.app_name}-vpc"
  }
}

# -----------------------------------------------
# Public Subnets (ALB + ECS가 여기 배치)
# -----------------------------------------------
# 왜 2개? → ALB는 최소 2개 AZ에 서브넷이 필요 (AWS 규칙)
# AZ를 나누면 하나가 장애나도 다른 AZ에서 서비스 가능

resource "aws_subnet" "public_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24" # 10.0.1.0 ~ 10.0.1.255 (256개 IP)
  availability_zone = data.aws_availability_zones.available.names[0] # ap-northeast-2a

  # 이 서브넷에 생성되는 인스턴스에 공인 IP 자동 할당
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.app_name}-public-a"
  }
}

resource "aws_subnet" "public_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = data.aws_availability_zones.available.names[2] # ap-northeast-2c

  map_public_ip_on_launch = true

  tags = {
    Name = "${var.app_name}-public-b"
  }
}

# -----------------------------------------------
# Private Subnets (RDS + Redis가 여기 배치)
# -----------------------------------------------
# 인터넷에서 직접 접근 불가 → DB 보안 확보

resource "aws_subnet" "private_a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name = "${var.app_name}-private-a"
  }
}

resource "aws_subnet" "private_b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = data.aws_availability_zones.available.names[2]

  tags = {
    Name = "${var.app_name}-private-b"
  }
}

# -----------------------------------------------
# Internet Gateway (VPC의 인터넷 출입구)
# -----------------------------------------------
# 이게 없으면 VPC 안의 아무것도 인터넷에 접근 못함

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.app_name}-igw"
  }
}

# -----------------------------------------------
# Route Tables (트래픽 경로 설정)
# -----------------------------------------------

# Public Route Table: 0.0.0.0/0 → Internet Gateway
# "목적지가 VPC 밖이면 인터넷 게이트웨이로 보내라"
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0" # 모든 외부 트래픽
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.app_name}-public-rt"
  }
}

# Public 서브넷에 라우트 테이블 연결
resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}

# Private Route Table: 인터넷 경로 없음
# → RDS, Redis는 외부 인터넷 접근 불가 (보안)
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  # route 블록 없음 = 인터넷 접근 불가

  tags = {
    Name = "${var.app_name}-private-rt"
  }
}

resource "aws_route_table_association" "private_a" {
  subnet_id      = aws_subnet.private_a.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_b" {
  subnet_id      = aws_subnet.private_b.id
  route_table_id = aws_route_table.private.id
}
