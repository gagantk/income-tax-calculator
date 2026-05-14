# India Income Tax Calculator

A fast, dependency-free interactive web application to compute Indian income tax liabilities. 

**[View Live Calculator](https://gagantk.github.io/income-tax-calculator/)**

## 🚀 Overview

This project provides an easy-to-use interface to estimate income tax based on the Income Tax Act provisions. Users input their salary components and instantly see a side-by-side breakdown of tax slabs and total payable tax under both the Old and New Tax Regimes.

## 🛠 Architecture

This project is built from the ground up using strictly vanilla web technologies with no build steps, bundlers, or heavy frameworks. 

* **HTML5:** Semantic structure for the calculator interface.
* **CSS3:** Custom responsive styling using CSS variables for easy theming.
* **Vanilla JavaScript:** Core computation engine handling tax slabs and DOM updates.

## ✨ Features

* Core salary component inputs (Basic, HRA, Other Flexible)
* **Exemption Engine:** Dynamic HRA computation based on rent and Metro/Non-Metro classification
* Standard deduction computation
* Slab-wise tax breakdown for both regimes
* **Old & New Tax Regime:** Side-by-side comparison with a verdict highlighting which regime saves more money
* **Chapter VI-A Deductions:** 80C, 80D (Self & Parents), 80CCD(1B) NPS, 80E education loan interest and 80EEA home loan interest, applied to the Old Regime
* Sec 24(b) home loan interest deduction (max ₹2L), applied to the Old Regime
* Professional Tax deduction (max ₹2,500), applied to the Old Regime
* Section 87A rebate (with marginal relief under the New Regime)
* Surcharge computation with marginal relief
* Health & Education Cess (4%)
* **Theming:** Persistent Dark/Light mode toggle with system preference detection
* Support for Financial Years 2025-26 and 2026-27
* Responsive layout for desktop and mobile

## 💻 Local Setup

Since there are no dependencies or build tools required, running this project locally is as simple as it gets:

1. Clone the repository:
   git clone https://github.com/gagantk/income-tax-calculator.git

2. Navigate to the directory:
   cd income-tax-calculator

3. Open `index.html` directly in any modern web browser.

## ⚠️ Disclaimer

This calculator provides estimates based on the Income Tax Act provisions for the selected Financial Year. Actual liability may vary based on other income sources, specific exemption eligibility, and employer policies. Please consult a qualified Chartered Accountant for precise tax planning.