
let currentStep = 1;
const totalSteps = 10; // Reduced to 10 for cleaner flow
let selectedMode = '';
let selectedDirection = '';

// Data for Ports
const locationData: Record<string, { airports: string[], seaports: string[] }> = {
    "China": { airports: ["Shanghai (PVG)", "Beijing (PEK)", "Guangzhou (CAN)"], seaports: ["Shanghai", "Shenzhen", "Ningbo"] },
    "USA": { airports: ["New York (JFK)", "Los Angeles (LAX)", "Chicago (ORD)"], seaports: ["Los Angeles", "Long Beach", "New York"] },
    "Germany": { airports: ["Frankfurt (FRA)", "Munich (MUC)"], seaports: ["Hamburg", "Bremerhaven"] },
    "India": { airports: ["Mumbai (BOM)", "Delhi (DEL)"], seaports: ["Nhava Sheva", "Mundra"] },
    "UK": { airports: ["London (LHR)", "Manchester (MAN)"], seaports: ["Felixstowe", "Southampton"] },
    "UAE": { airports: ["Dubai (DXB)"], seaports: ["Jebel Ali"] }
};

// Global declarations for external libraries and window functions
declare global {
    interface Window {
        shareQuote: (platform: string) => void;
        jspdf: any;
        html2canvas: any;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initQuotation();
    // Expose share function to window
    window.shareQuote = shareQuote;
});

function initQuotation() {
    updateUI();

    // -- Event Listeners --

    // Step 1: Mode Selection
    document.querySelectorAll('.mode-card[data-mode]').forEach(card => {
        card.addEventListener('click', () => {
            // Clear others
            document.querySelectorAll('.mode-card[data-mode]').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedMode = card.getAttribute('data-mode') || '';
            // Auto advance
            setTimeout(() => nextStep(), 300);
        });
    });

    // Step 2: Direction Selection
    document.querySelectorAll('[data-dir]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-dir]').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedDirection = btn.getAttribute('data-dir') || '';
            setTimeout(() => nextStep(), 300);
        });
    });

    // Location Change Listeners
    const originCountry = document.getElementById('origin-country') as HTMLSelectElement;
    const destCountry = document.getElementById('dest-country') as HTMLSelectElement;

    originCountry?.addEventListener('change', () => updatePorts('origin'));
    destCountry?.addEventListener('change', () => updatePorts('dest'));

    // Measurement Listeners
    const dimInputs = ['input-weight', 'input-length', 'input-width', 'input-height'];
    dimInputs.forEach(id => {
        document.getElementById(id)?.addEventListener('input', calculateWeight);
    });

    // Navigation Buttons
    document.getElementById('btn-next')?.addEventListener('click', nextStep);
    document.getElementById('btn-prev')?.addEventListener('click', prevStep);

    // Calculation Buttons
    document.getElementById('btn-calculate')?.addEventListener('click', () => {
        const btn = document.getElementById('btn-calculate') as HTMLButtonElement;
        btn.innerText = "Analyzing Routes...";
        btn.disabled = true;

        // Simulating API call
        setTimeout(() => {
            btn.innerText = "Sync Intelligence";
            btn.disabled = false;
            nextStep();
        }, 1500);
    });

    document.getElementById('btn-final-quote')?.addEventListener('click', () => {
        generateFinalQuote();
        nextStep();
    });

    document.getElementById('btn-download-pdf')?.addEventListener('click', downloadPDF);

}

function updatePorts(type: 'origin' | 'dest') {
    const countrySelect = document.getElementById(`${type}-country`) as HTMLSelectElement;
    const portSelect = document.getElementById(`${type}-port`) as HTMLSelectElement;

    if (!countrySelect || !portSelect) return;

    const country = countrySelect.value;
    portSelect.innerHTML = '<option value="">Select Site...</option>';

    if (locationData[country]) {
        // Determine if we show airports or seaports based on mode
        const isAir = selectedMode === 'air' || selectedMode === 'courier';
        const list = isAir ? locationData[country].airports : locationData[country].seaports;

        list.forEach(port => {
            const opt = document.createElement('option');
            opt.value = port;
            opt.innerText = port;
            portSelect.appendChild(opt);
        });
    }
}

