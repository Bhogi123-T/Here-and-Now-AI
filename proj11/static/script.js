// Global State Management
class ChatState {
    constructor() {
        this.currentStatus = 'general';
        this.recognition = null;
        this.isRecording = false;
        this.messages = [];
        this.isWelcomeVisible = true;
    }
}

const chatState = new ChatState();

// DOM Elements Cache
const elements = {
    // Input elements
    pdfUpload: document.getElementById('pdf-upload'),
    userInput: document.getElementById('user-input'),
    charCount: document.getElementById('char-count'),
    
    // Container elements
    messagesContainer: document.getElementById('messages-container'),
    messagesList: document.getElementById('messages-list'),
    welcomeScreen: document.getElementById('welcome-screen'),
    
    // Status elements
    statusIndicator: document.getElementById('status-indicator'),
    uploadStatus: document.getElementById('upload-status'),
    
    // Modal elements
    loadingOverlay: document.getElementById('loading-overlay'),
    voiceModal: document.getElementById('voice-modal'),
    
    // Button elements
    sendBtn: document.getElementById('send-btn'),
    clearBtn: document.getElementById('clear-btn'),
    uploadBtn: document.getElementById('upload-btn'),
    voiceBtn: document.getElementById('voice-btn'),
    stopVoiceBtn: document.getElementById('stop-voice-btn')
};

// Utility Functions
const utils = {
    getCurrentTime() {
        return new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    },

    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    scrollToBottom() {
        if (elements.messagesContainer) {
            elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
        }
    },

    addAnimation(element, animation = 'fade-in') {
        if (element) {
            element.classList.add(animation);
            setTimeout(() => element.classList.remove(animation), 300);
        }
    }
};

// UI Management
const ui = {
    showLoading() {
        if (elements.loadingOverlay) {
            elements.loadingOverlay.style.display = 'flex';
        }
    },

    hideLoading() {
        if (elements.loadingOverlay) {
            elements.loadingOverlay.style.display = 'none';
        }
    },

    showWelcome() {
        if (elements.welcomeScreen) {
            elements.welcomeScreen.classList.remove('hidden');
            chatState.isWelcomeVisible = true;
        }
    },

    hideWelcome() {
        if (elements.welcomeScreen) {
            elements.welcomeScreen.classList.add('hidden');
            chatState.isWelcomeVisible = false;
        }
    },

    updateCharCounter() {
        if (!elements.userInput || !elements.charCount) return;
        
        const count = elements.userInput.value.length;
        elements.charCount.textContent = count;
        
        // Color coding
        if (count > 1800) {
            elements.charCount.style.color = 'var(--error-color)';
        } else if (count > 1500) {
            elements.charCount.style.color = 'var(--warning-color)';
        } else {
            elements.charCount.style.color = 'var(--text-muted)';
        }
    },

    updateSendButton() {
        if (!elements.sendBtn || !elements.userInput) return;
        
        const hasText = elements.userInput.value.trim().length > 0;
        elements.sendBtn.disabled = !hasText;
    },

    autoResizeTextarea() {
        if (!elements.userInput) return;
        
        elements.userInput.style.height = 'auto';
        elements.userInput.style.height = Math.min(elements.userInput.scrollHeight, 120) + 'px';
    },

    showUploadStatus(message, type = 'info') {
        if (!elements.uploadStatus) return;
        
        elements.uploadStatus.textContent = message;
        elements.uploadStatus.className = `upload-notification ${type}`;
        
        // Auto hide after 5 seconds for non-error messages
        if (type !== 'error') {
            setTimeout(() => {
                elements.uploadStatus.textContent = '';
                elements.uploadStatus.className = 'upload-notification';
            }, 5000);
        }
    }
};

