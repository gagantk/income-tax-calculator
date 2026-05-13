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
        oldStdDed: 50000,
        oldRebateLimit: 500000,
        oldRebateMax: 12500,
        newSlabs: [
            {limit: 400000, rate: 0}, {limit: 800000, rate: 0.05}, {limit: 1200000, rate: 0.10},
            {limit: 1600000, rate: 0.15}, {limit: 2000000, rate: 0.20}, {limit: 2400000, rate: 0.25},
            {limit: Infinity, rate: 0.30}
        ],
        newStdDed: 75000,
        newRebateLimit: 1200000,
        newRebateMax: 60000
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
        oldStdDed: 50000,
        oldRebateLimit: 500000,
        oldRebateMax: 12500,
        newSlabs: [
            {limit: 400000, rate: 0}, {limit: 800000, rate: 0.05}, {limit: 1200000, rate: 0.10},
            {limit: 1600000, rate: 0.15}, {limit: 2000000, rate: 0.20}, {limit: 2400000, rate: 0.25},
            {limit: Infinity, rate: 0.30}
        ],
        newStdDed: 75000,
        newRebateLimit: 1200000,
        newRebateMax: 60000
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

function computeSurcharge(taxableIncome, tax, slabs, regime) {
    if (taxableIncome <= 5000000) return 0;
    let rate = 0;
    if (taxableIncome <= 10000000) rate = 0.10;
    else if (taxableIncome <= 20000000) rate = 0.15;
    else if (taxableIncome <= 50000000) rate = 0.25;
    else rate = regime === 'new' ? 0.25 : 0.37;

    let surcharge = tax * rate;
    const thresholds = [{limit: 5000000, prevRate: 0}, {limit: 10000000, prevRate: 0.10}, {
        limit: 20000000,
        prevRate: 0.15
    }, {limit: 50000000, prevRate: 0.25}];
    for (const t of thresholds) {
        if (taxableIncome > t.limit && taxableIncome <= t.limit * 1.2) {
            const taxAtT = computeSlabTax(t.limit, slabs).totalTax;
            const scAtT = taxAtT * t.prevRate;
            const relief = (tax + surcharge) - (taxAtT + scAtT + (taxableIncome - t.limit));
            if (relief > 0) surcharge = Math.max(0, surcharge - relief);
        }
    }
    return surcharge;
}

