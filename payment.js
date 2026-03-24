// payment.js

// 🔴 ใส่ API Key และ Branch ID ของแพลตฟอร์มตรวจสลิป (เช่น SlipOK) ที่นี่ 🔴
const SLIPOK_API_KEY = ''; // เช่น 'sk_test_xxxxxx'
const SLIPOK_BRANCH_ID = ''; // เช่น 'branch_1234'

document.addEventListener('DOMContentLoaded', () => {
    const slipUpload = document.getElementById('slip-upload');
    const finalConfirmBtn = document.getElementById('final-confirm');
    const cancelBtn = document.getElementById('cancel-btn');
    const uploadStatus = document.getElementById('upload-status');

    slipUpload.addEventListener('change', async (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            
            // แสดงสถานะกำลังโหลด
            uploadStatus.style.display = 'block';
            uploadStatus.style.color = '#1a4f8b';
            uploadStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> กำลังตรวจสอบสลิป...';
            finalConfirmBtn.disabled = true;

            const isVerified = await verifySlipAPI(file);
            
            if (isVerified) {
                uploadStatus.style.color = '#28a745';
                uploadStatus.innerHTML = '<i class="fas fa-check-circle"></i> สลิปถูกต้อง! ยอดเงินโอนเข้า SCB เรียบร้อย';
                finalConfirmBtn.disabled = false;
            } else {
                uploadStatus.style.color = '#d32f2f';
                uploadStatus.innerHTML = '<i class="fas fa-times-circle"></i> ข้อมูลสลิปไม่ถูกต้อง หรือยอดเงินไม่ตรง กรุณาอัปโหลดใหม่';
                finalConfirmBtn.disabled = true;
                slipUpload.value = ''; // Reset input
            }
        } else {
            finalConfirmBtn.disabled = true;
            uploadStatus.style.display = 'none';
        }
    });

    cancelBtn.addEventListener('click', () => {
        // Clear pending data and go back
        localStorage.removeItem('pending_consultation');
        window.location.href = 'index.html';
    });

    finalConfirmBtn.addEventListener('click', () => {
        const pendingDataStr = localStorage.getItem('pending_consultation');
        if (!pendingDataStr) {
            Swal.fire({
                icon: 'warning',
                title: 'หมดเวลาทำรายการ',
                text: 'ข้อมูลสูญหาย กรุณาย้อนกลับไปเริ่มต้นทำรายการใหม่',
                confirmButtonColor: '#1a237e'
            }).then(() => {
                window.location.href = 'index.html';
            });
            return;
        }
        
        // LINE Login parameters
        const clientId = '2009590576';
        const redirectUri = encodeURIComponent('https://suttiphod1234.github.io/law-treetep/');
        
        const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=login&scope=profile%20openid`;
        
        Swal.fire({
            icon: 'success',
            title: 'เชื่อมต่อระบบสำเร็จ!',
            text: 'ระบบกำลังพาคุณไปล็อคอินบัญชี LINE เพื่อเชื่อมโยงข้อมูลครับ...',
            timer: 2500,
            showConfirmButton: false,
            allowOutsideClick: false
        }).then(() => {
            window.location.href = lineLoginUrl;
        });
    });
});

async function verifySlipAPI(file) {
    // 💡 ระบบจำลองการตรวจสลิป (Mock) เมื่อยังไม่มี API KEY โดยจะพยายามสแกนหา QR ในภาพ
    if (!SLIPOK_API_KEY) {
        const hasQR = await scanLocalQR(file);
        if (!hasQR) {
            Swal.fire({
                icon: 'error',
                title: 'ตรวจสอบไม่ผ่าน',
                text: 'ไม่พบ QR Code หรือไม่ใช่ไฟล์ที่สามารถตรวจสอบสลิปการโอนได้ โปรดใช้รูปสลิปจากแอปธนาคารเท่านั้น',
                confirmButtonColor: '#d32f2f'
            });
            return false;
        }
        return new Promise(resolve => {
            setTimeout(() => {
                // สมมติว่าอ่านสลิปแล้วข้อมูลถูกต้อง
                resolve(true);
            }, 1000);
        });
    }

    // 💡 การยิง API ของจริง (ตัวอย่างใช้ของ SlipOK)
    try {
        const formData = new FormData();
        formData.append('files', file);

        const response = await fetch(`https://api.slipok.com/api/line/apikey/${SLIPOK_BRANCH_ID}`, {
            method: 'POST',
            headers: {
                'x-authorization': SLIPOK_API_KEY
            },
            body: formData
        });

        const result = await response.json();
        
        if (result.success) {
            // เช็คว่ายอดเงินถึงกำหนดหรือไม่ (ทดสอบที่ 1 บาท)
            if (result.data.amount < 1) {
                Swal.fire({
                    icon: 'error',
                    title: 'ยอดเงินไม่ถูกต้อง',
                    text: 'ยอดเงินในสลิปไม่ครบตามที่กำหนด (1 บาท)',
                    confirmButtonColor: '#d32f2f'
                });
                return false;
            }
            
            // เช็คผู้รับว่าเป็น "SCB มณี SHOP" หรือ "สุทธิพจน์" หรือไม่
            const receiverName = result.data.receiver.displayName || result.data.receiver.name || '';
            const isMatch = receiverName.includes('สุทธิพจน์') || receiverName.includes('SUTTHIPHOD') || receiverName.includes('ศรีแสนยงค์') || receiverName.includes('มณี') || receiverName.includes('SHOP') || receiverName.includes('MANEE');
            
            if (!isMatch) {
                Swal.fire({
                    icon: 'error',
                    title: 'กดยืนยันไม่สำเร็จ',
                    html: `ชื่อบัญชีผู้รับเงินไม่ตรงกับที่กำหนด<br><small>พบชื่อบัญชี: ${receiverName}</small>`,
                    confirmButtonColor: '#d32f2f'
                });
                return false;
            }

            return true;
        } else {
            console.error('Slip Verify API Error:', result.message);
            Swal.fire({
                icon: 'error',
                title: 'สลิปไม่ถูกต้อง',
                text: 'ไม่ใช่ไฟล์ที่สามารถตรวจสอบสลิปการโอนได้ หรือสลิปนี้ตรวจสอบไม่ผ่าน',
                footer: `<small>${result.message}</small>`,
                confirmButtonColor: '#d32f2f'
            });
            return false;
        }
    } catch (error) {
        console.error('Slip API Fetch Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ระบบเครือข่ายมีปัญหา ไม่สามารถตรวจสอบสลิปได้ในขณะนี้',
            confirmButtonColor: '#d32f2f'
        });
        return false;
    }
}

