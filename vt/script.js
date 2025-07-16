document.addEventListener("DOMContentLoaded", () => {
    // 獲取主容器
    const scrollerContainer = document.getElementById("scroller-container");
    // 用於儲存氣泡定時器
    let bubbleTimeoutRefs = {}; 

    // 異步函數，用於獲取資料並建立滾動條
    async function initializeScrollers() {
        try {
            const response = await fetch("data.json");
            const scrollerRowsData = await response.json();

            if (!scrollerContainer) return;
            scrollerContainer.innerHTML = ""; // 清空容器

            // 遍歷每個橫排的資料
            scrollerRowsData.forEach(rowData => {
                const scrollerRow = createScrollerRow(rowData);
                scrollerContainer.appendChild(scrollerRow);
            });

        } catch (error) {
            console.error("無法載入或處理資料:", error);
            if (scrollerContainer) {
                scrollerContainer.innerHTML = "<p>資料載入失敗。</p>";
            }
        }
    }

    // 創建單個完整的滾動橫排
    function createScrollerRow(rowData) {
        const settings = rowData.settings;
        const cards = rowData.cards;

        // 創建外部和內部容器
        const scrollerRow = document.createElement("div");
        scrollerRow.className = "scroller-row";

        const scrollerInner = document.createElement("div");
        scrollerInner.className = "scroller-inner";
        
        // 應用自訂設定
        scrollerInner.style.animationDuration = settings.speed || "60s";
        scrollerInner.classList.add(settings.direction === 'right' ? 'scroll-right' : 'scroll-left');

        // **核心技巧：複製卡片以實現無縫滾動**
        // 第一次添加原始卡片
        cards.forEach(cardData => {
            const cardElement = createYoutuberCard(cardData);
            scrollerInner.appendChild(cardElement);
        });

        // 第二次添加複製的卡片 (用於無縫銜接)
        cards.forEach(cardData => {
            const cardElement = createYoutuberCard(cardData);
            cardElement.setAttribute("aria-hidden", "true"); // 對輔助技術隱藏重複內容
            scrollerInner.appendChild(cardElement);
        });

        scrollerRow.appendChild(scrollerInner);
        return scrollerRow;
    }

    // 創建單個 YouTuber 卡片 (此函數與之前版本幾乎相同)
    function createYoutuberCard(data) {
        const card = document.createElement("div");
        card.className = "youtuber-card";
        card.dataset.id = data.id;

        const avatarHtml = data.channelAvatarUrl
            ? `<img src="${data.channelAvatarUrl}" alt="${data.channelName} avatar" class="channel-avatar">`
            : `<div class="channel-avatar">${data.channelName.charAt(0)}</div>`;

        card.innerHTML = `
            <div class="character-image-container">
                <a href="${data.channelUrl}" target="_blank" rel="noopener noreferrer">
                    <img src="${data.characterImage || 'https://via.placeholder.com/200x300'}" alt="${data.channelName} character" class="character-image" style="width: ${data.characterImageSize.width}px; height: ${data.characterImageSize.height}px;">
                </a>
            </div>
            <div class="content-area">
                <div class="channel-info">${avatarHtml}<a href="${data.channelUrl}" target="_blank" rel="noopener noreferrer" class="channel-name">${data.channelName}</a></div>
                <div class="tags-container">${data.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}</div>
                <a href="${data.videoUrl}" target="_blank" rel="noopener noreferrer" class="video-link">
                    <div class="group">
                        <div class="video-thumbnail-container">
                            <img src="${data.videoThumbnail || 'https://via.placeholder.com/200x120'}" alt="Video thumbnail" class="video-thumbnail">
                            <div class="video-overlay">二次播</div>
                        </div>
                        <h3 class="video-title">${data.videoTitle}</h3>
                        <p class="upload-time">${data.uploadTime}</p>
                    </div>
                </a>
            </div>
        `;
        
        // 事件監聽器綁定到卡片上
        card.addEventListener("mouseenter", () => handleMouseEnter(card, data));
        card.addEventListener("mouseleave", () => handleMouseLeave(card));

        return card;
    }
    
    // --- 以下的互動邏輯 (氣泡、圖片跳動) 保持不變，因為它們是綁定在單個卡片上的 ---

    function handleMouseEnter(card, data) {
        const cardId = `bubble-${card.dataset.id}`;
        if (data.hoverMessages && data.hoverMessages.length > 0) {
            if (bubbleTimeoutRefs[cardId]) bubbleTimeoutRefs[cardId].forEach(clearTimeout);
            bubbleTimeoutRefs[cardId] = [];
            const cardRect = card.getBoundingClientRect();
            const bubbles = data.hoverMessages.map((message, index) => {
                const bubble = createFloatingBubble(message, cardRect, index);
                // **重要**：將氣泡添加到 body 而不是 card，以避免被 overflow:hidden 裁切
                document.body.appendChild(bubble); 
                return bubble;
            });
            const fadeInTimeout = setTimeout(() => bubbles.forEach(b => b.classList.add("visible")), 100);
            const fadeOutTimeout = setTimeout(() => bubbles.forEach(b => b.classList.remove("visible")), 2100);
            const cleanupTimeout = setTimeout(() => bubbles.forEach(b => b.remove()), 3100);
            bubbleTimeoutRefs[cardId].push(fadeInTimeout, fadeOutTimeout, cleanupTimeout);
        }

        const imageElement = card.querySelector('.character-image');
        if (imageElement && data.characterImageHover) {
            imageElement.dataset.originalSrc = imageElement.src;
            imageElement.src = data.characterImageHover;
            imageElement.classList.add('hover-jump');
        }
    }

    function handleMouseLeave(card) {
        const cardId = `bubble-${card.dataset.id}`;
        document.body.querySelectorAll(`.floating-bubble[data-parent-id="${cardId}"]`).forEach(bubble => {
            bubble.classList.remove("visible");
        });

        if (bubbleTimeoutRefs[cardId]) bubbleTimeoutRefs[cardId].forEach(clearTimeout);
        bubbleTimeoutRefs[cardId] = [];
        setTimeout(() => {
            document.body.querySelectorAll(`.floating-bubble[data-parent-id="${cardId}"]`).forEach(b => b.remove());
        }, 1000);

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
        
        // **重要**：氣泡位置現在需要根據頁面滾動位置計算
        const bubbleX = cardRect.left + window.scrollX;
        const bubbleY = cardRect.top + window.scrollY;

        const position = generateRandomPosition({width: cardRect.width, height: cardRect.height}, index);
        bubble.style.left = `${bubbleX + position.x}px`;
        bubble.style.top = `${bubbleY + position.y}px`;

        bubble.innerHTML = `<div class="bubble-content">${text}</div>`;
        // 爲氣泡添加標識，以便於清理
        bubble.dataset.parentId = `bubble-${cardRect.id}`;
        return bubble;
    }

    function generateRandomPosition(cardDimensions, index) {
        const positions = [
            { x: Math.random() * cardDimensions.width, y: -20 - Math.random() * 20 },
            { x: -50 - Math.random() * 40, y: Math.random() * cardDimensions.height },
            { x: cardDimensions.width + 50 + Math.random() * 40, y: Math.random() * cardDimensions.height },
            { x: -40 - Math.random() * 30, y: -20 - Math.random() * 30 },
            { x: cardDimensions.width + 40 + Math.random() * 30, y: -20 - Math.random() * 30 },
        ];
        return positions[index % positions.length];
    }

    // 啟動整個程序
    initializeScrollers();
});