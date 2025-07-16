document.addEventListener("DOMContentLoaded", () => {
    const listContainer = document.getElementById("youtuber-list-container");
    let timeoutRefs = {}; 

    fetch("data.json")
        .then((response) => response.json())
        .then((youtubersData) => {
            if (!listContainer) return;
            listContainer.innerHTML = "";
            youtubersData.forEach((data) => {
                const card = createYoutuberCard(data);
                listContainer.appendChild(card);
            });
        })
        .catch((error) => {
            console.error("無法載入 YouTuber 資料:", error);
            if (listContainer) {
                listContainer.innerHTML = "<p>資料載入失敗。</p>";
            }
        });
    
    // -- 修改後的 createYoutuberCard 函式 --
    function createYoutuberCard(data) {
        const card = document.createElement("div");
        card.className = "youtuber-card";
        card.dataset.id = data.id;

        // 條件式生成頭像 HTML
        const avatarHtml = data.channelAvatarUrl
            ? `<img src="${data.channelAvatarUrl}" alt="${data.channelName} avatar" class="channel-avatar">`
            : `<div class="channel-avatar">${data.channelName.charAt(0)}</div>`;

        card.innerHTML = `
            <div class="character-image-container">
                <a href="${data.channelUrl}" target="_blank" rel="noopener noreferrer">
                    <img
                        src="${data.characterImage || 'https://via.placeholder.com/200x300'}"
                        alt="${data.channelName} character"
                        class="character-image"
                        style="width: ${data.characterImageSize.width}px; height: ${data.characterImageSize.height}px;"
                    />
                </a>
            </div>
            <div class="content-area">
                <div class="channel-info">
                    ${avatarHtml} <!-- 使用上面生成的頭像 HTML -->
                    <a href="${data.channelUrl}" target="_blank" rel="noopener noreferrer" class="channel-name">
                        ${data.channelName}
                    </a>
                </div>
                <div class="tags-container">
                    ${data.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}
                </div>
                <a href="${data.videoUrl}" target="_blank" rel="noopener noreferrer" class="video-link">
                    <div class="group">
                        <div class="video-thumbnail-container">
                            <img
                                src="${data.videoThumbnail || 'https://via.placeholder.com/200x120'}"
                                alt="Video thumbnail"
                                class="video-thumbnail"
                            />
                            <div class="video-overlay">二次播</div>
                        </div>
                        <h3 class="video-title">${data.videoTitle}</h3>
                        <p class="upload-time">${data.uploadTime}</p>
                    </div>
                </a>
            </div>
        `;
        
        card.addEventListener("mouseenter", () => handleMouseEnter(card, data));
        card.addEventListener("mouseleave", () => handleMouseLeave(card));

        return card;
    }

    // handleMouseEnter 和 handleMouseLeave 函式保持不變...
    function handleMouseEnter(card, data) {
        const cardId = card.dataset.id;
        if (data.hoverMessages && data.hoverMessages.length > 0) {
            if (timeoutRefs[cardId]) timeoutRefs[cardId].forEach(clearTimeout);
            timeoutRefs[cardId] = [];
            const cardRect = card.getBoundingClientRect();
            const bubbles = data.hoverMessages.map((message, index) => {
                const bubble = createFloatingBubble(message, cardRect, index);
                card.appendChild(bubble);
                return bubble;
            });
            const fadeInTimeout = setTimeout(() => bubbles.forEach(b => b.classList.add("visible")), 100);
            const fadeOutTimeout = setTimeout(() => bubbles.forEach(b => b.classList.remove("visible")), 2100);
            const cleanupTimeout = setTimeout(() => bubbles.forEach(b => b.remove()), 3100);
            timeoutRefs[cardId].push(fadeInTimeout, fadeOutTimeout, cleanupTimeout);
        }

        const imageElement = card.querySelector('.character-image');
        if (imageElement && data.characterImageHover) {
            imageElement.dataset.originalSrc = imageElement.src;
            imageElement.src = data.characterImageHover;
            imageElement.classList.add('hover-jump');
        }
    }

    function handleMouseLeave(card) {
        const cardId = card.dataset.id;
        const bubbles = card.querySelectorAll(".floating-bubble");
        bubbles.forEach(bubble => bubble.classList.remove("visible"));
        if (timeoutRefs[cardId]) timeoutRefs[cardId].forEach(clearTimeout);
        timeoutRefs[cardId] = [];
        const cleanupTimeout = setTimeout(() => bubbles.forEach(b => b.remove()), 1000);
        timeoutRefs[cardId].push(cleanupTimeout);

        const imageElement = card.querySelector('.character-image');
        if (imageElement && imageElement.dataset.originalSrc) {
            imageElement.src = imageElement.dataset.originalSrc;
            imageElement.classList.remove('hover-jump');
            imageElement.removeAttribute('data-original-src');
        }
    }
    
    function createFloatingBubble(text, cardRect, index) {
        const bubble = document.createElement("div");
        bubble.className = "floating-bubble";
        const position = generateRandomPosition(cardRect, index);
        bubble.style.left = `${position.x}px`;
        bubble.style.top = `${position.y}px`;
        bubble.innerHTML = `<div class="bubble-content">${text}</div>`;
        return bubble;
    }

    function generateRandomPosition(cardRect, index) {
        const cardWidth = cardRect.width;
        const cardHeight = cardRect.height;
        const positions = [
            { x: Math.random() * cardWidth, y: -20 - Math.random() * 20 },
            { x: -50 - Math.random() * 40, y: Math.random() * cardHeight },
            { x: cardWidth + 50 + Math.random() * 40, y: Math.random() * cardHeight },
            { x: -40 - Math.random() * 30, y: -20 - Math.random() * 30 },
            { x: cardWidth + 40 + Math.random() * 30, y: -20 - Math.random() * 30 },
        ];
        return positions[index % positions.length];
    }
});