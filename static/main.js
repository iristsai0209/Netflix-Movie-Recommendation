let isWaitingForPreferences = false;
let preferences = {};

function addMessage(message, isUser = false) {
    const messagesDiv = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    // 如果是電影推薦，使用特殊格式
    if (message.includes('Title:') && message.includes('Description:')) {
        const lines = message.split('\n');
        let formattedMessage = '';
        lines.forEach(line => {
            if (line.trim()) {
                if (line.startsWith('Title:')) {
                    formattedMessage += `📽️ ${line}\n`;
                } else if (line.startsWith('Genre:')) {
                    formattedMessage += `🎭 ${line}\n`;
                } else if (line.startsWith('Cast:')) {
                    formattedMessage += `👥 ${line}\n`;
                } else if (line.startsWith('Year:')) {
                    formattedMessage += `📅 ${line}\n`;
                } else if (line.startsWith('Description:')) {
                    formattedMessage += `📝 ${line}\n`;
                } else {
                    formattedMessage += `${line}\n`;
                }
            }
        });
        messageContent.textContent = formattedMessage;
    } else {
        messageContent.textContent = message;
    }

    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    const now = new Date();
    timeDiv.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(timeDiv);
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// 當頁面載入時，自動添加歡迎訊息
window.onload = function() {
    addMessage("Welcome to moviebot, how can I help you?", false);
};

async function sendMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    addMessage(message, true);
    input.value = '';

    if (isWaitingForPreferences) {
        preferences[preferences.waitingFor] = message;
        await handleRecommendation();
        return;
    }

    const response = await fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message })
    });

    const data = await response.json();
    addMessage(data.response);

    if (data.action === 'start_recommendation') {
        isWaitingForPreferences = true;
        await handleRecommendation();
    }
}

async function handleRecommendation() {
    if (!preferences.cast) {
        addMessage("Do you have any favorite cast members in mind?");
        preferences.waitingFor = 'cast';
        return;
    }
    if (!preferences.genre) {
        addMessage("What genre would you like to watch?");
        preferences.waitingFor = 'genre';
        return;
    }
    if (!preferences.keywords) {
        addMessage("Please enter any keywords about the type of movie you're looking for:");
        preferences.waitingFor = 'keywords';
        return;
    }

    const response = await fetch('/recommend', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences)
    });

    const data = await response.json();
    
    if (data.recommendations.length === 0) {
        addMessage("Sorry, I couldn't find any movies matching your preferences.");
    } else {
        addMessage("Based on your preferences, here are some recommendations:");
        
        data.recommendations.forEach(movie => {
            const recommendation = `
Title: ${movie.title}
Genre: ${movie.genre}
Cast: ${movie.cast}
Year: ${movie.year}

Description: ${movie.description}

----------------------------------------`;
            addMessage(recommendation);
        });
    }

    // Reset for next recommendation
    isWaitingForPreferences = false;
    preferences = {};
}

document.getElementById('user-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
}); 