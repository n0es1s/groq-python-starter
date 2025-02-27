// Update displayed values for sliders
document.getElementById('temperature').addEventListener('input', function(e) {
    document.getElementById('temperatureValue').textContent = e.target.value;
  });
  
  document.getElementById('top_p').addEventListener('input', function(e) {
    document.getElementById('topPValue').textContent = e.target.value;
  });
  
  function clearChat() {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.innerHTML = '';
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
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    messageDiv.textContent = content;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
  
  async function sendMessage(event) {
    event.preventDefault();
    const input = document.getElementById('message-input');
    const message = input.value;
    
    if (!message) return;
  
    addMessage(message, true);
    input.value = '';
  
    try {
      const formData = new FormData();
      formData.append('message', message);
      
      // Add parameters to formData
      const params = getParameters();
      Object.keys(params).forEach(key => {
        formData.append(key, params[key]);
      });
      
      const response = await fetch('/chat', {
        method: 'POST',
        body: formData
      });
      
      const text = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const botResponse = doc.querySelector('p').textContent;
      
      addMessage(botResponse, false);
    } catch (error) {
      console.error('Error:', error);
      addMessage('Error: Could not send message', false);
    }
  }