// Message Management
const messageManager = {
    addUserMessage(text) {
        if (!elements.messagesList) return;
        
        // Hide welcome screen on first message
        if (chatState.isWelcomeVisible) {
            ui.hideWelcome();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'user-message';
        messageDiv.innerHTML = `
            <div class="user-message-content">
                <div class="message-text">${this.escapeHtml(text)}</div>
                <div class="message-time">${utils.getCurrentTime()}</div>
            </div>
        `;
        
        elements.messagesList.appendChild(messageDiv);
        utils.addAnimation(messageDiv, 'slide-up');
        utils.scrollToBottom();
        
        chatState.messages.push({
            type: 'user',
            content: text,
            timestamp: new Date()
        });
    },

    addBotMessage(content, timestamp = null) {
        if (!elements.messagesList) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'bot-message';
        messageDiv.innerHTML = `
            <div class="bot-avatar">
                <img src="/static/nexo.jpg" alt="NEXA AI">
            </div>
            <div class="bot-message-content">
                <div class="message-text">${this.formatBotResponse(content)}</div>
                <div class="message-time">${timestamp || utils.getCurrentTime()}</div>
            </div>
        `;
        
        elements.messagesList.appendChild(messageDiv);
        utils.addAnimation(messageDiv, 'slide-up');
        utils.scrollToBottom();
        
        chatState.messages.push({
            type: 'bot',
            content: content,
            timestamp: new Date()
        });
    },

    addSystemMessage(content) {
        if (!elements.messagesList) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'system-message';
        messageDiv.innerHTML = `
            <div class="system-message-content">${this.escapeHtml(content)}</div>
        `;
        
        elements.messagesList.appendChild(messageDiv);
        utils.addAnimation(messageDiv, 'fade-in');
        utils.scrollToBottom();
    },

    clearMessages() {
        if (elements.messagesList) {
            elements.messagesList.innerHTML = '';
        }
        chatState.messages = [];
        ui.showWelcome();
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    formatBotResponse(content) {
        // Basic markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }
};

// Speech Recognition
const speechRecognition = {
    init() {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            if (elements.voiceBtn) {
                elements.voiceBtn.style.display = 'none';
            }
            console.warn('Speech recognition not supported');
            return;
        }

        chatState.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        
        Object.assign(chatState.recognition, {
            continuous: true,
            interimResults: true,
            lang: 'en-US'
        });

        this.setupEventListeners();
    },

    setupEventListeners() {
        if (!chatState.recognition) return;

        chatState.recognition.onstart = () => {
            chatState.isRecording = true;
            if (elements.voiceBtn) elements.voiceBtn.classList.add('voice-recording');
            if (elements.voiceModal) elements.voiceModal.style.display = 'flex';
        };

        chatState.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            if (elements.userInput) {
                elements.userInput.value = finalTranscript + interimTranscript;
                ui.autoResizeTextarea();
                ui.updateCharCounter();
                ui.updateSendButton();
            }
        };

        chatState.recognition.onend = () => this.stop();
        chatState.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.stop();
            messageManager.addSystemMessage('❌ Voice recognition error. Please try again.');
        };
    },

    start() {
        if (chatState.recognition && !chatState.isRecording) {
            try {
                chatState.recognition.start();
            } catch (error) {
                console.error('Failed to start speech recognition:', error);
            }
        }
    },

    stop() {
        if (chatState.recognition && chatState.isRecording) {
            chatState.recognition.stop();
        }
        
        chatState.isRecording = false;
        if (elements.voiceBtn) elements.voiceBtn.classList.remove('voice-recording');
        if (elements.voiceModal) elements.voiceModal.style.display = 'none';
    }
};

// File Upload Management
const fileUpload = {
    init() {
        if (elements.uploadBtn) {
            elements.uploadBtn.addEventListener('click', () => this.triggerUpload());
        }
        
        if (elements.pdfUpload) {
            elements.pdfUpload.addEventListener('change', (e) => this.handleFileChange(e));
        }
    },

    triggerUpload() {
        if (elements.pdfUpload) {
            elements.pdfUpload.click();
        }
    },

    async handleFileChange(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.pdf')) {
            ui.showUploadStatus('❌ Please select a PDF file', 'error');
            this.resetFileInput();
            return;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            ui.showUploadStatus('❌ File too large. Maximum size is 10MB', 'error');
            this.resetFileInput();
            return;
        }

        await this.uploadFile(file);
    },

    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        ui.showLoading();
        ui.showUploadStatus(`📤 Uploading ${file.name} (${utils.formatFileSize(file.size)})...`);

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            ui.hideLoading();
            
            if (data.success) {
                ui.showUploadStatus(`✅ ${data.message}`, 'success');
                statusManager.update();
                messageManager.addSystemMessage(
                    `📄 PDF "${data.filename}" processed successfully with ${data.pages} pages!`
                );
            } else {
                ui.showUploadStatus(`❌ ${data.error}`, 'error');
            }
        } catch (error) {
            ui.hideLoading();
            console.error('Upload error:', error);
            ui.showUploadStatus('❌ Upload failed. Please try again.', 'error');
        }

        this.resetFileInput();
    },

    resetFileInput() {
        if (elements.pdfUpload) {
            elements.pdfUpload.value = '';
        }
    }
};

