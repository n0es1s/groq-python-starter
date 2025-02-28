document.addEventListener('DOMContentLoaded', function() {
  // Set up range input display values
  document.getElementById('temperature').addEventListener('input', function(e) {
    document.getElementById('temperatureValue').textContent = e.target.value;
  });
  
  document.getElementById('top_p').addEventListener('input', function(e) {
    document.getElementById('topPValue').textContent = e.target.value;
  });
  
  // Handle sidebar toggling with the new approach
  const toggleSidebarBtn = document.getElementById('toggle-sidebar');
  const expandSidebarBtn = document.getElementById('expand-sidebar');
  const settingsTab = document.getElementById('settings-tab');
  
  if (toggleSidebarBtn) {
    toggleSidebarBtn.addEventListener('click', function() {
      document.body.classList.add('sidebar-hidden');
      settingsTab.classList.remove('hidden');
    });
  }
  
  if (expandSidebarBtn) {
    expandSidebarBtn.addEventListener('click', function() {
      document.body.classList.remove('sidebar-hidden');
      settingsTab.classList.add('hidden');
    });
  }
  
  // Handle accordions
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  accordionHeaders.forEach(header => {
    header.addEventListener('click', function() {
      const accordion = this.parentElement;
      const wasActive = accordion.classList.contains('active');
      
      // Close all accordions first
      document.querySelectorAll('.accordion').forEach(acc => {
        acc.classList.remove('active');
        acc.querySelector('.accordion-content').style.display = 'none';
        const icon = acc.querySelector('.accordion-icon');
        icon.classList.remove('bi-chevron-up');
        icon.classList.add('bi-chevron-down');
      });
      
      // If the clicked accordion wasn't active, open it
      if (!wasActive) {
        accordion.classList.add('active');
        this.nextElementSibling.style.display = 'block';
        this.querySelector('.accordion-icon').classList.remove('bi-chevron-down');
        this.querySelector('.accordion-icon').classList.add('bi-chevron-up');
      }
    });
  });
  
  // Activate the first accordion by default
  if (accordionHeaders.length > 0) {
    accordionHeaders[0].click();
  }
  
  // Add event listener for reasoning format changes
  document.getElementById('reasoning_format').addEventListener('change', function() {
    const reasoningContainers = document.querySelectorAll('.reasoning-container');
    
    if (this.value === 'none') {
      reasoningContainers.forEach(container => container.style.display = 'none');
    } else {
      reasoningContainers.forEach(container => container.style.display = 'block');
    }
  });
});

function clearChat() {
  const chatContainer = document.getElementById('chat-container');
  // Add welcome message back that matches the original one
  chatContainer.innerHTML = `
    <div class="welcome-message">
      <h2>Welcome to Groq API Model Playground</h2>
      <p>Select your model and chat parameters in the left sidebar, and send a message below to get started!</p>
      <div class="branding">
        <a href="https://groq.com" target="_blank" rel="noopener noreferrer">
          <img
            src="https://groq.com/wp-content/uploads/2024/03/PBG-mark1-color.svg"
            alt="Powered by Groq"
          />
        </a>
      </div>
    </div>
  `;
  
  // Hide token stats when starting a new chat
  document.getElementById('token-stats').classList.add('hidden');
  
  // Clear server-side conversation history
  fetch('/clear-chat', { method: 'POST' });
}

function getParameters() {
  return {
    model: document.getElementById('model').value,
    temperature: parseFloat(document.getElementById('temperature').value),
    max_tokens: parseInt(document.getElementById('max_tokens').value),
    top_p: parseFloat(document.getElementById('top_p').value),
    stream: document.getElementById('stream').checked,
    reasoning_format: document.getElementById('reasoning_format').value,
    system_prompt: document.getElementById('system_prompt').value
  };
}

