// ============ NAVBAR SCROLL EFFECT ============
const navbar = document.getElementById('navbar');
const backToTop = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    if (window.scrollY > 400) {
        backToTop.classList.add('show');
    } else {
        backToTop.classList.remove('show');
    }
});

// ============ MOBILE NAV TOGGLE ============
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// Close mobile nav on link click
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
});

// ============ ACTIVE NAV LINK ON SCROLL ============
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset + 100;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-links a').forEach(a => {
                a.classList.remove('active');
                if (a.getAttribute('href') === '#' + sectionId) {
                    a.classList.add('active');
                }
            });
        }
    });
});

// ============ LIVE CLOCK ============
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('liveClock').textContent = `${hours}:${minutes}:${seconds}`;

    const bnMonths = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
        'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
    const bnDays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

    const dateStr = `${bnDays[now.getDay()]}, ${now.getDate()} ${bnMonths[now.getMonth()]} ${now.getFullYear()}`;
    document.getElementById('liveDate').textContent = dateStr;
}

updateClock();
setInterval(updateClock, 1000);

// ============ NEWSLETTER ============
document.getElementById('newsletterForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input').value;
    if (email) {
        alert('শুকরিয়া! আপনি সফলভাবে নিউজলেটারে সাবস্ক্রাইব করেছেন।');
        e.target.reset();
    }
});

// ============ TESTIMONIALS SLIDER ============
let currentSlide = 1;
const totalSlides = 3;
const dots = document.querySelectorAll('.dot');
const cards = document.querySelectorAll('.testimonial-card');

