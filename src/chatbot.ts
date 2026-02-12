// Chatbot Logic & "AI" Engine

// -- State Management --
interface ChatState {
    step: 'idle' | 'name' | 'email' | 'phone' | 'active';
    userData: {
        name: string;
        email: string;
        phone: string;
    };
    isOpen: boolean;
}

const state: ChatState = {
    step: 'idle',
    userData: { name: '', email: '', phone: '' },
    isOpen: false
};

// -- Knowledge Base (Simulated AI) --
const knowledgeBase: Record<string, string[]> = {
    "tracking": [
        "To track your shipment, please use the 'Track' button below or enter your HAWB/Container ID.",
        "You can find your 12-digit tracking number on your booking confirmation."
    ],
    "quote": [
        "I can help you with a quotation. Would you like to start a new Air or Ocean freight quote?",
        "Please click 'Get Quotation' to access our instant rate calculator."
    ],
    "shipping": [
        "We offer Air Priority, Ocean FCL/LCL, and Global Courier services.",
        "Transit times vary: Air (1-3 days), Ocean (15-45 days) depending on the route."
    ],
    "customs": [
        "Our Customs AI engine handles HTS classification automatically.",
        "For specific documentation requirements (Invoice, Packing List, COO), please check our 'Resources' tab."
    ],
    "documents": [
        "Standard export docs required: Commercial Invoice, Packing List, and Bill of Lading.",
        "Do you need a template? I can guide you to our document center."
    ],
    "contact": [
        "You can reach our 24/7 support team at concierge@globalx.com or +1-800-GLOBALX.",
        "Our headquarters is located at One World Trade Center, New York."
    ],
    "price": [
        "Rates depend on weight, volume, and distance. Use our Quote Tool for accurate pricing.",
        "We offer competitive market rates updated hourly."
    ]
};

// -- DOM Elements --
const widget = document.getElementById('chatbot-widget');
const toggleBtn = document.getElementById('chat-toggle');
const closeBtn = document.getElementById('close-chat');
const chatWindow = document.querySelector('.chat-window');
const messagesContainer = document.getElementById('chat-messages');
const inputField = document.getElementById('chat-input') as HTMLInputElement;
const sendBtn = document.getElementById('send-btn');
const typingIndicator = document.getElementById('typing-indicator');
const quickActions = document.getElementById('quick-actions');
const pulse = document.querySelector('.chat-pulse');

// -- Initialization --
export function initChatbot() {
    toggleBtn?.addEventListener('click', toggleChat);
    closeBtn?.addEventListener('click', toggleChat);

    sendBtn?.addEventListener('click', handleSend);
    inputField?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    // Initial greeting if previously not engaged
    if (state.step === 'idle') {
        const hasSeen = sessionStorage.getItem('chat_greeted');
        if (!hasSeen) {
            setTimeout(() => {
                // Little pulse or notification
                // Already handled by CSS animation
            }, 2000);
        }
    }
}

// -- Core Functions --

function toggleChat() {
    state.isOpen = !state.isOpen;
    if (state.isOpen) {
        chatWindow?.classList.add('open');
        pulse?.setAttribute('style', 'display: none'); // Stop pulsing when open
        if (state.step === 'idle') {
            startConversation();
        }
        inputField?.focus();
    } else {
        chatWindow?.classList.remove('open');
    }
}

async function startConversation() {
    state.step = 'name';
    await addBotMessage("Welcome to GlobalX Intelligence. I am your dedicated logistics concierge.");
    await addBotMessage("To better assist you, may I have your full name?");
}

// -- Message Handling --

function handleSend() {
    const text = inputField.value.trim();
    if (!text) return;

    addUserMessage(text);
    inputField.value = '';

    processInput(text);
}

function addUserMessage(text: string) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message user';
    msgDiv.innerHTML = `${escapeHtml(text)} <span class="time">${getCurrentTime()}</span>`;
    messagesContainer?.appendChild(msgDiv);
    scrollToBottom();
}

