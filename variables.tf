variable "region" {
  default = "ap-southeast-1"
}

variable "instance_type" {
  default = "t3.micro"
}

variable "db_username" {
  default = "admin"
}

variable "db_password" {
  description = "MySQL password"
  type        = string
  sensitive   = true
}
