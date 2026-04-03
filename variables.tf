variable "region" {
  default = "ap-southeast-1" # สิงคโปร์ (ใกล้ไทย)
}

variable "instance_type" {
  default = "t2.micro" 
}

variable "db_username" {
  default = "admin"
}

variable "db_password" {
  default = "12345678"
}