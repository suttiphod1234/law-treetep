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
const paymentPopup = document.getElementById('payment-popup');
const slipUpload = document.getElementById('slip-upload');
const finalConfirmBtn = document.getElementById('final-confirm');
const faqLink = document.getElementById('faq-link');
const faqPopup = document.getElementById('faq-popup');
const closeFaqBtn = document.querySelector('.close-faq');

// State
let consultationData = {
    message: '',
    fullName: '',
    phone: '',
    type: '', // 'free' or 'private'
    slip: null
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Auto-resize textarea
    searchInput.addEventListener('input', () => {
        searchInput.style.height = 'auto';
        searchInput.style.height = (searchInput.scrollHeight) + 'px';
        submitBtn.disabled = searchInput.value.trim() === '';
    });

    // Handle Enter key
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !submitBtn.disabled) {
            e.preventDefault();
            handleSubmit();
        }
    });
});

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
    consultationData.message = searchInput.value.trim();
    previewText.textContent = consultationData.message;
    showModal(confirmPopup);
}

submitBtn.addEventListener('click', handleSubmit);

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
        completeFlow();
    } else {
        hideModal(contactPopup);
        showModal(paymentPopup);
    }
}

slipUpload.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        consultationData.slip = e.target.files[0];
        finalConfirmBtn.disabled = false;
    }
});

finalConfirmBtn.addEventListener('click', () => {
    completeFlow();
});

// FAQ Handlers
faqLink.addEventListener('click', (e) => {
    e.preventDefault();
    showModal(faqPopup);
});

closeFaqBtn.addEventListener('click', () => {
    hideModal(faqPopup);
});

const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbwhtSgvp8w9nKET-YA8jvNqQdn65XfkVZP365PRZMjDqlJ1T9XWiO2usL6V5BhNYY0u/exec';

async function completeFlow() {
    // Save to Google Sheets via Apps Script
    console.log('Sending data to Back-end...', consultationData);
    
    try {
        if (BACKEND_URL !== 'YOUR_APPS_SCRIPT_WEB_APP_URL') {
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                body: JSON.stringify(consultationData),
                mode: 'no-cors' // Apps Script requires no-cors sometimes or handled via Options
            });
            console.log('Data sent successfully');
        }
    } catch (err) {
        console.error('Error sending data:', err);
    }
    
    // Redirect to Line OA
    const lineID = "@440dtbxo";
    const lineLink = `https://line.me/R/oaMessage/${lineID}/?สวัสดีทนาย`;
    
    alert('บันทึกข้อมูลสำเร็จ กำลังพาคุณไปที่ Line เพื่อแจ้งทนาย...');
    window.location.href = lineLink;
}

// --- Helper Functions ---
function showModal(modal) {
    modal.classList.remove('hidden');
}

function hideModal(modal) {
    modal.classList.add('hidden');
}