function setSlide(index) {
    currentSlide = index;
    cards.forEach((card, i) => {
        card.classList.toggle('active', i === index);
    });
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });

    // Scroll on mobile
    if (window.innerWidth <= 768) {
        cards[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

document.getElementById('prevBtn').addEventListener('click', () => {
    setSlide(currentSlide > 0 ? currentSlide - 1 : totalSlides - 1);
});

document.getElementById('nextBtn').addEventListener('click', () => {
    setSlide(currentSlide < totalSlides - 1 ? currentSlide + 1 : 0);
});

dots.forEach((dot, i) => {
    dot.addEventListener('click', () => setSlide(i));
});

// ============ HISAB (INCOME/EXPENSE) - LIVE FROM GOOGLE SHEET ============
const SHEET_ID = '1uMZ36fbl7gjTe3FCqxn4GoEXAvxqaaAJLAHla9WC3mg';
const SHEET_GID = 1; // Sheet2 (English version)
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${SHEET_GID}&headers=1`;

let musalliData = [];
let monthColumns = [];
const toBn = n => n.toString().replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);

// Fetch live data from Google Sheet (supports both server & local file:// via JSONP fallback)
async function fetchSheetData() {
    const badge = document.getElementById('hisabLiveBadge');
    try {
        let text;

        // Try fetch first, fallback to JSONP for local file:// or CORS issues
        try {
            const response = await fetch(SHEET_URL);
            if (!response.ok) throw new Error('HTTP ' + response.status);
            text = await response.text();
        } catch (fetchErr) {
            // Fallback: JSONP approach for local file:// protocol
            text = await new Promise((resolve, reject) => {
                const callbackName = 'sheetCallback_' + Date.now();
                const script = document.createElement('script');
                script.src = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=responseHandler:${callbackName}&gid=${SHEET_GID}&headers=1`;
                window[callbackName] = function(data) {
                    delete window[callbackName];
                    if (document.head.contains(script)) document.head.removeChild(script);
                    resolve('google.visualization.Query.setResponse(' + JSON.stringify(data) + ')');
                };
                script.onerror = () => {
                    delete window[callbackName];
                    document.head.removeChild(script);
                    reject(new Error('JSONP failed'));
                };
                document.head.appendChild(script);
            });
        }

        // Google returns JSONP-like: google.visualization.Query.setResponse({...})
        const jsonStr = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);?/);
        if (!jsonStr) throw new Error('Invalid response format');

        const data = JSON.parse(jsonStr[1]);
        const table = data.table;
        const cols = table.cols;
        const rows = table.rows;

        // Sheet structure:
        // Col A (index 0) = Name (string)
        // Col B (index 1) = মাসিক চাঁদা / contribution amount (number)
        // Col C-N (index 2-13) = জানুয়ারি - ডিসেম্বর (string, may have data later)

        // Map English month names to Bengali for display
        const monthNameMap = {
            'january': 'জানুয়ারি', 'february': 'ফেব্রুয়ারি', 'march': 'মার্চ',
            'april': 'এপ্রিল', 'may': 'মে', 'june': 'জুন',
            'july': 'জুলাই', 'august': 'আগস্ট', 'september': 'সেপ্টেম্বর',
            'october': 'অক্টোবর', 'november': 'নভেম্বর', 'december': 'ডিসেম্বর'
        };
        const bnMonthNames = Object.values(monthNameMap);

        // With headers=1, row 1 is used as header.
        // Remaining rows include: committee names (top), then a header row
        // like "Name, Monthly Donation, January...", then data, then total.
        // We need to find month columns from the cols labels OR detect them.

        // Try to find month columns from cols (index 2+ may have month labels)
        monthColumns = [];
        for (let i = 2; i < cols.length; i++) {
            const rawLabel = (cols[i].label || '').trim();
            if (rawLabel) {
                const bnLabel = monthNameMap[rawLabel.toLowerCase()] || rawLabel;
                monthColumns.push({ index: i, label: bnLabel, rawLabel });
            }
        }

        // Fallback: if columns don't have month labels, scan for a header row in data
        if (monthColumns.length === 0) {
            for (const row of rows) {
                const cells = row.c;
                if (!cells || !cells[0]) continue;
                const val = String(cells[0].v || '').trim().toLowerCase();
                if (val === 'name' || val === 'নাম') {
                    // This is a header row - extract month names from it
                    for (let i = 2; i < cells.length; i++) {
                        const cellVal = cells[i] ? String(cells[i].v || '').trim() : '';
                        if (cellVal) {
                            const bnLabel = monthNameMap[cellVal.toLowerCase()] || cellVal;
                            monthColumns.push({ index: i, label: bnLabel, rawLabel: cellVal });
                        }
                    }
                    break;
                }
            }
        }

        // Final fallback
        if (monthColumns.length === 0) {
            for (let i = 2; i < cols.length && (i - 2) < 12; i++) {
                monthColumns.push({ index: i, label: bnMonthNames[i - 2], rawLabel: '' });
            }
        }

        // Words to skip (header rows, non-person entries)
        const skipWords = ['name', 'নাম', 'monthly donation', 'মাসিক চাঁদা'];

        // Parse all rows — separate musalli data from the total row
        musalliData = [];
        window._sheetTotals = {}; // totals from "Total Ammout" row

        for (const row of rows) {
            const cells = row.c;
            if (!cells || !cells[0] || !cells[0].v) continue;

            const name = String(cells[0].v).trim();
            if (!name) continue;

            // Capture the "Total Ammout" row for monthly totals
            if (name.toLowerCase().includes('total')) {
                for (const mc of monthColumns) {
                    const cell = cells[mc.index];
                    window._sheetTotals[mc.label] = cell ? (parseFloat(cell.v) || 0) : 0;
                }
                // Also get total from col B
                window._sheetTotals._colB = cells[1] ? (parseFloat(cells[1].v) || 0) : 0;
                continue;
            }

            // Skip header rows
            if (skipWords.some(w => name.toLowerCase().includes(w))) continue;

            // Column B (index 1) = fixed monthly donation amount
            const monthlyAmount = cells[1] ? (parseFloat(cells[1].v) || 0) : 0;

            const musalli = { name, monthlyAmount, months: {}, monthStatus: {} };
            let hasAnyPayment = false;

            // Read month columns (C onwards, index 2+)
            for (const mc of monthColumns) {
                const cell = cells[mc.index];
                let status = 'empty';
                let amount = 0;

                if (cell && cell.v !== null && cell.v !== undefined) {
                    const raw = cell.v;
                    const rawStr = String(raw).trim().toLowerCase();

                    // Boolean true/false (checkbox or dropdown)
                    if (raw === true || rawStr === 'true' || rawStr === 'yes' || rawStr === 'হ্যাঁ' || rawStr === 'y') {
                        status = 'yes';
                        amount = 0;
                    } else if (raw === false || rawStr === 'false' || rawStr === 'no' || rawStr === 'না' || rawStr === 'n') {
                        status = 'no';
                        amount = 0;
                    } else {
                        // Number
                        const num = parseFloat(raw);
                        if (!isNaN(num) && num > 0) {
                            status = 'number';
                            amount = num;
                        }
                    }
                }

                musalli.months[mc.label] = amount;
                musalli.monthStatus[mc.label] = status;
                if (status === 'yes' || status === 'number') hasAnyPayment = true;
            }

            musalli.totalPaid = Object.values(musalli.months).reduce((s, v) => s + v, 0);
            musalli.hasPaid = hasAnyPayment || monthlyAmount > 0;
            musalliData.push(musalli);
        }

        // Update summary cards
        updateSummaryCards();

        // Build dynamic table header
        buildTableHeader();

        // Render table
        renderHisabTable();

        // Update badge
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        badge.innerHTML = `<i class="fas fa-check-circle"></i> লাইভ ডেটা লোড সফল — সর্বশেষ আপডেট: ${timeStr}`;
        badge.className = 'hisab-live-badge success';

    } catch (error) {
        console.error('Sheet fetch error:', error);
        const badge = document.getElementById('hisabLiveBadge');
        badge.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ডেটা লোড ব্যর্থ। ইন্টারনেট সংযোগ চেক করুন। <button onclick="fetchSheetData()" style="margin-left:8px;padding:3px 10px;border:1px solid #721c24;border-radius:4px;background:transparent;color:inherit;cursor:pointer;">পুনরায় চেষ্টা</button>`;
        badge.className = 'hisab-live-badge error';
    }
}

function updateSummaryCards() {
    const totals = window._sheetTotals || {};
    const total = musalliData.length;
    const paid = musalliData.filter(m => m.hasPaid).length;
    const unpaid = total - paid;

    // Grand total from sheet's Total row (col B)
    const grandTotal = Object.entries(totals)
        .filter(([k]) => k !== '_colB')
        .reduce((s, [, v]) => s + v, 0);

    document.getElementById('statTotal').textContent = toBn(total);
    document.getElementById('statPaid').textContent = toBn(paid);
    document.getElementById('statCollection').textContent = '৳' + toBn(grandTotal.toLocaleString());
    document.getElementById('statUnpaid').textContent = toBn(unpaid) + ' জন';

    // Build monthly totals chips — directly from sheet's Total row
    const monthlyTotalsEl = document.getElementById('monthlyTotals');
    let chipsHtml = '';

    for (const mc of monthColumns) {
        const monthTotal = totals[mc.label] || 0;

        if (monthTotal > 0) {
            chipsHtml += `
                <div class="month-total-chip">
                    <div class="chip-icon"><i class="fas fa-calendar-check"></i></div>
                    <div class="chip-info">
                        <span class="chip-month">${mc.label}</span>
                        <span class="chip-amount">৳${toBn(monthTotal.toLocaleString())}</span>
                    </div>
                </div>`;
        }
    }

    monthlyTotalsEl.innerHTML = chipsHtml;
}

function buildTableHeader() {
    const thead = document.getElementById('hisabThead');

    // Find the last month that has any data
    let lastActiveIndex = -1;
    monthColumns.forEach((mc, idx) => {
        if (musalliData.some(m => m.monthStatus[mc.label] !== 'empty')) {
            lastActiveIndex = idx;
        }
    });

    // Show all months from first to the last active one (so user can see the full range)
    // If no data yet, show first month
    const displayMonths = lastActiveIndex >= 0
        ? monthColumns.slice(0, lastActiveIndex + 1)
        : monthColumns.slice(0, 1);

    let headerHtml = '<tr><th>ক্রম</th><th>নাম</th><th>মাসিক চাঁদা (৳)</th>';
    for (const mc of displayMonths) {
        headerHtml += `<th>${mc.label}</th>`;
    }
    if (displayMonths.length > 1) {
        headerHtml += '<th>মোট (৳)</th>';
    }
    headerHtml += '</tr>';
    thead.innerHTML = headerHtml;

    // Store for render use
    window._displayMonths = displayMonths;
}

// Hisab Tabs
document.querySelectorAll('.hisab-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.hisab-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.hisab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.htab).classList.add('active');
    });
});

// Render Hisab Table
function renderHisabTable(filter = 'all', search = '') {
    const tbody = document.querySelector('#hisabTable tbody');
    const searchLower = search.toLowerCase();
    const displayMonths = window._displayMonths || [];
    const colSpan = 4 + displayMonths.length + (displayMonths.length > 1 ? 1 : 0);

    let filtered = musalliData.filter(m => {
        const matchSearch = !search || m.name.toLowerCase().includes(searchLower);
        const matchFilter = filter === 'all' ||
            (filter === 'paid' && m.hasPaid) ||
            (filter === 'unpaid' && !m.hasPaid);
        return matchSearch && matchFilter;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${colSpan}" style="text-align:center;padding:30px;color:#999;font-family:'Noto Sans Bengali',sans-serif;">কোনো তথ্য পাওয়া যায়নি</td></tr>`;
        document.getElementById('hisabShowing').textContent = '০ জন মুসল্লি দেখানো হচ্ছে';
        return;
    }

    // Data rows
    let rowsHtml = filtered.map((m, i) => {
        let rowHtml = `<td>${toBn(i + 1)}</td>`;
        rowHtml += `<td><strong>${m.name}</strong></td>`;
        rowHtml += `<td>${m.monthlyAmount > 0 ? '৳' + toBn(m.monthlyAmount.toLocaleString()) : '—'}</td>`;

        for (const mc of displayMonths) {
            const status = m.monthStatus[mc.label] || 'empty';
            const amount = m.months[mc.label] || 0;

            if (status === 'yes') {
                rowHtml += `<td><span class="hisab-month-yes"><i class="fas fa-check-circle"></i> হ্যাঁ</span></td>`;
            } else if (status === 'no') {
                rowHtml += `<td><span class="hisab-month-no"><i class="fas fa-times-circle"></i> না</span></td>`;
            } else if (status === 'number') {
                rowHtml += `<td><strong>৳${toBn(amount.toLocaleString())}</strong></td>`;
            } else {
                rowHtml += `<td><span class="hisab-month-empty">—</span></td>`;
            }
        }

        if (displayMonths.length > 1) {
            rowHtml += `<td><strong>${m.totalPaid > 0 ? '৳' + toBn(m.totalPaid.toLocaleString()) : '—'}</strong></td>`;
        }

        return `<tr>${rowHtml}</tr>`;
    }).join('');

    // Monthly total footer row — from sheet's Total row
    const totals = window._sheetTotals || {};
    let footerRow = `<td colspan="3" style="text-align:right;font-weight:700;background:#f8f9fa;">মোট সংগ্রহ:</td>`;
    let grandTotal = 0;
    for (const mc of displayMonths) {
        const monthTotal = totals[mc.label] || 0;
        grandTotal += monthTotal;
        footerRow += `<td style="font-weight:700;background:#f8f9fa;color:var(--gold-dark);">৳${toBn(monthTotal.toLocaleString())}</td>`;
    }
    if (displayMonths.length > 1) {
        footerRow += `<td style="font-weight:700;background:#f8f9fa;color:var(--gold-dark);">৳${toBn(grandTotal.toLocaleString())}</td>`;
    }
    rowsHtml += `<tr class="hisab-total-row">${footerRow}</tr>`;

    tbody.innerHTML = rowsHtml;

    document.getElementById('hisabShowing').textContent = `${toBn(filtered.length)} জন মুসল্লি দেখানো হচ্ছে`;

    const sheetGrandTotal = Object.entries(window._sheetTotals || {})
        .filter(([k]) => k !== '_colB')
        .reduce((s, [, v]) => s + v, 0);
    document.getElementById('hisabTotalBadge').textContent = '৳' + toBn(sheetGrandTotal.toLocaleString());
}

// Hisab Filters
let currentHisabFilter = 'all';
document.querySelectorAll('.hisab-filter').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.hisab-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentHisabFilter = btn.dataset.filter;
        renderHisabTable(currentHisabFilter, document.getElementById('hisabSearch').value);
    });
});

// Hisab Search
document.getElementById('hisabSearch').addEventListener('input', (e) => {
    renderHisabTable(currentHisabFilter, e.target.value);
});

// Initial fetch
fetchSheetData();

// Auto-refresh every 5 minutes
setInterval(fetchSheetData, 5 * 60 * 1000);

// ============ SMOOTH REVEAL ON SCROLL ============
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.service-card, .activity-card, .about-item, .testimonial-card, .report-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});
