const FY_DATA = {
    '2025-26': {
        ay: '2026-27',
        metroCities: ['Delhi', 'Mumbai', 'Kolkata', 'Chennai'],
        oldSlabs: [
            {limit: 250000, rate: 0}, {limit: 500000, rate: 0.05}, {limit: 1000000, rate: 0.20}, {
                limit: Infinity,
                rate: 0.30
            }
        ],
        oldStdDed: 50000
    },
    '2026-27': {
        ay: '2027-28',
        metroCities: ['Delhi', 'Mumbai', 'Kolkata', 'Chennai', 'Bangalore', 'Hyderabad', 'Pune', 'Ahmedabad'],
        oldSlabs: [
            {limit: 250000, rate: 0}, {limit: 500000, rate: 0.05}, {limit: 1000000, rate: 0.20}, {
                limit: Infinity,
                rate: 0.30
            }
        ],
        oldStdDed: 50000
    }
};

function fmt(n) {
    return '₹' + new Intl.NumberFormat('en-IN').format(Math.round(n));
}

function readNum(id) {
    return parseFloat(document.getElementById(id).value) || 0;
}

function computeSlabTax(income, slabs) {
    let remaining = income, totalTax = 0, prevLimit = 0;
    const breakdown = [];
    for (const slab of slabs) {
        const width = slab.limit === Infinity ? remaining : slab.limit - prevLimit;
        const taxable = Math.max(0, Math.min(remaining, width));
        const tax = taxable * slab.rate;
        breakdown.push({
            from: prevLimit,
            to: slab.limit === Infinity ? prevLimit + taxable : slab.limit,
            rate: slab.rate,
            taxable,
            tax
        });
        totalTax += tax;
        remaining -= taxable;
        prevLimit = slab.limit === Infinity ? prevLimit + taxable : slab.limit;
        if (remaining <= 0) break;
    }
    return {totalTax, breakdown};
}

function renderSlabs(tbodyId, breakdown) {
    const tbody = document.getElementById(tbodyId);
    tbody.innerHTML = '';
    for (const s of breakdown) {
        const tr = document.createElement('tr');
        if (s.tax === 0) tr.classList.add('zero');
        tr.innerHTML = `<td>${fmt(s.from)} – ${s.to === Infinity ? 'Above' : fmt(s.to)}</td><td>${(s.rate * 100).toFixed(0)}%</td><td>${fmt(s.tax)}</td>`;
        tbody.appendChild(tr);
    }
}

function calculate() {
    const fy = document.getElementById('fySelect').value;
    const cfg = FY_DATA[fy];
    document.getElementById('headerNote').textContent = `FY ${fy} · AY ${cfg.ay}`;

    // Read Inputs
    const basic = readNum('inBasic');
    const hra = readNum('inHRA');
    const otherFlex = readNum('inOther');
    const monthlyRent = readNum('inRent');
    const city = document.getElementById('inCity').value;

    const gross = basic + hra + otherFlex;

    // HRA Calculation
    const isMetro = cfg.metroCities.includes(city);
    const annualRent = monthlyRent * 12;
    let hraExempt = 0;

    if (annualRent > 0 && basic > 0) {
        const cityPct = isMetro ? 0.5 : 0.4;
        const hraComp1 = hra;
        const hraComp2 = basic * cityPct;
        const hraComp3 = annualRent - (basic * 0.1);
        hraExempt = Math.max(0, Math.min(hraComp1, hraComp2, hraComp3));
    }

    // Taxable Income Calculation
    const oldTaxable = Math.max(0, gross - hraExempt - cfg.oldStdDed);
    const oldSlab = computeSlabTax(oldTaxable, cfg.oldSlabs);

    // Update DOM
    document.getElementById('old-hra-exempt').textContent = fmt(hraExempt);
    document.getElementById('old-std-ded').textContent = fmt(cfg.oldStdDed);
    document.getElementById('old-taxable').textContent = fmt(oldTaxable);
    renderSlabs('old-slab-body', oldSlab.breakdown);
    document.getElementById('old-total-tax').textContent = fmt(oldSlab.totalTax);
}

document.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', calculate);
    el.addEventListener('change', calculate);
});

calculate();