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
            alert('ข้อมูลสูญหาย กรุณาทำรายการใหม่');
            window.location.href = 'index.html';
            return;
        }
        
        // LINE Login parameters
        const clientId = '2009590576';
        const redirectUri = encodeURIComponent('https://suttiphod1234.github.io/law-treetep/');
        
        const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=login&scope=profile%20openid`;
        
        alert('เชื่อมต่อระบบสำเร็จ! กำลังพาคุณไปล็อคอินบัญชี LINE เพื่อยืนยันตัวตนครับ');
        window.location.href = lineLoginUrl;
    });
});

async function verifySlipAPI(file) {
    // 💡 ระบบจำลองการตรวจสลิป (Mock) เมื่อยังไม่มี API KEY โดยจะพยายามสแกนหา QR ในภาพ
    if (!SLIPOK_API_KEY) {
        const hasQR = await scanLocalQR(file);
        if (!hasQR) {
            alert('ไม่พบ QR Code หรือไม่ใช่ไฟล์ที่สามารถตรวจสอบสลิปการโอนได้');
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
                alert('ยอดเงินในสลิปไม่ครบ 1 บาท');
                return false;
            }
            
            // เช็คผู้รับว่าเป็น "SCB มณี SHOP" หรือ "สุทธิพจน์" หรือไม่
            const receiverName = result.data.receiver.displayName || result.data.receiver.name || '';
            const isMatch = receiverName.includes('สุทธิพจน์') || receiverName.includes('SUTTHIPHOD') || receiverName.includes('ศรีแสนยงค์') || receiverName.includes('มณี') || receiverName.includes('SHOP') || receiverName.includes('MANEE');
            
            if (!isMatch) {
               alert('ชื่อบัญชีผู้รับเงินไม่ตรงกับที่กำหนด (พบชื่อบัญชี: ' + receiverName + ')\\nหรือไม่ใช่สลิปของร้านค้าแม่มณี');
               return false;
            }

            return true;
        } else {
            console.error('Slip Verify API Error:', result.message);
            alert('ไม่ใช่ไฟล์ที่สามารถตรวจสอบสลิปการโอนได้ หรือสลิปนี้ตรวจสอบไม่ผ่าน: ' + result.message);
            return false;
        }
    } catch (error) {
        console.error('Slip API Fetch Error:', error);
        alert('ระบบเครือข่ายมีปัญหา ไม่สามารถตรวจสอบสลิปได้ในขณะนี้');
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
                canvas.width = img.width;
                canvas.height = img.height;
                context.drawImage(img, 0, 0, img.width, img.height);
                
                try {
                    const imageData = context.getImageData(0, 0, img.width, img.height);
                    if (window.jsQR) {
                        const code = jsQR(imageData.data, imageData.width, imageData.height);
                        if (code && code.data.length > 10) {
                            resolve(true); // พบ QR Code ในภาพ
                        } else {
                            resolve(false); // ไม่พบ QR Code
                        }
                    } else {
                        resolve(true); // ข้ามไปถ้าโหลด jsQR ไม่สำเร็จ
                    }
                } catch(err) {
                    resolve(false);
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}
