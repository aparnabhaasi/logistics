// Mock Data Interfaces
interface TrackingEvent {
    status: 'Booked' | 'Pickup' | 'Transit' | 'Customs' | 'Delivery' | 'Delivered' | 'Exception';
    title: string;
    location: string;
    date: string; // YYYY-MM-DD HH:MM
    completed: boolean;
}

interface Shipment {
    id: string;
    mode: 'Air' | 'Sea' | 'Road';
    origin: string;
    destination: string;
    eta: string;
    weight: string;
    pieces: string;
    timeline: TrackingEvent[];
    coords: { start: [number, number], end: [number, number] }; // [x, y] for SVG 800x300 map
    podUrl?: string; // Proof of Delivery Image
    exceptionMsg?: string; // Alert message
}

// Mock Database
const MOCK_DB: Record<string, Shipment> = {
    "TRK9001": {
        id: "TRK9001", mode: "Air", origin: "Shanghai (PVG)", destination: "Los Angeles (LAX)", eta: "2026-10-24", weight: "450 kg", pieces: "5 Euro Pallets",
        coords: { start: [650, 120], end: [150, 140] },
        timeline: [
            { status: 'Booked', title: 'Pickup Scheduled', location: 'Shanghai, CN', date: '2026-10-20 09:30', completed: true },
            { status: 'Pickup', title: 'Picked Up', location: 'Foxconn Factory, CN', date: '2026-10-20 14:00', completed: true },
            { status: 'Transit', title: 'Departed Origin', location: 'PVG Airport', date: '2026-10-21 06:45', completed: true },
            { status: 'Transit', title: 'In Transit', location: 'Pacific Ocean (Air)', date: '2026-10-21 18:00', completed: true },
            { status: 'Customs', title: 'Customs Clearance', location: 'LAX Gateway', date: 'Est. 2026-10-22', completed: false },
            { status: 'Delivery', title: 'Arrived at Destination', location: 'Los Angeles, CA', date: '-', completed: false },
            { status: 'Delivery', title: 'Out for Delivery', location: 'Los Angeles, CA', date: '-', completed: false },
            { status: 'Delivered', title: 'Delivered', location: 'Anaheim, CA', date: '-', completed: false }
        ]
    },
    "TRK9002": {
        id: "TRK9002", mode: "Sea", origin: "Hamburg (HAM)", destination: "Dubai (Jebel Ali)", eta: "2026-09-15", weight: "12,400 kg", pieces: "1x 40HC Container",
        coords: { start: [420, 100], end: [550, 160] },
        podUrl: "https://via.placeholder.com/300x150?text=POD+Signature",
        timeline: [
            { status: 'Booked', title: 'Pickup Scheduled', location: 'Hamburg, DE', date: '2026-08-20', completed: true },
            { status: 'Pickup', title: 'Picked Up', location: 'Hamburg WH', date: '2026-08-21', completed: true },
            { status: 'Transit', title: 'Departed Origin', location: 'Port of Hamburg', date: '2026-08-25', completed: true },
            { status: 'Transit', title: 'Arrived at Destination', location: 'Jebel Ali Port', date: '2026-09-14', completed: true },
            { status: 'Delivered', title: 'Delivered', location: 'Jebel Ali Free Zone', date: '2026-09-15 10:30', completed: true }
        ]
    },
    "TRK9003": { // Exception Case
        id: "TRK9003", mode: "Air", origin: "New York (JFK)", destination: "London (LHR)", eta: "Delayed", weight: "120 kg", pieces: "2 Boxes",
        coords: { start: [200, 120], end: [420, 100] },
        exceptionMsg: "Clearance Delay: Missing Commercial Invoice. Action Required.",
        timeline: [
            { status: 'Booked', title: 'Pickup Scheduled', location: 'NY, USA', date: '2026-10-22', completed: true },
            { status: 'Pickup', title: 'Picked Up', location: 'Manhattan, NY', date: '2026-10-22', completed: true },
            { status: 'Exception', title: 'Customs Hold', location: 'LHR Airport', date: '2026-10-23', completed: true }
        ]
    }
};

// -- Main Logic --


// -- Main Logic --

