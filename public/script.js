let loginTimeout = null;

const socket = io();

const loginBtn = document.getElementById('loginBtn');
const stopBtn = document.getElementById('stopBtn');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const logs = document.getElementById('logs');
const loginLinkContainer = document.getElementById('loginLinkContainer');
const viewerContainer = document.getElementById('viewerContainer');
const hostInput = document.getElementById('hostInput');
const portInput = document.getElementById('portInput');

// Set default values when received from server
socket.on('defaultConfig', (config) => {
    hostInput.value = config.host || '';
    portInput.value = config.port || '';
});

loginBtn.addEventListener('click', () => {
    const host = hostInput.value.trim() || null;
    const port = portInput.value.trim() || null;
    
    socket.emit('login', { host, port });
    loginBtn.disabled = true;
    addLog('Logging in...');
    if (host && port) {
        addLog(`Connecting to ${host}:${port}`);
    } else {
        addLog('Using default server configuration');
    }
    loginTimeout = setTimeout(instantiateViewer, 5000);
});

stopBtn.addEventListener('click', () => {
    socket.emit('stopBot');
    stopBot();
});

function instantiateViewer() {
    const iframe = document.createElement('iframe');
    const origin = window.location.origin.replace(window.location.port, 3001); 
    iframe.src = `${origin}/${window.location.pathname}`

    iframe.title = "Mineflayer Viewer";
    iframe.classList = ["viewer-frame"];
        
    viewerContainer.appendChild(iframe);
    addLog('Viewer instantiated.');
}

function stopBot() {
    // Remove viewer frame
    const viewerFrame = viewerContainer.querySelector('.viewer-frame');
    if (viewerFrame) {
        viewerFrame.remove();
    }

    // Clear chat messages
    chatMessages.innerHTML = '';

    // Clear logs
    logs.innerHTML = '';

    // Reset login button
    loginBtn.disabled = false;

    addLog('Bot stopped and viewer removed.');
}

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('sendMessage', message);
        messageInput.value = '';
    }
}

socket.on('message', (message) => {
    console.log('Received message:', message);
    if (message.type === 'chat') {
        addChatMessage(message.content);
    } else if (message.type === 'log') {
        addLog(message.content);
    }
});

socket.on('loginMessage', (message) => {
    console.log('Received login message:', message);
    loginLinkContainer.innerHTML = '';
    const lines = message.split('\n');
    lines.forEach(line => {
        const p = document.createElement('p');
        if (line.includes('https://www.microsoft.com/link') || line.includes('http://microsoft.com/link')) {
            const words = line.split(' ');
            words.forEach(word => {
                if (word.startsWith('http')) {
                    const linkElement = document.createElement('a');
                    linkElement.href = word;
                    linkElement.target = '_blank';
                    linkElement.textContent = word;
                    p.appendChild(linkElement);
                } else {
                    p.appendChild(document.createTextNode(word + ' '));
                }
            });
        } else {
            p.textContent = line;
        }
        loginLinkContainer.appendChild(p);
    });
    addLog('Microsoft login link generated. Follow the instructions to authenticate.');
});

function addChatMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addLog(message) {
    console.log('Adding log:', message);
    const logElement = document.createElement('div');
    logElement.textContent = message;
    logs.appendChild(logElement);
    logs.scrollTop = logs.scrollHeight;
}

// Debug: Log all received events
socket.onAny((eventName, ...args) => {
    console.log(`Received event "${eventName}":`, args);
});
