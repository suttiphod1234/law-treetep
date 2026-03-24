// Main Logic for Trithep Law Office Website

// DOM Elements
const searchInput = document.getElementById('search-input');
const voiceBtn = document.getElementById('voice-btn');
const submitBtn = document.getElementById('submit-btn');
const confirmPopup = document.getElementById('confirm-popup');
const previewText = document.getElementById('preview-text');
const editBtn = document.getElementById('edit-btn');
const acceptCheck = document.getElementById('accept-check');
const acceptBtn = document.getElementById('accept-btn');
const contactPopup = document.getElementById('contact-popup');
const freeConsultBtn = document.getElementById('free-consult');
const privateConsultBtn = document.getElementById('private-consult');
const faqLink = document.getElementById('faq-link');
const faqPopup = document.getElementById('faq-popup');
const closeFaqBtn = document.querySelector('.close-faq');

// State
let isFreeUsed = localStorage.getItem('has_used_free') === 'true';
let isPrivate = localStorage.getItem('is_private') === 'true';

let consultationData = {
    message: '',
    fullName: '',
    phone: '',
    lineId: '',
    type: '', // 'free' or 'private'
    slip: null
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Check if returning from LINE Login
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    
    if (authCode) {
        handleLineOAuthCallback(authCode);
        return;
    }

    // Auto-resize textarea
    searchInput.addEventListener('input', () => {
        if (searchInput.disabled) return;
        searchInput.style.height = 'auto';
        searchInput.style.height = (searchInput.scrollHeight) + 'px';
        submitBtn.disabled = searchInput.value.trim() === '';
    });

    // Handle Enter key
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !submitBtn.disabled) {
            e.preventDefault();
            if (isFreeUsed && !isPrivate) {
                handleUpgradeFlow();
            } else {
                handleSubmit();
            }
        }
    });

    checkLockState();
});

function checkLockState() {
    if (isFreeUsed && !isPrivate) {
        searchInput.disabled = true;
        searchInput.placeholder = "สิทธิ์ปรึกษาฟรี 1 ครั้งของคุณหมดแล้ว กรุณาอัปเกรดเป็นทนายส่วนตัวเพื่อปรึกษาต่อครับ";
        searchInput.value = '';
        voiceBtn.style.display = 'none';
        submitBtn.innerHTML = 'อัปเกรดเป็น Private (500฿)';
        submitBtn.style.backgroundColor = '#d32f2f'; // Highlight as an upgrade button
        submitBtn.disabled = false;
        
        submitBtn.onclick = handleUpgradeFlow;
    } else {
        searchInput.disabled = false;
        searchInput.placeholder = "พิมพ์สิ่งที่ต้องการปรึกษา : ในช่องนี้";
        voiceBtn.style.display = 'block';
        submitBtn.innerHTML = 'ส่ง <i class="fas fa-paper-plane"></i>';
        submitBtn.style.backgroundColor = '';
        submitBtn.disabled = searchInput.value.trim() === '';
        
        submitBtn.onclick = handleSubmit;
    }
}

// --- Voice Recognition ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'th-TH';
    recognition.interimResults = false;

    voiceBtn.addEventListener('click', () => {
        if (voiceBtn.classList.contains('recording')) {
            recognition.stop();
        } else {
            recognition.start();
            voiceBtn.classList.add('recording');
        }
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        searchInput.value += transcript;
        searchInput.dispatchEvent(new Event('input'));
        voiceBtn.classList.remove('recording');
    };

    recognition.onerror = () => {
        voiceBtn.classList.remove('recording');
        alert('เกิดข้อผิดพลาดในการรับเสียง กรุณาลองอีกครั้ง');
    };

    recognition.onend = () => {
        voiceBtn.classList.remove('recording');
    };
} else {
    voiceBtn.style.display = 'none';
}

// --- Flow Functions ---

function handleSubmit() {
    document.getElementById('free-consult').style.display = 'flex';
    consultationData.message = searchInput.value.trim();
    previewText.textContent = consultationData.message;
    showModal(confirmPopup);
}

function handleUpgradeFlow(e) {
    if (e) e.preventDefault();
    consultationData.message = "ลูกค้าแจ้งโอนเงิน: ขออัปเกรดเป็นบริการทนายส่วนตัว (500 บาท) เพื่อปรึกษาต่อเนื่อง";
    document.getElementById('free-consult').style.display = 'none';
    showModal(contactPopup);
}

