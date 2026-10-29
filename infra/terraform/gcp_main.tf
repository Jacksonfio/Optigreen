# ==============================================================================
# Google Cloud Platform (GCP) Infrastructure as Code
# Provisions Google Cloud Run, Cloud Pub/Sub, Artifact Registry & Firestore
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.20.0"
    }
  }
}

variable "gcp_project_id" {
  description = "Google Cloud Project ID"
  type        = string
  default     = "optigreen-prod"
}

variable "gcp_region" {
  description = "Default Google Cloud deployment region"
  type        = string
  default     = "us-central1"
}

# 1. Google Artifact Registry for multi-region Docker base layer caching
resource "google_artifact_registry_repository" "optigreen_repo" {
  location      = var.gcp_region
  repository_id = "optigreen-images"
  description   = "Docker container registry for OptiGreen scheduler & speculative layer cache"
  format        = "DOCKER"
}

# 2. Google Cloud Pub/Sub for parallel pipeline fan-out
resource "google_pubsub_topic" "pipeline_events" {
  name = "optigreen-pipeline-events"

  message_storage_policy {
    allowed_persistence_regions = [
      "us-central1",
      "europe-north1"
    ]
  }
}

resource "google_pubsub_subscription" "pipeline_sub" {
  name  = "optigreen-pipeline-sub"
  topic = google_pubsub_topic.pipeline_events.name

  ack_deadline_seconds = 20
  retain_acked_messages = false
}

# 3. Google Cloud Run Service (Serverless container deployment)
resource "google_cloud_run_service" "optigreen_app" {
  name     = "optigreen-prod"
  location = var.gcp_region

  template {
    spec {
      containers {
        image = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project_id}/${google_artifact_registry_repository.optigreen_repo.repository_id}/optigreen-scheduler:latest"
        
        ports {
          container_port = 8080
        }

        resources {
          limits = {
            cpu    = "2000m"
            memory = "1024Mi"
          }
        }

        env {
          name  = "NODE_ENV"
          value = "production"
        }
        env {
          name  = "PORT"
          value = "8080"
        }
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = "0"
        "autoscaling.knative.dev/maxScale" = "10"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Allow public unauthenticated invocations for Cloud Run edge gateway
resource "google_cloud_run_service_iam_member" "public_access" {
  service  = google_cloud_run_service.optigreen_app.name
  location = google_cloud_run_service.optigreen_app.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# 4. Google Cloud Firestore Database (Native mode for ESG ledger persistence)
resource "google_firestore_database" "optigreen_db" {
  project     = var.gcp_project_id
  name        = "(default)"
  location_id = "nam5" # Multi-region US
  type        = "FIRESTORE_NATIVE"
}
