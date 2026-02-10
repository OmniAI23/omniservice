(function() {
    // 1. Get the bot ID from the script tag
    const scriptTag = document.currentScript;
    const botId = scriptTag.getAttribute('data-bot-id');
    const apiBase = window.location.origin; // Points to the backend

    if (!botId) {
        console.error('OmniService: data-bot-id is missing in the script tag.');
        return;
    }

    // 2. Add styles to the page
    const styles = `
        #omniservice-chat-widget {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        #omniservice-chat-button {
            width: 60px;
            height: 60px;
            background-color: #2563eb;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
            transition: transform 0.2s;
        }
        #omniservice-chat-button:hover { transform: scale(1.05); }
        #omniservice-chat-window {
            display: none;
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 350px;
            height: 500px;
            background: white;
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.15);
            flex-direction: column;
            overflow: hidden;
            border: 1px solid #f1f5f9;
        }
        #omniservice-chat-window.open { display: flex; }
        .omni-header { padding: 16px; background: #2563eb; color: white; display: flex; justify-content: space-between; align-items: center; }
        .omni-messages { flex: 1; overflow-y: auto; padding: 16px; background: #f8fafc; font-size: 14px; }
        .omni-msg { margin-bottom: 12px; padding: 10px 14px; border-radius: 14px; line-height: 1.5; max-width: 85%; }
        .omni-user-msg { background: #2563eb; color: white; align-self: flex-end; margin-left: auto; border-bottom-right-radius: 2px; }
        .omni-bot-msg { background: white; color: #1e293b; border-bottom-left-radius: 2px; border: 1px solid #e2e8f0; }
        .omni-input-area { padding: 12px; border-top: 1px solid #e2e8f0; display: flex; gap: 8px; }
        .omni-input { flex: 1; border: 1px solid #e2e8f0; padding: 8px 12px; rounded-lg: 8px; outline: none; font-size: 14px; border-radius: 8px; }
        .omni-send { background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .omni-loading { font-size: 12px; color: #64748b; margin-top: 4px; font-style: italic; }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    // 3. Create the widget elements
    const widget = document.createElement('div');
    widget.id = 'omniservice-chat-widget';
    widget.innerHTML = `
        <div id="omniservice-chat-window">
            <div class="omni-header">
                <span style="font-weight: bold;">AI Assistant</span>
                <span id="omni-close" style="cursor: pointer;">&times;</span>
            </div>
            <div id="omni-messages" class="omni-messages">
                <div class="omni-msg omni-bot-msg">Hello! How can I help you today?</div>
            </div>
            <div class="omni-input-area">
                <input type="text" id="omni-input" class="omni-input" placeholder="Type a message...">
                <button id="omni-send" class="omni-send">Send</button>
            </div>
        </div>
        <div id="omniservice-chat-button">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
        </div>
    `;
    document.body.appendChild(widget);

    // 4. Handle Logic
    const windowEl = document.getElementById('omniservice-chat-window');
    const buttonEl = document.getElementById('omniservice-chat-button');
    const closeEl = document.getElementById('omni-close');
    const inputEl = document.getElementById('omni-input');
    const sendEl = document.getElementById('omni-send');
    const messagesEl = document.getElementById('omni-messages');

    buttonEl.addEventListener('click', () => windowEl.classList.toggle('open'));
    closeEl.addEventListener('click', () => windowEl.classList.remove('open'));

    async function sendMessage() {
        const text = inputEl.value.trim();
        if (!text) return;

        // Add user message
        const userMsg = document.createElement('div');
        userMsg.className = 'omni-msg omni-user-msg';
        userMsg.innerText = text;
        messagesEl.appendChild(userMsg);
        inputEl.value = '';
        messagesEl.scrollTop = messagesEl.scrollHeight;

        // Add loading state
        const botMsg = document.createElement('div');
        botMsg.className = 'omni-msg omni-bot-msg';
        botMsg.innerHTML = '<span class="omni-loading">Agent is thinking...</span>';
        messagesEl.appendChild(botMsg);

        try {
            const response = await fetch(`${apiBase}/api/public/bot/${botId}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let botText = "";
            botMsg.innerText = ""; // Clear loading

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                botText += decoder.decode(value);
                botMsg.innerText = botText;
                messagesEl.scrollTop = messagesEl.scrollHeight;
            }
        } catch (err) {
            botMsg.innerText = "Sorry, I encountered an error. Please try again.";
        }
    }

    sendEl.addEventListener('click', sendMessage);
    inputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

})();
