document.addEventListener('DOMContentLoaded', async () => {
    // The same backend URL as used in main.js
    const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbzo_DnCgI-wJxNyzuEbMAskgRX1EsssKBUzySXd4cvoa9xIBbuWHkyzdE4g4OmSZaLT/exec';
    
    const loadingEl = document.getElementById('portfolio-loading');
    const containerEl = document.getElementById('portfolio-container');
    
    try {
        const response = await fetch(`${BACKEND_URL}?action=get_portfolio`);
        const result = await response.json();
        
        loadingEl.style.display = 'none';
        containerEl.style.display = 'flex';
        
        if (result.status === 'success') {
            renderPortfolio(result.data, containerEl);
        } else {
            throw new Error(result.message || 'Error fetching data');
        }
    } catch (error) {
        console.error('Error:', error);
        loadingEl.innerHTML = `
            <div style="color: #d32f2f; background: #ffebee; padding: 2rem; border-radius: 12px; display: inline-block;">
                <i class="fas fa-exclamation-circle fa-3x" style="margin-bottom: 1rem;"></i>
                <h4 style="margin-bottom: 0.5rem;">ไม่สามารถโหลดข้อมูลได้</h4>
                <p>กรุณาลองใหม่อีกครั้งในภายหลัง หรือตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</p>
            </div>
        `;
    }
});

function renderPortfolio(data, container) {
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 4rem 2rem; border: 2px dashed #ddd; border-radius: 16px; color: #888; background: #fafafa;">
                <i class="fas fa-folder-open fa-4x" style="margin-bottom: 1.5rem; color: #ccc;"></i>
                <h3 style="margin-bottom: 0.5rem; color: #555;">ยังไม่มีข้อมูลผลงาน</h3>
                <p>เมื่อทนายความได้ทำการตอบข้อซักถาม ข้อมูลจะมาแสดงที่นี่ครับ</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    
    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'qa-card';
        
        const dateObj = new Date(item.date);
        const dateStr = !isNaN(dateObj) ? dateObj.toLocaleDateString('th-TH', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }) : '';
        
        // Safety sanitization
        const safeQuestion = escapeHtml(item.question).replace(/\n/g, '<br>');
        const safeAnswer = escapeHtml(item.answer).replace(/\n/g, '<br>');
        const safeName = escapeHtml(item.clientName || 'คุณลูกค้า');
        const safeCat = escapeHtml(item.category || '');

        card.innerHTML = `
            <div class="qa-meta">
                <span class="cat-badge">
                    <i class="fas fa-tag"></i> หมวด: ${safeCat}
                </span>
                <span class="qa-date">
                    <i class="far fa-calendar-alt"></i> ${dateStr}
                </span>
            </div>
            
            <div class="qa-section">
                <h4 class="q-title">
                    <i class="fas fa-user-circle fa-lg" style="color: #9e9e9e;"></i> คำถามจาก ${safeName}
                </h4>
                <div class="question-box">
                    ${safeQuestion}
                </div>
            </div>
            
            <div class="qa-section" style="margin-bottom: 0;">
                <h4 class="a-title">
                    <i class="fas fa-gavel fa-lg"></i> คำแนะนำจากทนาย
                </h4>
                <div class="answer-box">
                    ${safeAnswer}
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
