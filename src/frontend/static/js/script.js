document.getElementById('temperature').addEventListener('input', function(e) {
    document.getElementById('temperatureValue').textContent = e.target.value;
  });
  
  document.getElementById('top_p').addEventListener('input', function(e) {
    document.getElementById('topPValue').textContent = e.target.value;
  });
  
  function clearChat() {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.innerHTML = '';
    
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
    
    if (isUser) {
      // User message - simple display
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message user-message';
      messageDiv.textContent = content;
      chatContainer.appendChild(messageDiv);
    } else {
      // Bot message - check for thinking section
      const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>([\s\S]*)/);
      
      if (thinkMatch && thinkMatch.length >= 3) {
        // Create container for both thinking and response
        const containerDiv = document.createElement('div');
        containerDiv.className = 'bot-message-container';
        
        // Create thinking section with proper newline handling
        const thinkingDiv = document.createElement('div');
        thinkingDiv.className = 'thinking-section';
        // Check if reasoning format is set to none
        if (document.getElementById('reasoning_format').value === 'none') {
          thinkingDiv.classList.add('hidden-thinking');
        }
        
        // Convert newlines to <br> for proper display in the thinking section
        const thinkContent = thinkMatch[1].trim();
        thinkingDiv.innerHTML = thinkContent.replace(/\n/g, '<br>');
        containerDiv.appendChild(thinkingDiv);
        
        // Create actual response with proper newline handling
        const responseDiv = document.createElement('div');
        responseDiv.className = 'message bot-message bot-response';
        const responseContent = thinkMatch[2].trim();
        responseDiv.innerHTML = responseContent.replace(/\n/g, '<br>');
        containerDiv.appendChild(responseDiv);
        
        chatContainer.appendChild(containerDiv);
      } else {
        // Regular bot message without thinking section
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        // Convert newlines to <br> for all messages
        messageDiv.innerHTML = content.replace(/\n/g, '<br>');
        chatContainer.appendChild(messageDiv);
      }
    }
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
  
  // Add event listener for reasoning format changes
  document.getElementById('reasoning_format').addEventListener('change', function() {
    const thinkingSections = document.querySelectorAll('.thinking-section');
    
    if (this.value === 'none') {
      thinkingSections.forEach(section => section.classList.add('hidden-thinking'));
    } else {
      thinkingSections.forEach(section => section.classList.remove('hidden-thinking'));
    }
  });
  
  async function sendMessage(event) {
    event.preventDefault();
    const input = document.getElementById('message-input');
    const message = input.value;
    
    if (!message) return;
  
    addMessage(message, true);
    input.value = '';
  
    // Hide previous token stats when sending a new message
    document.getElementById('token-stats').classList.add('hidden');
  
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
        
        // Create message placeholders and track whether we've already processed thinking tags
        let messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        document.getElementById('chat-container').appendChild(messageDiv);
        
        let thinkingProcessed = false;
        let thinkingDiv = null;
        let responseDiv = null;
        let containerDiv = null;
        
        // Set up streaming
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          
          const text = decoder.decode(value);
          const lines = text.split('\n\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                fullResponse = data.full_response;
                
                // Check for thinking tags
                const thinkMatch = fullResponse.match(/<think>([\s\S]*?)<\/think>([\s\S]*)/);
                
                if (thinkMatch && thinkMatch.length >= 3) {
                  const thinkContent = thinkMatch[1].trim();
                  const responseContent = thinkMatch[2].trim();
                  
                  if (!thinkingProcessed) {
                    // First time seeing thinking tags - set up the container structure
                    thinkingProcessed = true;
                    messageDiv.remove(); // Remove the placeholder
                    
                    // Create a new container for both thinking and response
                    containerDiv = document.createElement('div');
                    containerDiv.className = 'bot-message-container';
                    
                    // Create thinking section
                    thinkingDiv = document.createElement('div');
                    thinkingDiv.className = 'thinking-section';
                    if (params.reasoning_format === 'none') {
                      thinkingDiv.classList.add('hidden-thinking');
                    }
                    thinkingDiv.textContent = thinkContent;
                    containerDiv.appendChild(thinkingDiv);
                    
                    // Create response section (might be empty at first)
                    responseDiv = document.createElement('div');
                    responseDiv.className = 'message bot-message bot-response';
                    responseDiv.textContent = responseContent;
                    containerDiv.appendChild(responseDiv);
                    
                    // Add the container to the chat
                    document.getElementById('chat-container').appendChild(containerDiv);
                  } else {
                    // Already processed thinking tags - just update the content
                    thinkingDiv.textContent = thinkContent;
                    responseDiv.textContent = responseContent;
                  }
                } else {
                  // No thinking tags - simple update
                  messageDiv.textContent = fullResponse;
                }
                
                // Update token stats
                updateTokenStats(data.stats);
                
                // Scroll to bottom
                document.getElementById('chat-container').scrollTop = document.getElementById('chat-container').scrollHeight;
              } catch (e) {
                console.error('Error parsing SSE data:', e);
                console.error('Line:', line);
              }
            }
          }
        }
        
        // Once streaming is complete, make sure the message is properly formatted in case it changed
        if (fullResponse && !thinkingProcessed) {
          const finalThinkMatch = fullResponse.match(/<think>([\s\S]*?)<\/think>([\s\S]*)/);
          if (finalThinkMatch && finalThinkMatch.length >= 3) {
            // If we somehow missed it during streaming, process it now
            const thinkContent = finalThinkMatch[1].trim();
            const responseContent = finalThinkMatch[2].trim();
            
            // Create container structure
            messageDiv.remove();
            const containerDiv = document.createElement('div');
            containerDiv.className = 'bot-message-container';
            
            // Thinking section
            const thinkingDiv = document.createElement('div');
            thinkingDiv.className = 'thinking-section';
            if (params.reasoning_format === 'none') {
              thinkingDiv.classList.add('hidden-thinking');
            }
            thinkingDiv.textContent = thinkContent;
            containerDiv.appendChild(thinkingDiv);
            
            // Response section
            const responseDiv = document.createElement('div');
            responseDiv.className = 'message bot-message bot-response';
            responseDiv.textContent = responseContent;
            containerDiv.appendChild(responseDiv);
            
            document.getElementById('chat-container').appendChild(containerDiv);
          }
        }
        
      } else {
        // Handle non-streaming response
        const response = await fetch('/chat', {
          method: 'POST',
          body: formData
        });
        
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        
        // Get the response message with potential <think> tags
        const responseElement = doc.querySelector('p');
        let botResponse = responseElement ? responseElement.innerHTML : 'No response received';
        
        // Properly handle literal newlines in the response
        botResponse = botResponse.replace(/\\n/g, '\n');
        
        // Get token usage data
        const responseDiv = doc.querySelector('div');
        if (responseDiv) {
          // Make sure to parse these as numbers
          const totalTokens = parseInt(responseDiv.getAttribute('data-total-tokens'), 10);
          const tokensPerSecond = parseFloat(responseDiv.getAttribute('data-tokens-per-second'));
          
          // Verify we have valid numbers before updating stats
          if (!isNaN(totalTokens) && !isNaN(tokensPerSecond)) {
            // Display the message
            addMessage(botResponse, false);
            
            // Update and show token stats
            updateTokenStats({
              total_tokens: totalTokens,
              tokens_per_second: tokensPerSecond
            });
          } else {
            console.error("Invalid token stats received:", 
              responseDiv.getAttribute('data-total-tokens'), 
              responseDiv.getAttribute('data-tokens-per-second'));
            addMessage(botResponse, false);
          }
        } else {
          addMessage(botResponse, false);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      addMessage('Error: Could not send message', false);
    }
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

  // Add event listener for the toggle details button
  document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('toggle-details');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function() {
        const detailedStats = document.getElementById('detailed-stats');
        detailedStats.classList.toggle('hidden');
        this.textContent = detailedStats.classList.contains('hidden') ? 'Show Details' : 'Hide Details';
      });
    }
  });