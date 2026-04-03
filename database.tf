resource "aws_db_instance" "flower_db" {
  allocated_storage    = 20
  db_name              = "flower_shop_db"
  engine               = "mysql"
  engine_version       = "8.0"
  instance_class       = "db.t3.micro" # ใช้ตัวฟรี/ราคาถูก
  username             = "admin"       # แก้เป็นชื่อที่ต้องการ
  password             = "yourpassword123" # แก้เป็นรหัสที่ปลอดภัย
  skip_final_snapshot  = true
  publicly_accessible  = false # ให้เข้าถึงได้เฉพาะจาก Backend เท่านั้น (ปลอดภัยกว่า)
}