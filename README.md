# India Income Tax Calculator

A fast, dependency-free interactive web application to compute Indian income tax liabilities. 

**[View Live Calculator](https://gagantk.github.io/income-tax-calculator/)**

## 🚀 Overview

This project provides an easy-to-use interface to estimate income tax based on the Income Tax Act provisions. Currently, the calculator focuses on the **Old Tax Regime**, allowing users to input their salary components and instantly see a breakdown of their tax slabs and total payable tax.

## 🛠 Architecture

This project is built from the ground up using strictly vanilla web technologies with no build steps, bundlers, or heavy frameworks. 

* **HTML5:** Semantic structure for the calculator interface.
* **CSS3:** Custom responsive styling using CSS variables for easy theming.
* **Vanilla JavaScript:** Core computation engine handling tax slabs and DOM updates.

## 🗺 Roadmap

This repository is actively being developed and expanded.

**Current Features:**
* Core salary component inputs (Basic, HRA, Other Flexible)
* **Exemption Engine:** Dynamic HRA computation based on rent and Metro/Non-Metro classification
* Standard deduction computation
* Slab-wise tax breakdown for the Old Tax Regime
* Support for Financial Years 2025-26 and 2026-27

**Upcoming Features:**
* **New Tax Regime:** Side-by-side comparison highlighting which regime saves more money.
* **Chapter VI-A Deductions:** Support for 80C, 80D, and advanced deductions (80CCD, 80EEA, etc.).
* **Theming:** Persistent Dark/Light mode toggle.
* **Take-Home Analysis:** Annual and monthly net take-home pay comparisons.

## 💻 Local Setup

Since there are no dependencies or build tools required, running this project locally is as simple as it gets:

1. Clone the repository:
   git clone https://github.com/gagantk/income-tax-calculator.git

2. Navigate to the directory:
   cd income-tax-calculator

3. Open `index.html` directly in any modern web browser.

## ⚠️ Disclaimer

This calculator provides estimates based on the Income Tax Act provisions for the selected Financial Year. Actual liability may vary based on other income sources, specific exemption eligibility, and employer policies. Please consult a qualified Chartered Accountant for precise tax planning.