// Status Management
const statusManager = {
    async update() {
        try {
            const response = await fetch('/status');
            const data = await response.json();
            
            if (elements.statusIndicator) {
                const statusText = elements.statusIndicator.querySelector('.status-text');
                const statusIcon = elements.statusIndicator.querySelector('i');
                
                if (statusText) {
                    statusText.textContent = data.mode === 'pdf' ? 'PDF Mode' : 'General Mode';
                }
                
                if (statusIcon) {
                    statusIcon.className = data.mode === 'pdf' ? 'fas fa-file-pdf' : 'fas fa-brain';
                }
                
                chatState.currentStatus = data.mode;
            }
        } catch (error) {
            console.error('Status update error:', error);
        }
    }
};

// Chat Management
const chatManager = {
    async sendMessage() {
        if (!elements.userInput) return;

        const question = elements.userInput.value.trim();
        if (!question) return;

        // Add user message
        messageManager.addUserMessage(question);

        // Clear input and update UI
        elements.userInput.value = '';
        ui.autoResizeTextarea();
        ui.updateCharCounter();
        ui.updateSendButton();
        
        // Show loading
        ui.showLoading();

        try {
            const response = await fetch('/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question })
            });

            const data = await response.json();
            ui.hideLoading();

            if (data.error) {
                messageManager.addBotMessage(`❌ ${data.error}`, data.timestamp);
            } else {
                const fullResponse = data.prefix ? `${data.prefix}${data.answer}` : data.answer;
                messageManager.addBotMessage(fullResponse, data.timestamp);
            }
        } catch (error) {
            ui.hideLoading();
            console.error('Send message error:', error);
            messageManager.addBotMessage('❌ Failed to get response. Please try again.');
        }
    },

    async clearChat() {
        const confirmed = confirm('Are you sure you want to clear all data? This will remove uploaded PDFs and chat history.');
        if (!confirmed) return;

        ui.showLoading();

        try {
            const response = await fetch('/clear', { method: 'POST' });
            const data = await response.json();

            ui.hideLoading();

            if (data.success) {
                messageManager.clearMessages();
                ui.showUploadStatus('');
                statusManager.update();
                messageManager.addSystemMessage(data.message);
            } else {
                messageManager.addSystemMessage('❌ Failed to clear data. Please try again.');
            }
        } catch (error) {
            ui.hideLoading();
            console.error('Clear chat error:', error);
            messageManager.addSystemMessage('❌ Failed to clear data. Please try again.');
        }
    }
};

// Global Functions (for HTML onclick handlers)
window.showSampleQuestion = (question) => {
    if (elements.userInput) {
        elements.userInput.value = question;
        ui.autoResizeTextarea();
        ui.updateCharCounter();
        ui.updateSendButton();
        elements.userInput.focus();
    }
};

// Event Listeners Setup
const setupEventListeners = () => {
    // Input events
    if (elements.userInput) {
        elements.userInput.addEventListener('input', () => {
            ui.autoResizeTextarea();
            ui.updateCharCounter();
            ui.updateSendButton();
        });

        elements.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                chatManager.sendMessage();
            }
        });

        // Focus input on page load
        elements.userInput.focus();
    }

    // Button events
    if (elements.sendBtn) {
        elements.sendBtn.addEventListener('click', () => chatManager.sendMessage());
    }

    if (elements.clearBtn) {
        elements.clearBtn.addEventListener('click', () => chatManager.clearChat());
    }

    if (elements.voiceBtn) {
        elements.voiceBtn.addEventListener('click', () => {
            if (chatState.isRecording) {
                speechRecognition.stop();
            } else {
                speechRecognition.start();
            }
        });
    }

    if (elements.stopVoiceBtn) {
        elements.stopVoiceBtn.addEventListener('click', () => speechRecognition.stop());
    }

    // Modal events
    if (elements.voiceModal) {
        elements.voiceModal.addEventListener('click', (e) => {
            if (e.target === elements.voiceModal) {
                speechRecognition.stop();
            }
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K to focus input
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            elements.userInput?.focus();
        }
        
        // Escape to stop voice recording
        if (e.key === 'Escape' && chatState.isRecording) {
            speechRecognition.stop();
        }
    });
};

// Initialization
const init = () => {
    console.log('Initializing NEXA AI Chat Interface...');
    
    // Initialize components
    statusManager.update();
    speechRecognition.init();
    fileUpload.init();
    
    // Setup UI
    ui.updateCharCounter();
    ui.updateSendButton();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('NEXA AI Chat Interface initialized successfully');
};

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && chatState.isRecording) {
        speechRecognition.stop();
    }
});

// Handle beforeunload
window.addEventListener('beforeunload', () => {
    if (chatState.isRecording) {
        speechRecognition.stop();
    }
});