// Initialize
const init = () => {
    // Check URL Params
    const urlParams = new URLSearchParams(window.location.search);
    const trackingID = urlParams.get('track'); // e.g. ?track=TRK9001

    if (trackingID) {
        // Pre-fill search
        const box = document.getElementById('track-input') as HTMLInputElement;
        if (box) box.value = trackingID;
        searchTrack(trackingID);
    } else {
        // Show empty state by default
        const errorState = document.getElementById('error-state');
        if (errorState) errorState.style.display = 'block';
    }

    // Event Listeners
    document.getElementById('track-btn')?.addEventListener('click', () => {
        const val = (document.getElementById('track-input') as HTMLInputElement).value;
        if (val) searchTrack(val);
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

function searchTrack(id: string) {
    const rawId = id.trim().toUpperCase();
    const data = MOCK_DB[rawId];

    const resultContainer = document.getElementById('result-container');
    const errorState = document.getElementById('error-state');

    if (!data) {
        if (resultContainer) resultContainer.style.display = 'none';
        if (errorState) {
            errorState.style.display = 'block';
            errorState.innerHTML = `<h2>Tracking ID <strong>${rawId}</strong> not found.</h2><p>Please check your number and try again.</p>`;
        }
        return;
    }

    // Found Data
    if (errorState) errorState.style.display = 'none';
    if (resultContainer) {
        resultContainer.style.display = 'block';
    }

    renderShipment(data);
}

function renderShipment(data: Shipment) {
    // Header Info
    setText('disp-id', data.id);
    setText('disp-mode', `${data.mode} Freight`);

    // Badge Status & Alert
    const lastEvent = data.timeline[data.timeline.length - 1];
    const isDelivered = lastEvent.status === 'Delivered';
    const isException = !!data.exceptionMsg;

    const badge = document.getElementById('disp-badge');
    const alertBox = document.getElementById('alert-box');
    const alertMsg = document.getElementById('alert-msg');

    if (badge) {
        if (isException) {
            badge.innerText = 'Exception';
            badge.className = 'status-badge alert';
        } else if (isDelivered) {
            badge.innerText = 'Delivered';
            badge.className = 'status-badge';
        } else {
            badge.innerText = 'In Transit';
            badge.className = 'status-badge transit';
        }
    }

    // Exception Banner
    if (alertBox && alertMsg) {
        if (isException && data.exceptionMsg) {
            alertBox.style.display = 'flex';
            alertMsg.innerText = data.exceptionMsg;
        } else {
            alertBox.style.display = 'none';
        }
    }

    // POD Logic
    const podSection = document.getElementById('pod-section');
    const podImg = document.getElementById('pod-img') as HTMLImageElement;
    if (podSection && podImg) {
        if (isDelivered && data.podUrl) {
            podSection.style.display = 'block';
            podImg.src = data.podUrl;
        } else {
            podSection.style.display = 'none';
        }
    }

    // Details Panel
    setText('det-origin', data.origin);
    setText('det-dest', data.destination);
    setText('det-eta', data.eta);
    setText('det-weight', data.weight);
    setText('det-pieces', data.pieces);

    // Timeline Rendering
    const timelineList = document.getElementById('timeline-list');
    if (timelineList) {
        timelineList.innerHTML = ''; // Clear

        // Reverse array to show newest first? Or Standard Chronological? 
        // Typically logistics tracking shows Most Recent at Top or Bottom. 
        // Let's stick to Chronological (Oldest Top) for "Process" feel, or Reverse for "Status".
        // User asked for "Delivery Process", usually Top -> Bottom (Start -> End).

        data.timeline.forEach((event, index) => {
            const isLast = index === data.timeline.length - 1;
            const item = document.createElement('div');
            item.className = `timeline-event ${event.completed ? 'completed' : 'future'} ${index === data.timeline.length - 1 && event.completed ? 'active' : ''}`;

            // Icon Selection
            let icon = '';
            if (event.status === 'Delivered') icon = '🏁';
            else if (event.status === 'Booked') icon = '📦';
            else if (event.status === 'Transit') icon = '✈️'; // or 🚢 based on mode
            else if (event.status === 'Exception') icon = '⚠️';
            else icon = '📍';

            // Split Date/Time
            const [datePart, timePart] = event.date.includes(' ') ? event.date.split(' ') : [event.date, ''];

            item.innerHTML = `
                <div class="t-date">
                    <span style="display:block; font-weight:700; color:white;">${datePart}</span>
                    <span style="font-size:0.8rem; opacity:0.7;">${timePart}</span>
                </div>
                <div class="timeline-line"></div>
                <div class="t-content">
                    <div class="t-dot">${event.completed ? '✓' : ''}</div>
                    <div class="t-card">
                        <div class="t-title">${event.title}</div>
                        <div class="t-loc">${event.location}</div>
                    </div>
                </div>
            `;
            timelineList.appendChild(item);
        });
    }

    // Render Map Curve
    renderMapCurve(data.coords.start, data.coords.end);
}

function renderMapCurve(start: [number, number], end: [number, number]) {
    const svg = document.getElementById('route-map');
    if (!svg) return;

    // Clear old routes
    const oldPath = document.getElementById('dynamic-route-line');
    if (oldPath) oldPath.remove();

    const [x1, y1] = start;
    const [x2, y2] = end;

    // Control Point for Curve (Arc upwards)
    const cx = (x1 + x2) / 2;
    const cy = Math.min(y1, y2) - 100; // Arc height

    const d = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("id", "dynamic-route-line");
    path.setAttribute("d", d);
    path.setAttribute("stroke", "#06b6d4");
    path.setAttribute("stroke-width", "3");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-dasharray", "8,8");
    path.style.filter = "drop-shadow(0 0 5px #06b6d4)";

    // Animation
    path.innerHTML = `
        <animate attributeName="stroke-dashoffset" from="100" to="0" dur="2s" repeatCount="indefinite" />
    `;

    // Add markers
    // (Simplified circle markers)
    const markerStart = createMarker(x1, y1);
    const markerEnd = createMarker(x2, y2);

    svg.appendChild(path);
    svg.appendChild(markerStart);
    svg.appendChild(markerEnd);
}

function createMarker(x: number, y: number) {
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", x.toString());
    c.setAttribute("cy", y.toString());
    c.setAttribute("r", "5");
    c.setAttribute("fill", "white");
    c.setAttribute("stroke", "#06b6d4");
    c.setAttribute("stroke-width", "2");
    return c;
}

function setText(id: string, txt: string) {
    const el = document.getElementById(id);
    if (el) el.innerText = txt;
}
