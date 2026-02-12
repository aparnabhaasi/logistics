// Sticky Navbar
const nav = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 80) {
        nav?.classList.add('scrolled');
    } else {
        nav?.classList.remove('scrolled');
    }
});

// Dynamic World Map Routes
const mapSvg = document.getElementById('world-map-svg');
const svgNs = "http://www.w3.org/2000/svg";

function generateDynamicRoute() {
    if (!mapSvg) return;

    const path = document.createElementNS(svgNs, "path");

    // Simulate global hub coordinates
    const startX = Math.random() * 1000;
    const startY = Math.random() * 500;
    const endX = Math.random() * 1000;
    const endY = Math.random() * 500;

    // Curved line for route
    const cpX = (startX + endX) / 2;
    const cpY = Math.min(startY, endY) - 100;

    const d = `M ${startX} ${startY} Q ${cpX} ${cpY} ${endX} ${endY}`;

    path.setAttribute("d", d);
    path.setAttribute("stroke", "var(--accent-blue)");
    path.setAttribute("stroke-width", (Math.random() * 1 + 0.5).toString());
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-dasharray", "5,5");
    path.style.opacity = '0';
    path.style.transition = 'opacity 1s ease';

    mapSvg.appendChild(path);

    // Animate entrance
    setTimeout(() => { path.style.opacity = '0.3'; }, i * 100);

    // Animate dash offset (dashdrive effect)
    let offset = 0;
    const drive = () => {
        offset--;
        path.setAttribute("stroke-dashoffset", offset.toString());
        if (offset > -1000) requestAnimationFrame(drive);
    };
    drive();

    // Auto cleanup
    setTimeout(() => {
        path.style.opacity = '0';
        setTimeout(() => path.remove(), 1000);
    }, 15000);
}

// Initialize initial routes
for (let i = 0; i < 6; i++) {
    const i = 0; // for timeout scope
    generateDynamicRoute();
}
setInterval(generateDynamicRoute, 3500);

// Scroll Reveal
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.opacity = '1';
            (entry.target as HTMLElement).style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.service-card, .stat-box, .quote-preview').forEach(el => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.opacity = '0';
    htmlEl.style.transform = 'translateY(30px)';
    htmlEl.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
    observer.observe(el);
});

// AI Portal Interaction
const waBtn = document.querySelector('.wa-btn');
const aiMsg = document.querySelector('.ai-message');

waBtn?.addEventListener('click', () => {
    window.open('https://wa.me/your-logistics-portal', '_blank');
});

// Auto-hide AI message after a while
setTimeout(() => {
    if (aiMsg) {
        (aiMsg as HTMLElement).style.opacity = '0';
        (aiMsg as HTMLElement).style.transform = 'translateX(20px)';
        (aiMsg as HTMLElement).style.transition = 'all 0.5s ease';
    }
}, 8000);