editBtn.addEventListener('click', () => {
    hideModal(confirmPopup);
    searchInput.focus();
});

acceptCheck.addEventListener('change', () => {
    acceptBtn.disabled = !acceptCheck.checked;
});

acceptBtn.addEventListener('click', () => {
    hideModal(confirmPopup);
    showModal(contactPopup);
});

// Service Selection
freeConsultBtn.addEventListener('click', () => {
    handleServiceSelection('free');
});

privateConsultBtn.addEventListener('click', () => {
    handleServiceSelection('private');
});

function handleServiceSelection(type) {
    const name = document.getElementById('full-name').value;
    const phone = document.getElementById('phone').value;
    const lineId = document.getElementById('line-id').value;

    if (!name || !phone) {
        alert('กรุณากรอกชื่อและเบอร์โทรศัพท์');
        return;
    }

    consultationData.fullName = name;
    consultationData.phone = phone;
    consultationData.lineId = lineId;
    consultationData.type = type;

    if (type === 'free') {
        const freeCount = parseInt(localStorage.getItem('free_count_' + phone) || '0', 10);
        localStorage.setItem('free_count_' + phone, freeCount + 1);
        completeFlow();
    } else {
        const dataToSave = { ...consultationData };
        delete dataToSave.slip;
        localStorage.setItem('pending_consultation', JSON.stringify(dataToSave));
        window.location.href = 'payment.html';
    }
}

// FAQ Handlers
faqLink.addEventListener('click', (e) => {
    e.preventDefault();
    showModal(faqPopup);
});

closeFaqBtn.addEventListener('click', () => {
    hideModal(faqPopup);
});

const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbxadhGjfQ6WzDuw-5GdsfMYWG_Mp8Zrge01XfA1ms57wLf6Z1N1JlHzpSyNBGEcfTCm/exec';

async function completeFlow() {
    // Save state before redirecting to LINE Login
    const dataToSave = { ...consultationData };
    delete dataToSave.slip; // Remove File object to safely stringify
    
    localStorage.setItem('pending_consultation', JSON.stringify(dataToSave));
    
    // LINE Login parameters
    const clientId = '2009590576';
    const redirectUri = encodeURIComponent('https://suttiphod1234.github.io/law-treetep/');
    
    const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=login&scope=profile%20openid`;
    
    alert('ระบบจะพาคุณไปล็อคอินด้วยบัญชี LINE เพื่อยืนยันตัวตนก่อนดำเนินการต่อครับ');
    window.location.href = lineLoginUrl;
}

async function handleLineOAuthCallback(authCode) {
    const pendingDataStr = localStorage.getItem('pending_consultation');
    if (!pendingDataStr) {
        window.history.replaceState({}, document.title, window.location.pathname);
        checkLockState();
        return;
    }
    
    document.body.style.opacity = '0.5'; // Loading state
    
    let pendingData = {};
    try { pendingData = JSON.parse(pendingDataStr); } catch(e) {}
    
    // Attach authorization code to be exchanged by backend
    pendingData.code = authCode;
    
    console.log('Sending data and OAuth code to Back-end...', pendingData);
    try {
        await fetch(BACKEND_URL, {
            method: 'POST',
            body: JSON.stringify(pendingData),
            mode: 'no-cors'
        });
        console.log('Data sent successfully');
    } catch (err) {
        console.error('Error sending data:', err);
    }
    
    // Update Front-end local status
    if (pendingData.type === 'free') {
        localStorage.setItem('has_used_free', 'true');
        isFreeUsed = true;
    } else if (pendingData.type === 'private') {
        localStorage.setItem('is_private', 'true');
        isPrivate = true;
    }
    
    localStorage.removeItem('pending_consultation');
    
    alert('ผูกบัญชีสำเร็จ! กำลังพาคุณไปที่ Line เพื่อไปคุยกับแอดมินทนาย...');
    window.location.href = `https://lin.ee/WwUXKHR`;
}

// --- Helper Functions ---
function showModal(modal) {
    modal.classList.remove('hidden');
}

function hideModal(modal) {
    modal.classList.add('hidden');
}
