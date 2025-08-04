// Emoji picker and reaction functionality
class EmojiManager {
    constructor() {
        this.emojiData = {
            smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
            people: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
            nature: ['🌱', '🌿', '🍀', '🍃', '🌾', '🌵', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🍃', '🌾', '🌵', '🌲', '🌳', '🌴', '🏔️', '⛰️', '🌋', '🗻', '🏞️', '🏜️', '🏖️', '🏝️', '🌅', '🌄', '🌠'],
            food: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔'],
            activities: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️'],
            travel: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞'],
            objects: ['💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚙️', '🪚', '🔫', '🧱', '💣', '🧨'],
            symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐'],
            flags: ['🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️', '🇦🇨', '🇦🇩', '🇦🇪', '🇦🇫', '🇦🇬', '🇦🇮', '🇦🇱', '🇦🇲', '🇦🇴', '🇦🇶', '🇦🇷', '🇦🇸', '🇦🇹', '🇦🇺', '🇦🇼', '🇦🇽', '🇦🇿', '🇧🇦', '🇧🇧', '🇧🇩', '🇧🇪', '🇧🇫']
        };
        
        this.currentCategory = 'smileys';
        this.isPickerVisible = false;
        this.currentTargetElement = null;
        this.currentMessageId = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.populateEmojiPicker();
    }

    setupEventListeners() {
        // Emoji category navigation
        document.querySelectorAll('.emoji-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.switchCategory(category);
            });
        });

        // Close emoji picker when clicking outside
        document.addEventListener('click', (e) => {
            const emojiPicker = document.getElementById('emojiPicker');
            const emojiBtn = document.getElementById('emojiBtn');
            
            if (this.isPickerVisible && 
                !emojiPicker.contains(e.target) && 
                !emojiBtn.contains(e.target) &&
                !e.target.closest('.message-action-btn[data-action="react"]')) {
                this.hideEmojiPicker();
            }
        });

        // Handle emoji selection
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('emoji-item')) {
                this.selectEmoji(e.target.textContent);
            }
        });
    }

    populateEmojiPicker() {
        const emojiGrid = document.getElementById('emojiGrid');
        if (!emojiGrid) return;

        this.renderEmojiGrid(this.currentCategory);
    }

    renderEmojiGrid(category) {
        const emojiGrid = document.getElementById('emojiGrid');
        const emojis = this.emojiData[category] || this.emojiData.smileys;

        emojiGrid.innerHTML = emojis.map(emoji => 
            `<button class="emoji-item" title="${emoji}">${emoji}</button>`
        ).join('');
    }

    switchCategory(category) {
        // Update active category button
        document.querySelectorAll('.emoji-category').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');

        // Update current category and render emojis
        this.currentCategory = category;
        this.renderEmojiGrid(category);
    }

    toggleEmojiPicker(triggerElement) {
        const emojiPicker = document.getElementById('emojiPicker');
        
        if (this.isPickerVisible) {
            this.hideEmojiPicker();
        } else {
            this.showEmojiPicker(triggerElement);
        }
    }

    showEmojiPicker(triggerElement) {
        const emojiPicker = document.getElementById('emojiPicker');
        
        // Position the picker
        const rect = triggerElement.getBoundingClientRect();
        const pickerHeight = 400;
        const pickerWidth = 320;
        
        // Calculate position
        let top = rect.top - pickerHeight - 10;
        let left = rect.left;
        
        // Adjust if picker would go off screen
        if (top < 10) {
            top = rect.bottom + 10;
        }
        
        if (left + pickerWidth > window.innerWidth - 10) {
            left = window.innerWidth - pickerWidth - 10;
        }
        
        if (left < 10) {
            left = 10;
        }
        
        emojiPicker.style.position = 'fixed';
        emojiPicker.style.top = `${top}px`;
        emojiPicker.style.left = `${left}px`;
        emojiPicker.classList.remove('hidden');
        
        this.isPickerVisible = true;
        this.currentTargetElement = triggerElement;
    }

    hideEmojiPicker() {
        const emojiPicker = document.getElementById('emojiPicker');
        emojiPicker.classList.add('hidden');
        
        this.isPickerVisible = false;
        this.currentTargetElement = null;
        this.currentMessageId = null;
    }

    selectEmoji(emoji) {
        if (this.currentMessageId) {
            // Adding reaction to message
            this.addReactionToMessage(this.currentMessageId, emoji);
        } else if (this.currentTargetElement) {
            // Adding emoji to message input
            this.insertEmojiIntoInput(emoji);
        }
        
        this.hideEmojiPicker();
    }

    insertEmojiIntoInput(emoji) {
        const messageInput = document.getElementById('messageInput');
        if (!messageInput) return;

        const start = messageInput.selectionStart;
        const end = messageInput.selectionEnd;
        const text = messageInput.value;
        
        const newText = text.substring(0, start) + emoji + text.substring(end);
        messageInput.value = newText;
        
        // Set cursor position after emoji
        const newCursorPos = start + emoji.length;
        messageInput.setSelectionRange(newCursorPos, newCursorPos);
        messageInput.focus();
        
        // Trigger input event for auto-resize
        messageInput.dispatchEvent(new Event('input'));
    }

    addReactionToMessage(messageId, emoji) {
        // This will be handled by the chat manager
        window.chatManager?.toggleReaction(messageId, emoji);
    }

    showEmojiPickerForMessage(messageId, triggerElement) {
        this.currentMessageId = messageId;
        this.showEmojiPicker(triggerElement);
    }

    // Emoji search functionality
    searchEmojis(query) {
        if (!query.trim()) {
            this.renderEmojiGrid(this.currentCategory);
            return;
        }

        const searchResults = [];
        const searchTerm = query.toLowerCase();
        
        // Search through all categories
        Object.values(this.emojiData).forEach(categoryEmojis => {
            categoryEmojis.forEach(emoji => {
                // Simple search - could be enhanced with emoji names/descriptions
                if (this.getEmojiDescription(emoji).toLowerCase().includes(searchTerm)) {
                    searchResults.push(emoji);
                }
            });
        });

        const emojiGrid = document.getElementById('emojiGrid');
        emojiGrid.innerHTML = searchResults.map(emoji => 
            `<button class="emoji-item" title="${emoji}">${emoji}</button>`
        ).join('');
    }

    getEmojiDescription(emoji) {
        // Basic emoji descriptions - this could be expanded
        const descriptions = {
            '😀': 'grinning face happy smile',
            '😃': 'grinning face with big eyes happy',
            '😄': 'grinning face with smiling eyes happy',
            '😁': 'beaming face with smiling eyes happy',
            '😆': 'grinning squinting face laugh',
            '😅': 'grinning face with sweat nervous',
            '😂': 'face with tears of joy laugh cry',
            '🤣': 'rolling on the floor laughing rofl',
            '😊': 'smiling face with smiling eyes happy',
            '😇': 'smiling face with halo angel innocent',
            '❤️': 'red heart love',
            '💙': 'blue heart love',
            '💚': 'green heart love',
            '💛': 'yellow heart love',
            '💜': 'purple heart love',
            '🖤': 'black heart love',
            '🤍': 'white heart love',
            '👍': 'thumbs up good yes approve',
            '👎': 'thumbs down bad no disapprove',
            '👋': 'waving hand hello goodbye',
            '🔥': 'fire hot flame',
            '💯': 'hundred points symbol perfect'
        };
        
        return descriptions[emoji] || emoji;
    }

    // Frequently used emojis
    getFrequentlyUsed() {
        const stored = localStorage.getItem('frequentEmojis');
        return stored ? JSON.parse(stored) : ['😀', '😂', '❤️', '👍', '🔥'];
    }

    updateFrequentlyUsed(emoji) {
        let frequent = this.getFrequentlyUsed();
        
        // Remove if already exists
        frequent = frequent.filter(e => e !== emoji);
        
        // Add to beginning
        frequent.unshift(emoji);
        
        // Keep only top 30
        frequent = frequent.slice(0, 30);
        
        localStorage.setItem('frequentEmojis', JSON.stringify(frequent));
    }

    // Skin tone variations
    applySkinTone(baseEmoji, skinTone) {
        const skinToneModifiers = {
            'light': '🏻',
            'medium-light': '🏼',
            'medium': '🏽',
            'medium-dark': '🏾',
            'dark': '🏿'
        };
        
        return baseEmoji + (skinToneModifiers[skinTone] || '');
    }

    // Recent emojis
    addToRecent(emoji) {
        let recent = JSON.parse(localStorage.getItem('recentEmojis') || '[]');
        
        // Remove if already exists
        recent = recent.filter(e => e !== emoji);
        
        // Add to beginning
        recent.unshift(emoji);
        
        // Keep only last 20
        recent = recent.slice(0, 20);
        
        localStorage.setItem('recentEmojis', JSON.stringify(recent));
        this.updateFrequentlyUsed(emoji);
    }

    getRecentEmojis() {
        return JSON.parse(localStorage.getItem('recentEmojis') || '[]');
    }

    // Custom emoji support (for future enhancement)
    addCustomEmoji(name, url) {
        let customEmojis = JSON.parse(localStorage.getItem('customEmojis') || '{}');
        customEmojis[name] = url;
        localStorage.setItem('customEmojis', JSON.stringify(customEmojis));
    }

    getCustomEmojis() {
        return JSON.parse(localStorage.getItem('customEmojis') || '{}');
    }

    // Emoji autocomplete for message input
    setupEmojiAutocomplete() {
        const messageInput = document.getElementById('messageInput');
        if (!messageInput) return;

        messageInput.addEventListener('input', (e) => {
            const text = e.target.value;
            const cursorPos = e.target.selectionStart;
            
            // Find emoji shortcode pattern (:word:)
            const beforeCursor = text.substring(0, cursorPos);
            const match = beforeCursor.match(/:(\w+)$/);
            
            if (match) {
                this.showEmojiSuggestions(match[1], match.index, cursorPos);
            } else {
                this.hideEmojiSuggestions();
            }
        });
    }

    showEmojiSuggestions(query, startPos, endPos) {
        // Implementation for emoji suggestions dropdown
        // This would show a dropdown with matching emoji shortcodes
    }

    hideEmojiSuggestions() {
        // Hide the suggestions dropdown
    }

    // Emoji shortcodes
    getEmojiShortcodes() {
        return {
            ':smile:': '😊',
            ':grin:': '😀',
            ':joy:': '😂',
            ':heart:': '❤️',
            ':thumbsup:': '👍',
            ':thumbsdown:': '👎',
            ':fire:': '🔥',
            ':100:': '💯',
            ':wave:': '👋',
            ':clap:': '👏',
            ':ok:': '👌',
            ':pray:': '🙏',
            ':thinking:': '🤔',
            ':shrug:': '🤷',
            ':facepalm:': '🤦',
            ':sob:': '😭',
            ':sweat:': '😅',
            ':wink:': '😉',
            ':confused:': '😕',
            ':angry:': '😠'
        };
    }

    replaceShortcodes(text) {
        const shortcodes = this.getEmojiShortcodes();
        let result = text;
        
        Object.entries(shortcodes).forEach(([shortcode, emoji]) => {
            result = result.replace(new RegExp(shortcode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), emoji);
        });
        
        return result;
    }
}

// Initialize emoji manager
window.emojiManager = new EmojiManager();

// Add emoji picker functionality to chat manager
if (window.chatManager) {
    // Override the emoji button handler in chat manager
    const originalToggleEmojiPicker = window.chatManager.toggleEmojiPicker;
    window.chatManager.toggleEmojiPicker = function(triggerElement) {
        window.emojiManager.toggleEmojiPicker(triggerElement);
    };
    
    window.chatManager.showEmojiPickerForMessage = function(messageId, triggerElement) {
        window.emojiManager.showEmojiPickerForMessage(messageId, triggerElement);
    };
}