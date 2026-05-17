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

function readNum(id, max) {
    const v = parseFloat(document.getElementById(id).value) || 0;
    return max != null ? Math.min(v, max) : v;
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
    const varRaw = varMode === 'pct' ? readNum('inVar', 100) : readNum('inVar');
    const pfPct = readNum('inPFPct', 100);
    const employerNPS = readNum('inEmployerNPS');
    const addlIncome = readNum('inAddlIncome');
    const savingsInt = readNum('inSavingsInt');
    const monthlyRent = readNum('inRent');
    const city = document.getElementById('inCity').value;

    const exemptAllow = readNum('inExemptAllow', otherFlex);
    const sec80C = readNum('in80C', 150000);
    const sec80Dself = readNum('in80Dself', 25000);
    const parentMax = parentAge === 'above60' ? 50000 : 25000;
    const sec80Dparents = readNum('in80Dparents', parentMax);
    const sec80CCD = readNum('in80CCD', 50000);
    const sec80E = readNum('in80E');
    const sec80EEA = readNum('in80EEA', 150000);
    const sec80Gded = readNum('in80G') * donationRate / 100;
    const ddMax = disabilityLevel === 'severe' ? 125000 : 75000;
    const sec80DD = readNum('in80DD', ddMax);
    const ddbMax = ddbAge === 'above60' ? 100000 : 40000;
    const sec80DDB = readNum('in80DDB', ddbMax);
    const oldViaTotal = sec80C + sec80Dself + sec80Dparents + sec80CCD + sec80E + sec80EEA + sec80Gded + sec80DD + sec80DDB;
    const sec24b = readNum('in24b', 200000);
    const profTax = readNum('inProfTax', 2500);

    const basePay = basic + hra + otherFlex;
    const variable = varMode === 'pct' ? basePay * varRaw / 100 : varRaw;
    const employeePF = basic * pfPct / 100;
    const employerPF = basic * pfPct / 100;
    const gross = basePay + variable + addlIncome;
    const ctc = gross + employerPF + employerNPS;
    const sec80CCD2 = Math.min(employerNPS, basic * 0.14);
    const sec80TTA = Math.min(savingsInt, 10000);

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
    const oldTaxable = Math.max(0, gross + employerNPS + savingsInt - hraExempt - exemptAllow - cfg.oldStdDed - profTax - sec24b - oldViaTotal - sec80CCD2 - sec80TTA);
    const oldSlab = computeSlabTax(oldTaxable, cfg.oldSlabs);
    const oldRebate = computeRebate(oldTaxable, oldSlab.totalTax, cfg, 'old');
    const oldTaxAfterRebate = oldSlab.totalTax - oldRebate;
    const oldSurcharge = computeSurcharge(oldTaxable, oldTaxAfterRebate, cfg.oldSlabs, 'old');
    const oldCess = (oldTaxAfterRebate + oldSurcharge) * 0.04;
    const oldTotalTax = oldTaxAfterRebate + oldSurcharge + oldCess;

    // New Regime
    const newTaxable = Math.max(0, gross + employerNPS + savingsInt - cfg.newStdDed - sec80CCD2);
    const newSlab = computeSlabTax(newTaxable, cfg.newSlabs);
    const newRebate = computeRebate(newTaxable, newSlab.totalTax, cfg, 'new');
    const newTaxAfterRebate = newSlab.totalTax - newRebate;
    const newSurcharge = computeSurcharge(newTaxable, newTaxAfterRebate, cfg.newSlabs, 'new');
    const newCess = (newTaxAfterRebate + newSurcharge) * 0.04;
    const newTotalTax = newTaxAfterRebate + newSurcharge + newCess;

    // Update DOM — Computed Strip
    document.getElementById('cBasePay').textContent = fmt(basePay);
    document.getElementById('cVariable').textContent = fmt(variable);
    document.getElementById('cGross').textContent = fmt(gross);
    document.getElementById('cEePF').textContent = fmt(employeePF);
    document.getElementById('cErPF').textContent = fmt(employerPF);
    const addlWrap = document.getElementById('cAddlWrap');
    if (addlIncome > 0) {
        addlWrap.style.display = '';
        document.getElementById('cAddlIncome').textContent = fmt(addlIncome);
    } else {
        addlWrap.style.display = 'none';
    }
    const erNPSWrap = document.getElementById('cErNPSWrap');
    if (employerNPS > 0) {
        erNPSWrap.style.display = '';
        document.getElementById('cErNPS').textContent = fmt(employerNPS);
    } else {
        erNPSWrap.style.display = 'none';
    }
    const savIntWrap = document.getElementById('cSavIntWrap');
    if (savingsInt > 0) {
        savIntWrap.style.display = '';
        document.getElementById('cSavInt').textContent = fmt(savingsInt);
    } else {
        savIntWrap.style.display = 'none';
    }
    document.getElementById('cCTC').textContent = fmt(ctc);

    // Update DOM — 80CCD(2) rows
    const old80ccd2Row = document.getElementById('old-80ccd2-row');
    const new80ccd2Row = document.getElementById('new-80ccd2-row');
    if (sec80CCD2 > 0) {
        old80ccd2Row.style.display = '';
        new80ccd2Row.style.display = '';
        document.getElementById('old-80ccd2').textContent = fmt(sec80CCD2);
        document.getElementById('new-80ccd2').textContent = fmt(sec80CCD2);
    } else {
        old80ccd2Row.style.display = 'none';
        new80ccd2Row.style.display = 'none';
    }

    // Update DOM — Savings Interest income rows
    const oldSavIntRow = document.getElementById('old-savings-int-row');
    const newSavIntRow = document.getElementById('new-savings-int-row');
    const old80ttaRow = document.getElementById('old-80tta-row');
    if (savingsInt > 0) {
        oldSavIntRow.style.display = '';
        newSavIntRow.style.display = '';
        document.getElementById('old-savings-int').textContent = fmt(savingsInt);
        document.getElementById('new-savings-int').textContent = fmt(savingsInt);
        old80ttaRow.style.display = '';
        document.getElementById('old-80tta').textContent = fmt(sec80TTA);
    } else {
        oldSavIntRow.style.display = 'none';
        newSavIntRow.style.display = 'none';
        old80ttaRow.style.display = 'none';
    }

    // Update DOM — Old
    document.getElementById('old-hra-exempt').textContent = fmt(hraExempt);
    document.getElementById('old-exempt-allow').textContent = fmt(exemptAllow);
    document.getElementById('old-std-ded').textContent = fmt(cfg.oldStdDed);
    document.getElementById('old-prof-tax').textContent = fmt(profTax);
    document.getElementById('old-24b').textContent = fmt(sec24b);
    document.getElementById('old-via').textContent = fmt(oldViaTotal);
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

    // Take-Home
    const oldTakeHome = gross - employeePF - profTax - oldTotalTax;
    const newTakeHome = gross - employeePF - profTax - newTotalTax;
    document.getElementById('th-old-annual').textContent = fmt(oldTakeHome);
    document.getElementById('th-old-monthly').textContent = fmt(oldTakeHome / 12);
    document.getElementById('th-new-annual').textContent = fmt(newTakeHome);
    document.getElementById('th-new-monthly').textContent = fmt(newTakeHome / 12);
}

