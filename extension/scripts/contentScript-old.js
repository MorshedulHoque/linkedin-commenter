chrome.storage.local.get(['isLoggedIn'], (result) => {
    if (result.isLoggedIn) {
      addIconsToCommentBoxes();
      console.log('User is logged in.');
  
      const observer = new MutationObserver(addIconsToCommentBoxes);
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      console.log('User is not logged in. Icons will not be added.');
    }
  });
  
  // Function to add an icon next to each comment box
  function addIconsToCommentBoxes() {
    const commentBoxes = document.querySelectorAll('.comments-comment-box__form');
  
    commentBoxes.forEach((commentBox) => {
      if (commentBox.querySelector('.comment-helper-icon')) return;
  
      const icon = document.createElement('img');
      icon.src = "https://img.icons8.com/external-bearicons-outline-color-bearicons/64/external-Comment-customer-review-bearicons-outline-color-bearicons.png";
      icon.className = 'comment-helper-icon';
      icon.style.cursor = 'pointer';
      icon.style.float = 'right';
      icon.style.margin = '1px 4px 0px 9px';
      icon.style.width = '37px';
      icon.style.height = '37px';
  
      const emojiButton = commentBox.querySelector('.comments-comment-box-comment__text-editor');
      if (emojiButton) {
        emojiButton.parentNode.insertBefore(icon, emojiButton);
      }
  
      icon.addEventListener('click', async () => {
        const postText = getPostText(commentBox);
  
        if (postText) {
          displayEmotionPopup(postText, commentBox);
        } else {
          console.log('Could not find the post text.');
        }
      });
    });
  }
  
  // Function to retrieve the post text associated with the comment box
  function getPostText(commentBox) {
    const postContainer = commentBox.closest('.feed-shared-update-v2');
    if (!postContainer) return null;
  
    const postTextElement = postContainer.querySelector('.feed-shared-update-v2__description-wrapper');
    return postTextElement ? postTextElement.innerText.trim() : null;
  }
  
  // Function to display emotion selection popup
  function displayEmotionPopup(postText, commentBox) {
    // const emotions = ['Informative', 'Funny', 'Supportive', 'Critical', 'Inquisitive'];
    const emotions = [
      { text: "Informative", emoji: "📝", color: "#0073b1" }, // LinkedIn blue
      { text: "Funny", emoji: "😄", color: "#ffbe00" }, // Yellow tone
      { text: "Supportive", emoji: "👍", color: "#00a550" }, // Green tone
      { text: "Critical", emoji: "💬", color: "#ff5630" }, // Red tone
      { text: "Inquisitive", emoji: "❓", color: "#9157b3" }, // Purple tone
    ];
  
    // Create the popup container
    const popup = document.createElement("div");
    popup.style.position = "absolute"; // Position relative to the comment box
    popup.style.background = "linear-gradient(135deg, #0c0c0c 0%, #001435 100%)";
    popup.style.border = "1px solid #080a0a";
    popup.style.padding = "15px";
    popup.style.zIndex = "1000";
    popup.style.width = "260px";
    popup.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.1)";
    popup.style.borderRadius = "8px";
    popup.style.fontFamily = "Arial, sans-serif";
    popup.style.fontSize = "14px";
    popup.style.color = "#333";
    popup.style.textAlign = "center";
    popup.style.transition = "all 0.4s ease-in-out"; // Updated transition time for a smoother effect
    popup.style.opacity = "0"; // Start with an opacity of 0
    popup.style.transform = "translateY(20px)"; // Start with a slight downward position
  
    // Position the popup near the comment box
    const commentBoxRect = commentBox.getBoundingClientRect();
    popup.style.top = `${commentBoxRect.bottom + window.scrollY + 10}px`; // 10px below the comment box
    popup.style.left = `${commentBoxRect.left + window.scrollX}px`;
  
    // Create a close button
    const closeButton = document.createElement("button");
    closeButton.textContent = "×";
    closeButton.style.position = "absolute";
    closeButton.style.top = "8px";
    closeButton.style.right = "10px";
    closeButton.style.border = "none";
    closeButton.style.background = "none";
    closeButton.style.color = "#888";
    closeButton.style.fontSize = "20px";
    closeButton.style.cursor = "pointer";
    closeButton.style.transition = "color 0.2s";
  
    closeButton.addEventListener('click', () => {
      document.body.removeChild(popup);
    });
  
    // Close button hover effect
    closeButton.addEventListener("mouseenter", () => {
      closeButton.style.color = "#555";
    });
    closeButton.addEventListener("mouseleave", () => {
      closeButton.style.color = "#888";
    });
  
    // Close function
    closeButton.addEventListener("click", () => {
      popup.style.opacity = "0"; // Fade out effect
      popup.style.transform = "translateY(20px)"; // Move downwards when closing
      setTimeout(() => {
        document.body.removeChild(popup);
      }, 600); // Match the transition duration to remove the popup after fading out
    });
  
    // Add close button to the popup
    popup.appendChild(closeButton);
  
    const title = document.createElement("h3");
    title.textContent = "Choose a Tone";
    title.style.marginBottom = "15px";
    title.style.color = "#ffffff"; // Primary color for the title
    title.style.fontSize = "16px";
    popup.appendChild(title);
  
    // Add buttons for each emotion
    emotions.forEach((emotion) => {
      const button = document.createElement("button");
      button.textContent = `${emotion.emoji} ${emotion.text}`;
      button.style.display = "block";
      button.style.width = "90%";
      button.style.margin = "8px auto";
      button.style.padding = "8px 10px";
      button.style.backgroundColor = emotion.color; // Use the color for each emotion
      button.style.color = "#fff";
      button.style.border = "none";
      button.style.borderRadius = "5px";
      button.style.cursor = "pointer";
      button.style.transition = "background-color 0.3s, transform 0.3s";
      button.style.fontSize = "14px";
      button.style.fontWeight = "normal";
  
      button.addEventListener("mouseenter", () => {
        button.style.opacity = "0.9"; // Slight transparency on hover
        button.style.transform = "scale(1.05)";
      });
      button.addEventListener("mouseleave", () => {
        button.style.opacity = "1";
        button.style.transform = "scale(1)";
      });
  
      button.addEventListener('click', async () => {
        if (button.disabled) {
          return; // Prevent multiple requests if already processing
        }
        button.disabled = true; // Disable the button
        button.style.backgroundColor = '#ccc'; // Change color to indicate processing
        try {
          await generateComment(postText, emotion, commentBox);
        } catch (error) {
          console.error('Error generating comment:', error);
        } finally {
          button.disabled = false; // Re-enable the button after processing
          button.style.backgroundColor = '#0073b1'; // Reset the button color
        }
        document.body.removeChild(popup); // Close the popup
      });
  
      popup.appendChild(button);
    });
  
    // Append the popup to the body
    document.body.appendChild(popup);
  
    // Trigger the appearance of the popup
    setTimeout(() => {
      popup.style.opacity = "1"; // Fade in effect
      popup.style.transform = "translateY(0)"; // Move into original position
    }, 0);
  
    // Click anywhere outside the popup to close it
    document.addEventListener(
      "click",
      function closePopup(event) {
        if (!popup.contains(event.target)) {
          popup.style.opacity = "0"; // Fade out effect
          popup.style.transform = "translateY(20px)";
          setTimeout(() => {
            document.body.removeChild(popup);
            document.removeEventListener("click", closePopup);
          }, 600); // Match the transition duration to remove the popup after fading out
        }
      },
      true
    );
  }
  
  // Function to generate a comment and handle daily usage limits
  async function generateComment(postText, emotion, commentBox) {
    try {
      // Check and remove '…more' if it is at the end of the postText
      if (postText.endsWith('…more')) {
        postText = postText.slice(0, -5); // Remove the last 5 characters '…more'
      }
  
      // Get the user ID from storage
      const userId = await getUserId();
  
      const response = await fetch('http://localhost:3000/generate-comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({ text: postText, emotion: emotion.text, user_id: userId }) // Pass the user ID
      });
  
      // Handle response status for daily limit
      if (response.status === 429) {
        alert('You have reached your daily limit for generating comments.');
        return;
      }
  
      const result = await response.text();
      console.log('Generated Comment:', result);
  
      // Insert the generated comment into the comment box
      const commentEditor = commentBox.querySelector('.ql-editor');
      if (commentEditor) {
        commentEditor.innerText = result;
      }
    } catch (error) {
      console.error('Error generating comment:', error);
    }
  }
  
  // Function to get the user ID from Chrome local storage
  function getUserId() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['userId'], (result) => {
        if (result.userId) {
          resolve(result.userId);
        } else {
          reject('User ID not found in local storage');
        }
      });
    });
  }
  