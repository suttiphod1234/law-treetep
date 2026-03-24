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
    // 💡 ระบบจำลองการตรวจสลิป (Mock) หากยังไม่มี API KEY
    if (!SLIPOK_API_KEY) {
        return new Promise(resolve => {
            setTimeout(() => {
                // สมมติว่าอ่านสลิปแล้วข้อมูลถูกต้อง
                resolve(true);
            }, 1500);
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
            
            // เช็คผู้รับว่าชื่อคุณสุทธิพจน์หรือไม่
            const receiverName = result.data.receiver.displayName || result.data.receiver.name || '';
            const isMatch = receiverName.includes('สุทธิพจน์') || receiverName.includes('SUTTHIPHOD') || receiverName.includes('ศรีแสนยงค์');
            
            if (!isMatch) {
               alert('ชื่อบัญชีผู้รับเงินไม่ตรงกับ "สุทธิพจน์ ศรีแสนยงค์" โอนไปที่: ' + receiverName);
               return false;
            }

            return true;
        } else {
            console.error('Slip Verify API Error:', result.message);
            alert('สลิปนี้ตรวจสอบไม่ผ่าน: ' + result.message);
            return false;
        }
    } catch (error) {
        console.error('Slip API Fetch Error:', error);
        alert('ระบบเครือข่ายมีปัญหา ไม่สามารถตรวจสอบสลิปได้ในขณะนี้');
        return false;
    }
}