async function addBotMessage(text: string, actions: string[] = []) {
    showTyping();
    // Simulate thinking delay based on length
    const delay = Math.min(1000, 300 + text.length * 20);

    await new Promise(r => setTimeout(r, delay));

    hideTyping();
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot';
    // Process markdown-style bullets
    const formatted = text.replace(/\n/g, '<br>');
    msgDiv.innerHTML = `${formatted} <span class="time">${getCurrentTime()}</span>`;
    messagesContainer?.appendChild(msgDiv);

    // Actions chips
    if (actions.length > 0) {
        updateQuickActions(actions);
    }

    scrollToBottom();
}

// -- Logic Engine --

async function processInput(input: string) {
    const lowerInput = input.toLowerCase();

    // Intake Flow
    if (state.step === 'name') {
        state.userData.name = input;
        state.step = 'email';
        await addBotMessage(`Nice to meet you, ${input}. Please provide your corporate email address.`);
        return;
    }

    if (state.step === 'email') {
        // Basic email validation
        if (!input.includes('@') || !input.includes('.')) {
            await addBotMessage("That doesn't look like a valid email. Please try again.");
            return;
        }
        state.userData.email = input;
        state.step = 'phone';
        await addBotMessage("Thank you. Finally, what is the best phone number to reach you?");
        return;
    }

    if (state.step === 'phone') {
        state.userData.phone = input;
        state.step = 'active';
        await addBotMessage("Perfect. Your profile has been verified.");
        await addBotMessage("How can I help you today? You can ask about Tracking, Quotations, or Customs Services.",
            ["Get Quotation", "Track Shipment", "Services"]);
        return;
    }

    // Active AI State
    if (state.step === 'active') {
        const intent = identifyIntent(lowerInput);

        if (intent) {
            const responses = knowledgeBase[intent];
            const reply = responses[Math.floor(Math.random() * responses.length)];
            await addBotMessage(reply);

            // Contextual Actions
            if (intent === 'quote') updateQuickActions(['Go to Quote Page', 'Services']);
            if (intent === 'tracking') updateQuickActions(['Track Now', 'Contact Support']);

        } else {
            // Fallback for unknown
            await addBotMessage("I see. Could you please specify if you're looking for shipping rates, tracking info, or customs help?",
                ["Get Quotation", "Track Shipment"]);
        }
    }
}

function identifyIntent(input: string): string | null {
    // Simple Keyword matching (Fuzzy-ish)
    if (match(input, ['track', 'where', 'status', 'location', 'shipment'])) return 'tracking';
    if (match(input, ['quote', 'price', 'cost', 'rate', 'how much', 'cheap'])) return 'quote';
    if (match(input, ['service', 'air', 'sea', 'ocean', 'courier', 'freight'])) return 'shipping';
    if (match(input, ['custom', 'duty', 'tax', 'clearance', 'tariff'])) return 'customs';
    if (match(input, ['doc', 'invoice', 'packing', 'bill', 'form'])) return 'documents';
    if (match(input, ['help', 'contact', 'support', 'human', 'agent', 'manager'])) return 'contact';

    return null;
}

function match(input: string, keywords: string[]): boolean {
    return keywords.some(k => input.includes(k));
}

// -- UI Helpers --

function showTyping() {
    if (typingIndicator) {
        typingIndicator.style.display = 'flex';
        scrollToBottom();
    }
}

function hideTyping() {
    if (typingIndicator) typingIndicator.style.display = 'none';
}

function updateQuickActions(labels: string[]) {
    if (!quickActions) return;
    quickActions.innerHTML = '';
    labels.forEach(lbl => {
        const btn = document.createElement('div');
        btn.className = 'action-chip';
        btn.innerText = lbl;
        btn.onclick = () => {
            addUserMessage(lbl);
            processInput(lbl);
        };
        quickActions.appendChild(btn);
    });
}

function scrollToBottom() {
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text: string) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}

// Global Actions from suggestions
window.addEventListener('message', (event) => {
    // Handle external triggers if needed
});

// Initialize on Load
document.addEventListener('DOMContentLoaded', initChatbot);
