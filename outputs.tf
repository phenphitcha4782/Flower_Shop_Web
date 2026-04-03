output "web_ip" {
  description = "Public IP ของ EC2"
  value       = aws_instance.web.public_ip
}

output "web_url" {
  description = "URL สำหรับเข้าเว็บ"
  value       = "http://${aws_instance.web.public_ip}:3000"
}

output "db_endpoint" {
  description = "MySQL endpoint"
  value       = aws_db_instance.mysql.endpoint
}