// ฟังก์ชันสแกน QR ภายในเครื่อง (กรณีไม่มี API Key ใช้ดักไฟล์ขยะ)
function scanLocalQR(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                
                // ย่อขนาดรูปภาพให้สแกนได้เร็วขึ้นและป้องกันเบราว์เซอร์ล่มในมือถือ
                const MAX_WIDTH = 800;
                let width = img.width;
                let height = img.height;
                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }
                
                canvas.width = width;
                canvas.height = height;
                context.drawImage(img, 0, 0, width, height);
                
                try {
                    const imageData = context.getImageData(0, 0, width, height);
                    if (typeof jsQR !== 'undefined') {
                        const code = jsQR(imageData.data, imageData.width, imageData.height);
                        if (code && code.data && code.data.length > 10) {
                            console.log("Scanned QR:", code.data);
                            resolve(true); // พบ QR Code ในภาพ
                        } else {
                            resolve(false); // ไม่พบ QR Code
                        }
                    } else {
                        console.error('jsQR library not loaded');
                        resolve(false); // บังคับไม่ผ่านถ้าตัวแสกนไม่ทำงาน
                    }
                } catch(err) {
                    resolve(false);
                }
            };
            img.onerror = () => resolve(false);
            img.src = e.target.result;
        };
        reader.onerror = () => resolve(false);
        reader.readAsDataURL(file);
    });
}
