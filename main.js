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
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code) {
        if (state === 'history') {
            handleHistoryCallback(code);
        } else {
            handleLineOAuthCallback(code);
        }
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
        submitBtn.innerHTML = 'อัปเกรดเป็น Private (1฿)';
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
        Swal.fire({
            icon: 'error',
            title: 'เกิดข้อผิดพลาด',
            text: 'ไม่สามารถรับเสียงได้ กรุณาลองใหม่อีกครั้ง',
            confirmButtonColor: '#d32f2f'
        });
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
    consultationData.message = "ลูกค้าแจ้งโอนเงิน: ขออัปเกรดเป็นบริการทนายส่วนตัว (1 บาท) เพื่อปรึกษาต่อเนื่อง";
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
        Swal.fire({
            icon: 'warning',
            title: 'ข้อมูลไม่ครบ',
            text: 'กรุณากรอกชื่อ-สกุล และเบอร์โทรศัพท์ก่อนทำรายการ',
            confirmButtonColor: '#1a237e'
        });
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

const historyLink = document.getElementById('history-link');
const historyPopup = document.getElementById('history-popup');
const closeHistoryBtn = document.querySelector('.close-history');
const loginHistoryBtn = document.getElementById('login-history-btn');

if (historyLink) {
    historyLink.addEventListener('click', (e) => {
        e.preventDefault();
        showModal(historyPopup);
    });
}
if (closeHistoryBtn) {
    closeHistoryBtn.addEventListener('click', () => {
        hideModal(historyPopup);
    });
}
if (loginHistoryBtn) {
    loginHistoryBtn.addEventListener('click', () => {
        Swal.fire({
            icon: 'info',
            title: 'ดึงข้อมูลประวัติ',
            text: 'ระบบกำลังพาคุณไปล็อคอินLINE เพื่อดึงข้อมูลประวัติ...',
            timer: 2000,
            showConfirmButton: false,
            allowOutsideClick: false
        }).then(() => {
            const clientId = '2009590576';
            const redirectUri = encodeURIComponent('https://suttiphod1234.github.io/law-treetep/');
            const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=history&scope=profile%20openid`;
            window.location.href = lineLoginUrl;
        });
    });
}


const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbweRNMbpeR_TFh1_1lU2WvG9sMt4jGOVgs6p11bVohO-bfhTIrYugZZvYmwyGfMHeQx/exec';

async function completeFlow() {
    // Save state before redirecting to LINE Login
    const dataToSave = { ...consultationData };
    delete dataToSave.slip; // Remove File object to safely stringify
    
    localStorage.setItem('pending_consultation', JSON.stringify(dataToSave));
    
    // LINE Login parameters
    const clientId = '2009590576';
    const redirectUri = encodeURIComponent('https://suttiphod1234.github.io/law-treetep/');
    
    const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=login&scope=profile%20openid`;
    
    Swal.fire({
        icon: 'info',
        title: 'ยืนยันตัวตน',
        text: 'ระบบจะพาคุณไปล็อคอินด้วยบัญชี LINE เพื่อเชื่อมต่อข้อมูลก่อนเริ่มการปรึกษาครับ',
        timer: 3500,
        showConfirmButton: false,
        allowOutsideClick: false
    }).then(() => {
        window.location.href = lineLoginUrl;
    });
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
    
    Swal.fire({
        icon: 'success',
        title: 'เชื่อมต่อสำเร็จ!',
        text: 'กำลังพาคุณไปที่ Line OA เพื่อพูดคุยกับทนายแอดมิน...',
        timer: 3000,
        showConfirmButton: false,
        allowOutsideClick: false
    }).then(() => {
        window.location.href = 'https://lin.ee/WwUXKHR';
    });
}

// History API Handler
async function handleHistoryCallback(authCode) {
    window.history.replaceState({}, document.title, window.location.pathname);
    showModal(historyPopup);
    
    document.getElementById('history-login-section').classList.add('hidden');
    document.getElementById('history-loading-section').classList.remove('hidden');
    
    try {
        const response = await fetch(`${BACKEND_URL}?action=get_history&code=${authCode}`);
        const result = await response.json();
        
        document.getElementById('history-loading-section').classList.add('hidden');
        document.getElementById('history-content-section').classList.remove('hidden');

        if (result.status === 'success') {
            renderHistory(result.data);
        } else {
            throw new Error(result.message || 'Unknown Error');
        }
    } catch (error) {
        document.getElementById('history-loading-section').classList.add('hidden');
        document.getElementById('history-login-section').classList.remove('hidden');
        console.error('Error fetching history:', error);
        Swal.fire({
            icon: 'error',
            title: 'ดึงข้อมูลไม่สำเร็จ',
            text: 'ไม่สามารถดึงข้อมูลประวัติการปรึกษาได้ในขณะนี้ การเข้าสู่ระบบอาจหมดอายุ หรือระบบขัดข้อง',
            confirmButtonColor: '#d32f2f'
        });
    }
}

function renderHistory(groupedData) {
    const historySection = document.getElementById('history-content-section');
    historySection.innerHTML = ''; 
    const categories = Object.keys(groupedData);
    
    if (categories.length === 0) {
        historySection.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #666; border: 2px dashed #ccc; border-radius: 8px;">
                <i class="fas fa-folder-open fa-3x" style="margin-bottom: 1rem; color: #ccc;"></i>
                <h4>ไม่พบประวัติการใช้งาน</h4>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">คุณยังไม่มีประวัติการสอบถามคดีในระบบครับ</p>
            </div>
        `;
        return;
    }

    categories.forEach(category => {
        const items = groupedData[category];
        if (!items || items.length === 0) return;

        const catDiv = document.createElement('div');
        catDiv.style.marginBottom = '1.5rem';
        
        const catTitle = document.createElement('h4');
        catTitle.innerHTML = `<i class="fas fa-bookmark" style="color:var(--primary-color)"></i> หมวด: ${category} <span style="font-size: 0.9rem; color:#666; font-weight:normal;">(${items.length} รายการ)</span>`;
        catTitle.style.marginBottom = '0.75rem';
        catTitle.style.borderBottom = '1px solid #eee';
        catTitle.style.paddingBottom = '0.5rem';
        catTitle.style.color = 'var(--primary-color)';
        catDiv.appendChild(catTitle);

        items.forEach(item => {
            const card = document.createElement('div');
            card.style.cssText = 'background: var(--bg-color); border-left: 4px solid var(--accent-orange); padding: 1rem; border-radius: 4px; margin-bottom: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);';
            
            const dateObj = new Date(item.date);
            const dateStr = !isNaN(dateObj) ? dateObj.toLocaleDateString('th-TH', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            }) : 'ไม่ระบุวันที่';

            const isPrivate = item.type === 'private';
            const badgeClass = isPrivate ? 'background: #e8f5e9; color: #2e7d32;' : 'background: #e8eaf6; color: #1a237e;';
            const badgeText = isPrivate ? '<i class="fas fa-star"></i> ทนายส่วนตัว (Private)' : '<i class="fas fa-comment"></i> บริการฟรี';

            card.innerHTML = `
                <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span style="display:inline-block; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold; ${badgeClass}">${badgeText}</span>
                    <span style="font-size: 0.8rem; color: #666;"><i class="far fa-clock"></i> ${dateStr}</span>
                </div>
                <div style="font-size: 0.95rem; color: var(--text-color); line-height: 1.5; background: rgba(255,255,255,0.7); padding: 8px; border-radius: 6px;">
                    ${item.message.replace(/\\n/g, '<br>')}
                </div>
            `;
            catDiv.appendChild(card);
        });

        historySection.appendChild(catDiv);
    });
}




// --- Helper Functions ---
function showModal(modal) {
    modal.classList.remove('hidden');
}

function hideModal(modal) {
    modal.classList.add('hidden');
}