function calculateWeight() {
    const w = parseFloat((document.getElementById('input-weight') as HTMLInputElement).value) || 0;
    const l = parseFloat((document.getElementById('input-length') as HTMLInputElement).value) || 0;
    const wi = parseFloat((document.getElementById('input-width') as HTMLInputElement).value) || 0;
    const h = parseFloat((document.getElementById('input-height') as HTMLInputElement).value) || 0;

    // Volumetric Calculation
    const volumeCBM = (l * wi * h) / 1000000;

    // Volumetric Divisors: Air 6000 (typ), Sea 1000. simplified logic:
    // Air standard: 1 CBM = 167kg
    // Sea standard: 1 CBM = 1000kg
    const factor = (selectedMode === 'air' || selectedMode === 'courier') ? 167 : 1000;
    const volWeight = volumeCBM * factor;

    const chargeable = Math.max(w, volWeight);

    const dispW = document.getElementById('display-chargeable-weight');
    const dispV = document.getElementById('display-volumetric');

    if (dispW) dispW.innerText = `${chargeable.toFixed(2)} kg`;
    if (dispV) dispV.innerText = `${volumeCBM.toFixed(3)} m³`;
}

function nextStep() {
    if (!validateStep(currentStep)) return;
    if (currentStep < totalSteps) {
        currentStep++;
        updateUI();
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        updateUI();
    }
}

function validateStep(step: number): boolean {
    if (step === 1 && !selectedMode) {
        alert("Please select a transport mode.");
        return false;
    }
    if (step === 2 && !selectedDirection) {
        alert("Please select Import or Export.");
        return false;
    }
    if (step === 3) {
        const cat = (document.getElementById('input-cargo-type') as HTMLSelectElement).value;
        if (!cat) { alert("Please select a cargo category."); return false; }
    }

    // Step 8: Entity Validation (Shipper & Consignee)
    if (step === 8) {
        const inputName = (document.getElementById('input-name') as HTMLInputElement).value;
        const inputEmail = (document.getElementById('input-email') as HTMLInputElement).value;
        const inputShipper = (document.getElementById('input-shipper-name') as HTMLInputElement).value;

        if (!inputName || !inputEmail) {
            alert("Please fill in Consignee Name and Email.");
            return false;
        }
        if (!inputShipper) {
            alert("Please fill in Shipper Name.");
            return false;
        }
    }

    return true;

}

function updateUI() {
    // Hide all steps, show active
    document.querySelectorAll('.step-card').forEach((el) => {
        const stepNum = parseInt(el.getAttribute('data-step') || '0');
        if (stepNum === currentStep) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });

    // Update Progress
    const progressFill = document.getElementById('progress-bar');
    if (progressFill) progressFill.style.width = `${(currentStep / totalSteps) * 100}%`;

    const stepCount = document.getElementById('step-count');
    if (stepCount) stepCount.innerText = `${currentStep.toString().padStart(2, '0')} / ${totalSteps}`;

    // Nav Buttons Visibility
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');

    if (btnPrev) btnPrev.style.opacity = currentStep === 1 ? '0' : '1';

    // Hide Next button on steps with custom actions (Mode, Sync, Generate)
    // Steps 1(Mode), 2(Dir), 7(Sync), 9(Gen) usually auto-advance or have custom buttons
    if (btnNext) {
        if ([1, 2, 7, 9, 10].includes(currentStep)) {
            btnNext.style.display = 'none';
        } else {
            btnNext.style.display = 'block';
        }
    }
}