function addMessage(content, isUser) {
  const chatContainer = document.getElementById('chat-container');
  
  // Check if welcome message exists and remove it
  const welcomeMessage = document.querySelector('.welcome-message');
  if (welcomeMessage) {
    welcomeMessage.remove();
  }
  
  if (isUser) {
    // User message with avatar
    const messageContainer = document.createElement('div');
    messageContainer.className = 'message-container user-container';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.textContent = content;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar user-avatar';
    avatarDiv.innerHTML = '<i class="bi bi-person-fill"></i>';
    
    messageContainer.appendChild(messageDiv);
    messageContainer.appendChild(avatarDiv);
    chatContainer.appendChild(messageContainer);
  } else {
    // Check for thinking section
    const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>([\s\S]*)/);
    
    if (thinkMatch && thinkMatch.length >= 3) {
      // Create container for thinking and response
      const containerDiv = document.createElement('div');
      containerDiv.className = 'bot-message-container';
      
      // Create thinking section
      const thinkingDiv = document.createElement('div');
      thinkingDiv.className = 'thinking-section';
      if (document.getElementById('reasoning_format').value === 'none') {
        thinkingDiv.classList.add('hidden-thinking');
      }
      
      // Convert newlines for proper display
      const thinkContent = thinkMatch[1].trim();
      thinkingDiv.innerHTML = thinkContent.replace(/\n/g, '<br>');
      containerDiv.appendChild(thinkingDiv);
     
      // Create the message container with avatar
      const messageContainer = document.createElement('div');
      messageContainer.className = 'message-container bot-container';
      
      // Create the avatar
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'message-avatar bot-avatar';
      avatarDiv.innerHTML = '<i class="bi bi-robot"></i>';
      
      // Create response message
      const responseDiv = document.createElement('div');
      responseDiv.className = 'message bot-message';
      const responseContent = thinkMatch[2].trim();
      responseDiv.innerHTML = responseContent.replace(/\n/g, '<br>');
      
      messageContainer.appendChild(avatarDiv);
      messageContainer.appendChild(responseDiv);
      
      containerDiv.appendChild(messageContainer);
      chatContainer.appendChild(containerDiv);
    } else {
      // Regular bot message without thinking
      const messageContainer = document.createElement('div');
      messageContainer.className = 'message-container bot-container';
      
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'message-avatar bot-avatar';
      avatarDiv.innerHTML = '<i class="bi bi-robot"></i>';
      
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message bot-message';
      messageDiv.innerHTML = content.replace(/\n/g, '<br>');
      
      messageContainer.appendChild(avatarDiv);
      messageContainer.appendChild(messageDiv);
      chatContainer.appendChild(messageContainer);
    }
  }
  
  // Scroll to bottom
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function updateTokenStats(stats) {
  // Get elements
  const tokenStatsDiv = document.getElementById('token-stats');
  const totalTokensElem = document.getElementById('total-tokens');
  const tokensPerSecondElem = document.getElementById('tokens-per-second');
  
  // Update the stats
  totalTokensElem.textContent = stats.total_tokens.toLocaleString();
  tokensPerSecondElem.textContent = stats.tokens_per_second.toLocaleString(undefined, {
    maximumFractionDigits: 2
  });
  
  // Show the stats
  tokenStatsDiv.classList.remove('hidden');
}

