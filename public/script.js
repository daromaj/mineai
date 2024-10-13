const socket = io();

const loginBtn = document.getElementById('loginBtn');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const logs = document.getElementById('logs');
const loginLinkContainer = document.getElementById('loginLinkContainer');

loginBtn.addEventListener('click', () => {
    socket.emit('login');
    loginBtn.disabled = true;
    addLog('Logging in...');
});

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
