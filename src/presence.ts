
// -- Global Presence Map Logic --

interface City {
    name: string;
    x: number;
    y: number;
    region: string;
}

interface RegionConfig {
    name: string;
    description: string;
    transform: string; // CSS transform for zoom
    activePathId?: string; // ID of the SVG path to highlight
}

const cityData: City[] = [
    // India Cities (Mapped to new simplified SVG)
    { name: "New Delhi", x: 700, y: 190, region: "india" },
    { name: "Mumbai", x: 680, y: 220, region: "india" },
    { name: "Bangalore", x: 700, y: 250, region: "india" },
    { name: "Chennai", x: 720, y: 245, region: "india" },
    { name: "Kolkata", x: 740, y: 210, region: "india" },
    { name: "Hyderabad", x: 710, y: 230, region: "india" },
    { name: "Ahmedabad", x: 675, y: 205, region: "india" },
    { name: "Pune", x: 685, y: 225, region: "india" },
    { name: "Kochi", x: 690, y: 265, region: "india" },

    // USA Cities
    { name: "New York", x: 260, y: 120, region: "usa" },
    { name: "Chicago", x: 220, y: 110, region: "usa" },
    { name: "Los Angeles", x: 100, y: 140, region: "usa" },
    { name: "Miami", x: 250, y: 180, region: "usa" },

    // Singapore Hub
    { name: "Singapore HQ", x: 780, y: 260, region: "singapore" },
];

const regionConfigs: Record<string, RegionConfig> = {
    "world": {
        name: "Global Network",
        description: "Connecting 150+ trade hubs worldwide.",
        transform: "scale(1) translate(0, 0)"
    },
    "india": {
        name: "India Operations",
        description: "Pan-India logistics network covering 29 states.",
        transform: "scale(4) translate(-510px, -140px)",
        activePathId: "land-india"
    },
    "usa": {
        name: "North America",
        description: "Strategic gateways in NY, LA, and Chicago.",
        transform: "scale(3) translate(-150px, -70px)",
        activePathId: "land-usa"
    },
    "singapore": {
        name: "Singapore Hub",
        description: "Primary APAC Distribution Center.",
        transform: "scale(6) translate(-650px, -210px)",
        activePathId: "land-asia" // Highlight generic Asia path for context, or specific dot? Highlight Asia is fine.
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initPresenceMap();
});

function initPresenceMap() {
    const mapGroup = document.getElementById('map-world-group');
    const pinsGroup = document.getElementById('map-pins-group');
    const tabs = document.querySelectorAll('.presence-tab');
    const title = document.getElementById('loc-title');
    const desc = document.getElementById('loc-desc');

    if (!mapGroup || !pinsGroup) return;

    // Render Initial Pins
    renderPins(cityData, pinsGroup);

    // Tab Interface
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-target') || 'world';
            const config = regionConfigs[target];

            // 1. Update Tabs
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // 2. Zoom Map
            if (config) {
                // Apply transform to the Wrapper Group (Land + Pins) logic
                // Currently pins are separate. 
                // To make pins move WITh the land, we apply transform to both groups.

                const transformStyle = config.transform;
                mapGroup.style.transform = transformStyle;
                pinsGroup.style.transform = transformStyle;

                // Style Adjustments
                pinsGroup.style.transition = "transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)";
                pinsGroup.style.transformOrigin = "center center";

                // 3. Update Text
                if (title) {
                    title.style.opacity = '0';
                    setTimeout(() => { title.innerText = config.name; title.style.opacity = '1'; }, 300);
                }
                if (desc) {
                    desc.style.opacity = '0';
                    setTimeout(() => { desc.innerText = config.description; desc.style.opacity = '1'; }, 300);
                }

                // 4. Highlight Region logic
                // Reset all
                document.querySelectorAll('.land-mass').forEach(p => p.classList.remove('active-region'));

                // Set active
                if (config.activePathId) {
                    document.getElementById(config.activePathId)?.classList.add('active-region');
                }
            }
        });
    });

    // Interaction on Map itself (Clicking a country)
    document.getElementById('land-india')?.addEventListener('click', () => clickTab('india'));
    document.getElementById('land-usa')?.addEventListener('click', () => clickTab('usa'));
}

function clickTab(target: string) {
    (document.querySelector(`.presence-tab[data-target="${target}"]`) as HTMLElement)?.click();
}

function renderPins(cities: City[], container: HTMLElement) {
    container.innerHTML = '';

    cities.forEach(city => {
        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", "map-pin");
        g.setAttribute("transform", `translate(${city.x}, ${city.y})`);

        // Outer Ring (Orange)
        const circleOuter = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circleOuter.setAttribute("r", "5");
        circleOuter.setAttribute("class", "pin-outer");

        // Inner Dot (White)
        const circleInner = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circleInner.setAttribute("r", "2");
        circleInner.setAttribute("class", "pin-inner");

        // Logo / Icon simulation (optional)
        // For now, clean dots.

        // Label Text
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", "8");
        text.setAttribute("y", "3");
        text.setAttribute("class", "pin-label");
        text.textContent = city.name;

        g.appendChild(circleOuter);
        g.appendChild(circleInner);
        g.appendChild(text);

        container.appendChild(g);
    });
}
