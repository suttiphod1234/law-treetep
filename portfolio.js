document.addEventListener('DOMContentLoaded', async () => {
    // The same backend URL as used in main.js
    const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbz7KorIu3QzlGrjQC5Asuz8aXPg-S84sCul-1qIuveaB4M3WB1x1-Rc6XWfPmay0QtT/exec';
    
    const loadingEl = document.getElementById('portfolio-loading');
    const containerEl = document.getElementById('portfolio-container');
    
    try {
        const response = await fetch(`${BACKEND_URL}?action=get_portfolio`);
        const result = await response.json();
        
        loadingEl.style.display = 'none';
        
        if (result.status === 'success') {
            containerEl.style.display = 'flex';
            document.getElementById('filter-container').style.display = 'flex';
            
            let allPortfolioData = result.data;
            
            // Robust sorting to ensure newest dates are on top
            allPortfolioData.sort((a, b) => parseDate(b.date) - parseDate(a.date));
            
            renderPortfolio(allPortfolioData, containerEl);
            
            // Set up filter buttons
            const filterBtns = document.querySelectorAll('.filter-btn');
            filterBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // Update active class
                    filterBtns.forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    
                    const filterValue = e.target.getAttribute('data-filter');
                    
                    if (filterValue === 'all') {
                        renderPortfolio(allPortfolioData, containerEl);
                    } else {
                        const filteredData = allPortfolioData.filter(item => {
                            let cat = (item.category || '').toString().trim();
                            let fv = filterValue.trim();
                            
                            // Check exact match, partial match, or special case for accident category
                            if (cat === fv || cat.includes(fv) || fv.includes(cat)) return true;
                            
                            // Special variation handling for the accident / car category
                            if ((fv.includes('พ.ร.บ') || fv.includes('อุบัติเหตุ')) && 
                                (cat.includes('พ.ร.บ') || cat.includes('อุบัติเหตุ') || cat.includes('ชน'))) {
                                return true;
                            }
                            
                            return false;
                        });
                        renderPortfolio(filteredData, containerEl);
                    }
                });
            });
            
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
        
        const dateStr = formatThaiDate(item.date);
        
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
                <details class="answer-dropdown">
                    <summary>
                        <span><i class="fas fa-gavel fa-lg" style="margin-right: 8px;"></i> ดูคำแนะนำจากทนาย</span>
                        <i class="fas fa-chevron-down toggle-icon"></i>
                    </summary>
                    <div class="answer-box">
                        ${safeAnswer}
                    </div>
                </details>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function parseDate(dateInput) {
    if (!dateInput) return 0;
    
    // JS Date can directly parse ISO or MM/DD/YYYY
    const parsed = new Date(dateInput);
    if (!isNaN(parsed.getTime())) {
        return parsed.getTime();
    }
    
    // Fallback: Custom parse for DD/MM/YYYY text
    const str = dateInput.toString();
    const parts = str.split(/[\/\-]/);
    if (parts.length >= 3) {
        // [DD, MM, YYYY] => YYYY-MM-DD
        const customDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (!isNaN(customDate.getTime())) return customDate.getTime();
    }
    
    return 0;
}

function formatThaiDate(dateInput) {
    if (!dateInput) return '';
    
    let d = new Date(dateInput);
    
    if (isNaN(d.getTime())) {
        const str = dateInput.toString();
        const parts = str.split(/[\/\-]/);
        if (parts.length >= 3) {
            d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
    }
    
    if (isNaN(d.getTime())) return dateInput.toString();
    
    const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    
    const day = d.getDate();
    const month = thaiMonths[d.getMonth()];
    let year = d.getFullYear();
    
    if (year < 2500) {
        year += 543;
    }
    
    return `${day} ${month} พ.ศ. ${year}`;
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