function computeRebate(taxableIncome, tax, cfg, regime) {
    if (regime === 'new') {
        if (taxableIncome <= cfg.newRebateLimit) return Math.min(tax, cfg.newRebateMax);
        const marginal = taxableIncome - cfg.newRebateLimit;
        const taxAtLimit = computeSlabTax(cfg.newRebateLimit, cfg.newSlabs).totalTax;
        const rebateAtLimit = Math.min(taxAtLimit, cfg.newRebateMax);
        const taxPayableAtLimit = taxAtLimit - rebateAtLimit;
        if (tax > taxPayableAtLimit + marginal) return tax - (taxPayableAtLimit + marginal);
        return 0;
    }
    if (regime === 'old' && taxableIncome <= cfg.oldRebateLimit) {
        return Math.min(tax, cfg.oldRebateMax);
    }
    return 0;
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

    // Old Regime
    const oldTaxable = Math.max(0, gross - hraExempt - cfg.oldStdDed);
    const oldSlab = computeSlabTax(oldTaxable, cfg.oldSlabs);
    const oldRebate = computeRebate(oldTaxable, oldSlab.totalTax, cfg, 'old');
    const oldTaxAfterRebate = oldSlab.totalTax - oldRebate;
    const oldSurcharge = computeSurcharge(oldTaxable, oldTaxAfterRebate, cfg.oldSlabs, 'old');
    const oldCess = (oldTaxAfterRebate + oldSurcharge) * 0.04;
    const oldTotalTax = oldTaxAfterRebate + oldSurcharge + oldCess;

    // New Regime
    const newTaxable = Math.max(0, gross - cfg.newStdDed);
    const newSlab = computeSlabTax(newTaxable, cfg.newSlabs);
    const newRebate = computeRebate(newTaxable, newSlab.totalTax, cfg, 'new');
    const newTaxAfterRebate = newSlab.totalTax - newRebate;
    const newSurcharge = computeSurcharge(newTaxable, newTaxAfterRebate, cfg.newSlabs, 'new');
    const newCess = (newTaxAfterRebate + newSurcharge) * 0.04;
    const newTotalTax = newTaxAfterRebate + newSurcharge + newCess;

    // Update DOM — Old
    document.getElementById('old-hra-exempt').textContent = fmt(hraExempt);
    document.getElementById('old-std-ded').textContent = fmt(cfg.oldStdDed);
    document.getElementById('old-taxable').textContent = fmt(oldTaxable);
    renderSlabs('old-slab-body', oldSlab.breakdown);

    const oldRebateRow = document.getElementById('old-rebate-row');
    const oldSurchargeRow = document.getElementById('old-surcharge-row');
    if (oldRebate > 0) {
        oldRebateRow.style.display = '';
        document.getElementById('old-rebate').textContent = fmt(oldRebate);
        oldSurchargeRow.style.marginTop = '0';
    } else {
        oldRebateRow.style.display = 'none';
        oldSurchargeRow.style.marginTop = '0.4rem';
    }
    document.getElementById('old-surcharge').textContent = fmt(oldSurcharge);
    document.getElementById('old-cess').textContent = fmt(oldCess);
    document.getElementById('old-total-tax').textContent = fmt(oldTotalTax);

    // Update DOM — New
    document.getElementById('new-std-ded').textContent = fmt(cfg.newStdDed);
    document.getElementById('new-taxable').textContent = fmt(newTaxable);
    renderSlabs('new-slab-body', newSlab.breakdown);

    const newRebateRow = document.getElementById('new-rebate-row');
    const newSurchargeRow = document.getElementById('new-surcharge-row');
    if (newRebate > 0) {
        newRebateRow.style.display = '';
        document.getElementById('new-rebate').textContent = fmt(newRebate);
        newSurchargeRow.style.marginTop = '0';
    } else {
        newRebateRow.style.display = 'none';
        newSurchargeRow.style.marginTop = '0.4rem';
    }
    document.getElementById('new-surcharge').textContent = fmt(newSurcharge);
    document.getElementById('new-cess').textContent = fmt(newCess);
    document.getElementById('new-total-tax').textContent = fmt(newTotalTax);

    // Verdict
    const diff = Math.abs(oldTotalTax - newTotalTax);
    const vh = document.getElementById('verdict-header');
    const vt = document.getElementById('verdict-text');
    const va = document.getElementById('verdict-amount');
    if (newTotalTax < oldTotalTax) {
        vh.className = 'verdict-header new-wins';
        vt.textContent = 'New Regime saves you';
        va.textContent = fmt(diff);
    } else if (oldTotalTax < newTotalTax) {
        vh.className = 'verdict-header old-wins';
        vt.textContent = 'Old Regime saves you';
        va.textContent = fmt(diff);
    } else {
        vh.className = 'verdict-header new-wins';
        vt.textContent = 'Both regimes are equal';
        va.textContent = '';
    }
    document.getElementById('v-old-tax').textContent = fmt(oldTotalTax);
    document.getElementById('v-old-eff').textContent = 'Effective: ' + (gross > 0 ? (oldTotalTax / gross * 100).toFixed(2) : '0') + '%';
    document.getElementById('v-new-tax').textContent = fmt(newTotalTax);
    document.getElementById('v-new-eff').textContent = 'Effective: ' + (gross > 0 ? (newTotalTax / gross * 100).toFixed(2) : '0') + '%';
}

document.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('input', calculate);
    el.addEventListener('change', calculate);
});

calculate();

document.getElementById('themeToggle').addEventListener('click', function () {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('tax-calc-theme', 'light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('tax-calc-theme', 'dark');
    }
});