async function sendMessage(event) {
  event.preventDefault();
  const input = document.getElementById('message-input');
  const message = input.value;
  
  if (!message) return;

  // Check if welcome message exists and remove it
  const welcomeMessage = document.querySelector('.welcome-message');
  if (welcomeMessage) {
    welcomeMessage.remove();
  }

  // Add user message to chat
  addMessage(message, true);
  input.value = '';

  // Hide previous token stats when sending a new message
  document.getElementById('token-stats').classList.add('hidden');
  
  // Show typing indicator
  document.getElementById('typing-indicator').classList.remove('hidden');

  try {
    const formData = new FormData();
    formData.append('message', message);
    
    // Add parameters to formData
    const params = getParameters();
    Object.keys(params).forEach(key => {
      formData.append(key, params[key]);
    });
    
    if (params.stream) {
      // Handle streaming response
      const response = await fetch('/chat', {
        method: 'POST',
        body: formData
      });
      
      // Set up for streaming
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let botMessageContainer = null;
      
      // Process stream chunks
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const jsonStr = line.substring(5).trim();
              const data = JSON.parse(jsonStr);
              
              if (data.chunk) {
                // Update the full response
                fullResponse = data.full_response;
                
                // Update token stats if provided
                if (data.stats) {
                  updateTokenStats(data.stats);
                }
                
                // Check if there's a thinking tag in the content
                const thinkMatch = fullResponse.match(/<think>([\s\S]*?)<\/think>([\s\S]*)/);
                
                // Only create a new container for the first chunk
                if (!botMessageContainer) {
                  // Create a new container for this response
                  botMessageContainer = document.createElement('div');
                  botMessageContainer.className = 'bot-message-container';
                  document.getElementById('chat-container').appendChild(botMessageContainer);
                }
                
                // Clear the container and rebuild it
                botMessageContainer.innerHTML = '';
                
                // Add a new condition to handle responses with only opening <think> tag
                if (!thinkMatch && fullResponse.includes('<think>')) {
                  // Extract content from the unclosed think tag
                  const thinkContent = fullResponse.replace('<think>', '').trim();
                  
                  // Create regular message without thinking section
                  const messageContainer = document.createElement('div');
                  messageContainer.className = 'message-container bot-container';
                  
                  const avatarDiv = document.createElement('div');
                  avatarDiv.className = 'message-avatar bot-avatar';
                  avatarDiv.innerHTML = '<i class="bi bi-robot"></i>';
                  
                  const messageDiv = document.createElement('div');
                  messageDiv.className = 'message bot-message';
                  messageDiv.innerHTML = thinkContent.replace(/\n/g, '<br>');
                  
                  messageContainer.appendChild(avatarDiv);
                  messageContainer.appendChild(messageDiv);
                  botMessageContainer.appendChild(messageContainer);
                } else if (thinkMatch && thinkMatch.length >= 3) {
                  // We have thinking content and response content
                  const thinkingContent = thinkMatch[1].trim();
                  const responseContent = thinkMatch[2].trim();
                  
                  // Add thinking section
                  const thinkingDiv = document.createElement('div');
                  thinkingDiv.className = 'thinking-section';
                  if (document.getElementById('reasoning_format').value === 'none') {
                    thinkingDiv.classList.add('hidden-thinking');
                  }
                  thinkingDiv.innerHTML = thinkingContent.replace(/\n/g, '<br>');
                  botMessageContainer.appendChild(thinkingDiv);
                  
                  // Only add the message container if there's actual response content
                  if (responseContent) {
                    // Add message with avatar
                    const messageContainer = document.createElement('div');
                    messageContainer.className = 'message-container bot-container';
                    
                    const avatarDiv = document.createElement('div');
                    avatarDiv.className = 'message-avatar bot-avatar';
                    avatarDiv.innerHTML = '<i class="bi bi-robot"></i>';
                    
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message bot-message';
                    messageDiv.innerHTML = responseContent.replace(/\n/g, '<br>');
                    
                    messageContainer.appendChild(avatarDiv);
                    messageContainer.appendChild(messageDiv);
                    botMessageContainer.appendChild(messageContainer);
                  }
                } else {
                  // Regular message without thinking
                  const messageContainer = document.createElement('div');
                  messageContainer.className = 'message-container bot-container';
                  
                  const avatarDiv = document.createElement('div');
                  avatarDiv.className = 'message-avatar bot-avatar';
                  avatarDiv.innerHTML = '<i class="bi bi-robot"></i>';
                  
                  const messageDiv = document.createElement('div');
                  messageDiv.className = 'message bot-message';
                  messageDiv.innerHTML = fullResponse.replace(/\n/g, '<br>');
                  
                  messageContainer.appendChild(avatarDiv);
                  messageContainer.appendChild(messageDiv);
                  botMessageContainer.appendChild(messageContainer);
                }
                
                // Scroll to bottom
                const chatContainer = document.getElementById('chat-container');
                chatContainer.scrollTop = chatContainer.scrollHeight;
              }
            } catch (err) {
              console.error('Error parsing SSE data:', err);
            }
          }
        }
      }
    } else {
      // Non-streaming response
      const response = await fetch('/chat', {
        method: 'POST',
        body: formData
      });
      
      const responseHtml = await response.text();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = responseHtml;
      
      // Get the content and token stats
      const content = tempDiv.querySelector('p').innerHTML.trim();
      const statsDiv = tempDiv.querySelector('div');
      const totalTokens = parseInt(statsDiv.getAttribute('data-total-tokens'));
      const tokensPerSecond = parseFloat(statsDiv.getAttribute('data-tokens-per-second'));
      
      // Add message to chat
      addMessage(content, false);
      
      // Update token stats
      updateTokenStats({
        total_tokens: totalTokens,
        tokens_per_second: tokensPerSecond
      });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    addMessage('Sorry, there was an error processing your request. Please try again.', false);
  } finally {
    // Hide typing indicator
    document.getElementById('typing-indicator').classList.add('hidden');
  }
}