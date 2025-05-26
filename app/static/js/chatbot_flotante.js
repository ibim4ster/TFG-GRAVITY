document.addEventListener('DOMContentLoaded', function() {
    const chatToggleBtn = document.getElementById('chatToggleBtn');
    const chatWindow = document.getElementById('chatWindow');
    const minimizeChat = document.getElementById('minimizeChat');
    const chatForm = document.getElementById('chatForm');
    const userMessageInput = document.getElementById('userMessage');
    const chatMessages = document.getElementById('chatMessages');
    const typingIndicator = document.getElementById('typingIndicator');
    const chatNotification = document.getElementById('chatNotification');
    
    // Toggle chat window visibility
    chatToggleBtn.addEventListener('click', function() {
        chatWindow.classList.toggle('open');
        
        // Hide notification when opening chat
        if (chatWindow.classList.contains('open')) {
            chatNotification.style.display = 'none';
        }
    });
    
    // Minimize chat window
    minimizeChat.addEventListener('click', function() {
        chatWindow.classList.remove('open');
    });
    
    // Function to add a message to the chat
    function addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(isUser ? 'user-message' : 'ai-message');
        
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');
        
        const paragraph = document.createElement('p');
        paragraph.textContent = message;
        
        contentDiv.appendChild(paragraph);
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to the bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Handle form submission
    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const userMessage = userMessageInput.value.trim();
        if (!userMessage) return;
        
        // Add user message to chat
        addMessage(userMessage, true);
        
        // Clear input field
        userMessageInput.value = '';
        
        // Show typing indicator
        typingIndicator.style.display = 'block';
        
        // Send message to backend
        fetch('/chatbot/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: userMessage }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Hide typing indicator
            typingIndicator.style.display = 'none';
            
            // Add AI response to chat
            addMessage(data.response);
        })
        .catch(error => {
            // Hide typing indicator
            typingIndicator.style.display = 'none';
            
            // Show error message
            addMessage('Lo siento, ha ocurrido un error al procesar tu solicitud.');
            console.error('Error:', error);
        });
    });
    
    // Load chat history when the page loads
    fetch('/chatbot/history')
        .then(response => response.json())
        .then(history => {
            // If there's history, clear the welcome message
            if (history.length > 0) {
                chatMessages.innerHTML = '';
                
                // Add the messages to the chat (last 3)
                history.slice(0, 3).reverse().forEach(item => {
                    addMessage(item.user_message, true);
                    addMessage(item.ai_response);
                });
            } else {
                // Show notification for new users
                chatNotification.style.display = 'flex';
            }
        })
        .catch(error => {
            console.error('Error loading history:', error);
        });
    
    // Save chat state in local storage
    function saveChatState() {
        const isOpen = chatWindow.classList.contains('open');
        localStorage.setItem('chatWindowOpen', isOpen);
    }
    
    // Restore chat state from local storage
    function restoreChatState() {
        const isOpen = localStorage.getItem('chatWindowOpen') === 'true';
        if (isOpen) {
            chatWindow.classList.add('open');
            chatNotification.style.display = 'none';
        }
    }
    
    // Save state when toggling
    chatToggleBtn.addEventListener('click', saveChatState);
    minimizeChat.addEventListener('click', saveChatState);
    
    // Restore state on load
    restoreChatState();
});