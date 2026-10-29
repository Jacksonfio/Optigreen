variable "aws_region" {
  description = "AWS region for OptiGreen infrastructure"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "aws_account_id" {
  description = "AWS Account ID for ECR replication (optional)"
  type        = string
  default     = ""
}

variable "vpc_id" {
  description = "Target private VPC ID for SQS VPC Interface Endpoint (optional)"
  type        = string
  default     = ""
}

variable "security_group_ids" {
  description = "Security group IDs for VPC Endpoint (optional)"
  type        = list(string)
  default     = []
}
