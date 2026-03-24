// payment.js
document.addEventListener('DOMContentLoaded', () => {
    const slipUpload = document.getElementById('slip-upload');
    const finalConfirmBtn = document.getElementById('final-confirm');
    const cancelBtn = document.getElementById('cancel-btn');

    slipUpload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            finalConfirmBtn.disabled = false;
        } else {
            finalConfirmBtn.disabled = true;
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
        
        alert('ระบบจะพาคุณไปล็อคอินด้วยบัญชี LINE เพื่อยืนยันตัวตนก่อนดำเนินการต่อครับ');
        window.location.href = lineLoginUrl;
    });
});
