terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Dead Letter Queue for failed / unprocessable pipeline dispatches
resource "aws_sqs_queue" "carbon_pipeline_dlq" {
  name                      = "carbon-pipeline-dlq"
  message_retention_seconds = 1209600 # 14 days
}

# Primary SQS Queue for carbon-aware pipeline holds
resource "aws_sqs_queue" "carbon_pipeline_queue" {
  name                       = "carbon-pipeline-queue"
  visibility_timeout_seconds = 300
  message_retention_seconds  = 86400 # 24 hours
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.carbon_pipeline_dlq.arn
    maxReceiveCount     = 3
  })

  tags = {
    Project     = "OptiGreen"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# IAM Policy for OptiGreen SQS dispatch and receipt
resource "aws_iam_policy" "optigreen_sqs_policy" {
  name        = "OptiGreenSQSPolicy"
  description = "Allows OptiGreen orchestrator to send and receive pipeline queue messages"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = [
          aws_sqs_queue.carbon_pipeline_queue.arn,
          aws_sqs_queue.carbon_pipeline_dlq.arn
        ]
      }
    ]
  })
}

# CloudWatch EventBridge rule triggering 5-minute carbon re-evaluation
resource "aws_cloudwatch_event_rule" "carbon_grid_evaluator_cron" {
  name                = "optigreen-grid-evaluator-5min"
  description         = "Triggers OptiGreen scheduler to re-evaluate held workloads against updated grid carbon metrics"
  schedule_expression = "rate(5 minutes)"
}

# -----------------------------------------------------------------------------
# Enterprise Cloud Constraint Solutions (Critical Reviewer Red Flag 2)
# -----------------------------------------------------------------------------

# 1. AWS ECR Cross-Region Replication (CRR)
# Pre-replicates base container layers across green target regions (e.g. us-west-2, eu-north-1)
# so pipelines never pull container image layers across high-latency WAN boundaries.
resource "aws_ecr_replication_configuration" "green_regions_replication" {
  replication_configuration {
    rule {
      destination {
        region      = "us-west-2"
        registry_id = var.aws_account_id != "" ? var.aws_account_id : null
      }
      destination {
        region      = "eu-north-1"
        registry_id = var.aws_account_id != "" ? var.aws_account_id : null
      }
    }
  }
}

# 2. Private VPC SQS Interface Endpoint (AWS PrivateLink)
# Allows self-hosted CI/CD runners inside air-gapped or private VPCs to receive
# pipeline dispatch commands from SQS without crossing internet boundaries.
resource "aws_vpc_endpoint" "sqs_vpc_endpoint" {
  count               = var.vpc_id != "" ? 1 : 0
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${var.aws_region}.sqs"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  security_group_ids  = var.security_group_ids

  tags = {
    Name    = "optigreen-sqs-vpc-endpoint"
    Project = "OptiGreen"
  }
}

output "sqs_queue_url" {
  description = "URL of the primary OptiGreen SQS queue"
  value       = aws_sqs_queue.carbon_pipeline_queue.url
}

output "sqs_queue_arn" {
  description = "ARN of the primary OptiGreen SQS queue"
  value       = aws_sqs_queue.carbon_pipeline_queue.arn
}