function generateFinalQuote() {
    // 1. Gather Inputs
    const weightStr = document.getElementById('display-chargeable-weight')?.innerText || "0";
    const weight = parseFloat(weightStr.replace(' kg', ''));

    const volStr = document.getElementById('display-volumetric')?.innerText || "0";
    const volume = parseFloat(volStr.replace(' m³', ''));

    const l = (document.getElementById('input-length') as HTMLInputElement).value || "0";
    const w = (document.getElementById('input-width') as HTMLInputElement).value || "0";
    const h = (document.getElementById('input-height') as HTMLInputElement).value || "0";
    const dims = `${l}x${w}x${h} cm`;

    const originCountry = (document.getElementById('origin-country') as HTMLSelectElement).value;
    const destCountry = (document.getElementById('dest-country') as HTMLSelectElement).value;
    const originPort = (document.getElementById('origin-port') as HTMLSelectElement).value;
    const destPort = (document.getElementById('dest-port') as HTMLSelectElement).value;

    // 2. Calculate Distance (Mock)
    const distance = calculateMockDistance(originCountry, destCountry);

    // 3. Base Rates (Mock)
    // Formula: (Weight * ModeRate * DistanceFactor) + Handling
    let modeRate = 0;
    let transportFactor = 1;

    switch (selectedMode) {
        case 'air': modeRate = 4.50; transportFactor = 1.2; break;
        case 'courier': modeRate = 6.80; transportFactor = 1.5; break;
        case 'sea-fcl': modeRate = 0.50; transportFactor = 0.8; break;
        case 'sea-lcl': modeRate = 0.90; transportFactor = 0.9; break;
        default: modeRate = 1;
    }

    // Distance multiplier (very rough approx: cost per kg per 1000km)
    const distMultiplier = distance / 5000;

    // Core Calculation
    let baseCost = weight * modeRate * transportFactor * (1 + (distMultiplier * 0.5));

    // Adjust for volume if Sea LCL (CBM pricing)
    if (selectedMode === 'sea-lcl') {
        const cbmRate = 150; // $150 per CBM base
        const volCost = volume * cbmRate * (1 + distMultiplier);
        baseCost = Math.max(baseCost, volCost);
    }

    // Fixed Fees
    const fuelSurcharge = baseCost * 0.12; // 12% Fuel
    const customsFee = originCountry !== destCountry ? 120.00 : 0; // Export fee
    const handlingFee = 50.00;

    const total = baseCost + fuelSurcharge + customsFee + handlingFee;

    // 4. Update UI
    const setText = (id: string, txt: string) => { const el = document.getElementById(id); if (el) el.innerText = txt; };

    setText('summary-mode', selectedMode.toUpperCase().replace('-', ' '));
    setText('summary-total-cost', `$${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

    setText('summary-origin', `${originPort}, ${originCountry}`);
    setText('summary-dest', `${destPort}, ${destCountry}`);
    setText('summary-distance', `${distance.toLocaleString()} km`);

    setText('summary-weight', `${weight} kg`);
    setText('summary-vol', `${volume} m³`);
    setText('summary-dims', dims);

    setText('summary-base-cost', `$${baseCost.toFixed(2)}`);
    setText('summary-fuel-cost', `$${fuelSurcharge.toFixed(2)}`);
    setText('summary-customs-cost', `$${(customsFee + handlingFee).toFixed(2)}`);
}

function calculateMockDistance(origin: string, dest: string): number {
    // Simple look-up table for demo purposes
    // Returns km
    if (origin === dest) return 500; // Domestic

    const key = `${origin}-${dest}`;
    const keyRev = `${dest}-${origin}`;

    const dists: Record<string, number> = {
        "China-USA": 11600,
        "China-Germany": 7500,
        "China-India": 3000,
        "China-UK": 8200,
        "China-UAE": 6000,
        "USA-Germany": 7800,
        "USA-India": 13500,
        "USA-UK": 6800,
        "USA-UAE": 11000,
        "Germany-India": 6700,
        "Germany-UK": 1000,
        "Germany-UAE": 5000,
        "India-UK": 7000,
        "India-UAE": 2500,
        "UK-UAE": 5500
    };

    return dists[key] || dists[keyRev] || 8000; // Default average global distance
}

async function downloadPDF() {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) { alert("PDF Generator loading..."); return; }

    const element = document.getElementById('quote-result-container');
    if (!element) return;

    // Use html2canvas to capture the result div
    try {
        const canvas = await window.html2canvas(element, {
            backgroundColor: '#0f172a', // Match dark theme
            scale: 2
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        // Add header text
        pdf.setTextColor(6, 182, 212); // Cyan
        pdf.setFontSize(22);
        pdf.text("GlobalX Logistics Quotation", 15, 20);

        pdf.setTextColor(100);
        pdf.setFontSize(10);
        pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 15, 26);

        // Add the image
        pdf.addImage(imgData, 'PNG', 15, 40, pdfWidth - 30, pdfHeight);

        // Save
        pdf.save('GlobalX_Quote_Proposal.pdf');

    } catch (err) {
        console.error("PDF Error:", err);
        alert("Could not generate PDF. Please try again.");
    }
}

function shareQuote(platform: string) {
    const total = document.getElementById('summary-total-cost')?.innerText || "";
    const mode = document.getElementById('summary-mode')?.innerText || "";

    const text = `Check out this logistics quote from GlobalX!\nService: ${mode}\nEstimate: ${total}\n\nGet yours at: ${window.location.href}`;
    const encodedText = encodeURIComponent(text);

    let url = '';

    switch (platform) {
        case 'whatsapp':
            url = `https://wa.me/?text=${encodedText}`;
            break;
        case 'linkedin':
            url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
            break;
        case 'twitter':
            url = `https://twitter.com/intent/tweet?text=${encodedText}`;
            break;
    }

    if (url) window.open(url, '_blank');
}