let varMode = 'pct';
let parentAge = 'below60';
let donationRate = 100;
let disabilityLevel = 'regular';
let ddbAge = 'below60';

document.getElementById('toggleVar').addEventListener('click', function (e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const mode = btn.getAttribute('data-mode');
    if (mode === varMode) return;
    varMode = mode;
    this.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const input = document.getElementById('inVar');
    if (mode === 'pct') {
        input.placeholder = '10';
        input.step = '1';
        input.max = 100;
    } else {
        input.placeholder = '200000';
        input.step = '10000';
        input.removeAttribute('max');
    }
    input.value = '';
    calculate();
});

document.getElementById('toggle80Dparents').addEventListener('click', function (e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const age = btn.getAttribute('data-age');
    if (age === parentAge) return;
    parentAge = age;
    this.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const input = document.getElementById('in80Dparents');
    const isSenior = age === 'above60';
    const max = isSenior ? 50000 : 25000;
    input.max = max;
    document.getElementById('hint80Dparents').textContent = isSenior ? '· max ₹50K' : '· max ₹25K';
    if (parseFloat(input.value) > max) input.value = max;
    calculate();
});

document.getElementById('toggle80G').addEventListener('click', function (e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const rate = parseInt(btn.getAttribute('data-rate'), 10);
    if (rate === donationRate) return;
    donationRate = rate;
    this.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    calculate();
});

document.getElementById('toggle80DD').addEventListener('click', function (e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const level = btn.getAttribute('data-level');
    if (level === disabilityLevel) return;
    disabilityLevel = level;
    this.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const input = document.getElementById('in80DD');
    const isSevere = level === 'severe';
    const max = isSevere ? 125000 : 75000;
    input.max = max;
    document.getElementById('hint80DD').textContent = isSevere ? '· max ₹1.25L' : '· max ₹75K';
    if (parseFloat(input.value) > max) input.value = max;
    calculate();
});

document.getElementById('toggle80DDB').addEventListener('click', function (e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const age = btn.getAttribute('data-age');
    if (age === ddbAge) return;
    ddbAge = age;
    this.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const input = document.getElementById('in80DDB');
    const isSenior = age === 'above60';
    const max = isSenior ? 100000 : 40000;
    input.max = max;
    document.getElementById('hint80DDB').textContent = isSenior ? '· max ₹1L' : '· max ₹40K';
    if (parseFloat(input.value) > max) input.value = max;
    calculate();
});

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