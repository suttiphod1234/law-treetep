const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbytNdDjhtEU6qaufO_zHYUgLlSXu0dbsDELJVHUy-TRd8JoDNmcggpCExlitjq98E2n/exec';

document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login-btn');
    const loginSection = document.getElementById('login-section');
    const loadingSection = document.getElementById('loading-section');
    const historySection = document.getElementById('history-section');

    // Check if coming back from LINE OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
        // UI Transition
        loginSection.style.display = 'none';
        loadingSection.style.display = 'block';
        
        // Remove code from URL to clean it up visually
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Fetch History
        fetchHistory(code);
    }

    loginBtn.addEventListener('click', () => {
        Swal.fire({
            icon: 'info',
            title: 'เชื่อมต่อ LINE',
            text: 'ระบบกำลังพาคุณไปล็อคอินบัญชี LINE เพื่อดึงข้อมูลประวัติส่วนตัว...',
            timer: 2000,
            showConfirmButton: false,
            allowOutsideClick: false
        }).then(() => {
            const clientId = '2009590576';
            const redirectUri = encodeURIComponent('https://suttiphod1234.github.io/law-treetep/history.html');
            const lineLoginUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=history&scope=profile%20openid`;
            window.location.href = lineLoginUrl;
        });
    });

    async function fetchHistory(authCode) {
        try {
            const response = await fetch(`${BACKEND_URL}?action=get_history&code=${authCode}`);
            const result = await response.json();
            
            loadingSection.style.display = 'none';
            historySection.style.display = 'block';

            if (result.status === 'success') {
                renderHistory(result.data);
            } else {
                throw new Error(result.message || 'Unknown Error');
            }
        } catch (error) {
            loadingSection.style.display = 'none';
            loginSection.style.display = 'block'; // Show login again so they can retry
            console.error('Error fetching history:', error);
            Swal.fire({
                icon: 'error',
                title: 'ดึงข้อมูลไม่สำเร็จ',
                text: 'ไม่สามารถดึงข้อมูลประวัติการปรึกษาได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง',
                confirmButtonColor: '#d32f2f'
            });
        }
    }

    function renderHistory(groupedData) {
        historySection.innerHTML = ''; // Clear

        const categories = Object.keys(groupedData);
        
        if (categories.length === 0) {
            historySection.innerHTML = `
                <div class="empty-history">
                    <i class="fas fa-folder-open fa-3x" style="margin-bottom: 1rem; color: #ccc;"></i>
                    <h4>ไม่พบประวัติการเข้าใช้งาน</h4>
                    <p>คุณยังไม่มีประวัติการสอบถามหรือใช้บริการใดๆ ในระบบครับ</p>
                </div>
            `;
            return;
        }

        // Loop through categories
        categories.forEach(category => {
            const items = groupedData[category];
            if (!items || items.length === 0) return;

            // Create Category Wrapper
            const catDiv = document.createElement('div');
            catDiv.className = 'history-group';
            
            // Category Title
            const catTitle = document.createElement('h4');
            catTitle.className = 'history-group-title';
            catTitle.innerHTML = `<i class="fas fa-bookmark"></i> หมวด: ${category} <span style="font-size: 0.9rem; color:#666; font-weight:normal;">(${items.length} รายการ)</span>`;
            catDiv.appendChild(catTitle);

            // Create Cards for items
            items.forEach(item => {
                const card = document.createElement('div');
                card.className = 'history-card';
                
                // Format Date
                const dateObj = new Date(item.date);
                const dateStr = !isNaN(dateObj) ? dateObj.toLocaleDateString('th-TH', {
                    year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                }) : 'ไม่ระบุวันที่';

                // Determine badge type
                const isPrivate = item.type === 'private';
                const badgeClass = isPrivate ? 'type-private' : 'type-free';
                const badgeText = isPrivate ? '<i class="fas fa-star"></i> ทนายส่วนตัว (Private)' : '<i class="fas fa-comment"></i> บริการฟรี';

                card.innerHTML = `
                    <div class="history-type-badge ${badgeClass}">${badgeText}</div>
                    <div class="history-date"><i class="far fa-clock"></i> ${dateStr}</div>
                    <div class="history-message">
                        <strong>เรื่อง:</strong> <br>
                        ${item.message.replace(/\\n/g, '<br>')}
                    </div>
                `;
                catDiv.appendChild(card);
            });

            historySection.appendChild(catDiv);
        });
    }
});
