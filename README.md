# คู่มือการติดตั้งระบบ เว็บไซต์ทนายอาสา สำนักกฎหมายตรีเทพทนายความ

ระบบนี้ประกอบด้วย 2 ส่วนหลัก: **Frontend (Vite)** และ **Backend (Google Apps Script)**

## 1. การติดตั้ง Backend (Google Sheets & Apps Script)
1. สร้าง **Google Sheet** ใหม่
2. ไปที่เมนู **Extensions > Apps Script**
3. คัดลอกโค้ดจากไฟล์ `backend/Code.gs` ไปวางในโครงการ Apps Script
4. **ตั้งค่าตัวแปรในโค้ด:**
   - `SHEET_ID`: ไอดีของ Google Sheet (ดูจาก URL ของไฟล์)
   - `LINE_ACCESS_TOKEN`: Channel Access Token จาก Line Developers
   - `LAWYER_GROUP_ID`: ไอดีกลุ่มไลน์ของทนาย (ใช้ Bot ดึงไอดีมา)
5. กด **Deploy > New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. คัดลอก **Web App URL** ที่ได้

## 2. การเชื่อมต่อ Frontend
1. เปิดไฟล์ `main.js`
2. แก้ไขค่า `BACKEND_URL` โดยนำ URL จากขั้นตอนก่อนหน้ามาวาง
3. แก้ไข `lineLink` เป็นลิงก์ Line OA ของคุณ

## 3. การใช้งาน Line OA
- เมื่อลูกค้ากดแอดไลน์ ระบบจะส่งข้อความ "สวัสดีทนาย"
- ข้อมูลจะถูกเก็บลง Google Sheet แยกตามหมวดอัตโนมัติ
- ทนายจะได้รับ Flex Message ในกลุ่ม และสามารถกด "ตอบคำถาม" เพื่อแชทกับลูกค้าได้ทันที

---
สำนักกฎหมายทนายความตรีเทพพิทักษ์
พร้อมเพย์: 0613055625
โทร: 0863624188
