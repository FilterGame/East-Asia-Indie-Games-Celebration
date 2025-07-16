document.addEventListener("DOMContentLoaded", () => {
    const scrollerContainer = document.getElementById("scroller-container");
    let bubbleTimeoutRefs = {};

    async function initializeScrollers() {
        try {
            const response = await fetch("data.json");
            const scrollerRowsData = await response.json();

            if (!scrollerContainer) return;
            scrollerContainer.innerHTML = "";

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

    function createScrollerRow(rowData) {
        const settings = rowData.settings;
        const cards = rowData.cards;
        const scrollerRow = document.createElement("div");
        scrollerRow.className = "scroller-row";
        const scrollerInner = document.createElement("div");
        scrollerInner.className = "scroller-inner";
        scrollerInner.style.animationDuration = settings.speed || "60s";
        scrollerInner.classList.add(settings.direction === 'right' ? 'scroll-right' : 'scroll-left');

        cards.forEach(cardData => {
            const cardElement = createYoutuberCard(cardData);
            scrollerInner.appendChild(cardElement);
        });

        cards.forEach(cardData => {
            const cardElement = createYoutuberCard(cardData);
            cardElement.setAttribute("aria-hidden", "true");
            scrollerInner.appendChild(cardElement);
        });

        scrollerRow.appendChild(scrollerInner);
        return scrollerRow;
    }

    // --- 全新重寫的 createYoutuberCard 函式 (不使用 innerHTML) ---
    function createYoutuberCard(data) {
        // 主卡片
        const card = document.createElement("div");
        card.className = "youtuber-card";
        card.dataset.id = data.id;

        // --- 左側角色圖片區 ---
        const charImageContainer = document.createElement("div");
        charImageContainer.className = "character-image-container";
        const charLink = document.createElement("a");
        charLink.href = data.channelUrl;
        charLink.target = "_blank";
        charLink.rel = "noopener noreferrer";
        const charImg = document.createElement("img");
        charImg.src = data.characterImage || 'https://via.placeholder.com/200x300';
        charImg.alt = `${data.channelName} character`;
        charImg.className = "character-image";
        charImg.style.width = `${data.characterImageSize.width}px`;
        charImg.style.height = `${data.characterImageSize.height}px`;
        charLink.appendChild(charImg);
        charImageContainer.appendChild(charLink);

        // --- 右側內容區 ---
        const contentArea = document.createElement("div");
        contentArea.className = "content-area";

        // 頻道資訊
        const channelInfo = document.createElement("div");
        channelInfo.className = "channel-info";
        // 頻道頭像 (條件式)
        if (data.channelAvatarUrl) {
            const avatarImg = document.createElement("img");
            avatarImg.src = data.channelAvatarUrl;
            avatarImg.alt = `${data.channelName} avatar`;
            avatarImg.className = "channel-avatar";
            channelInfo.appendChild(avatarImg);
        } else {
            const avatarDiv = document.createElement("div");
            avatarDiv.className = "channel-avatar";
            avatarDiv.textContent = data.channelName.charAt(0);
            channelInfo.appendChild(avatarDiv);
        }
        const channelNameLink = document.createElement("a");
        channelNameLink.href = data.channelUrl;
        channelNameLink.target = "_blank";
        channelNameLink.rel = "noopener noreferrer";
        channelNameLink.className = "channel-name";
        channelNameLink.textContent = data.channelName;
        channelInfo.appendChild(channelNameLink);
        contentArea.appendChild(channelInfo);

        // 標籤容器
        const tagsContainer = document.createElement("div");
        tagsContainer.className = "tags-container";
        data.tags.forEach(tagText => {
            const tagSpan = document.createElement("span");
            tagSpan.className = "tag";
            tagSpan.textContent = tagText;
            tagsContainer.appendChild(tagSpan);
        });
        contentArea.appendChild(tagsContainer);

        // 影片連結區塊
        const videoLink = document.createElement("a");
        videoLink.href = data.videoUrl;
        videoLink.target = "_blank";
        videoLink.rel = "noopener noreferrer";
        videoLink.className = "video-link";
        const videoGroup = document.createElement("div");
        videoGroup.className = "group";
        
        // 影片縮圖
        const thumbnailContainer = document.createElement("div");
        thumbnailContainer.className = "video-thumbnail-container";
        const thumbnailImg = document.createElement("img");
        thumbnailImg.src = data.videoThumbnail || 'https://via.placeholder.com/200x120';
        thumbnailImg.alt = "Video thumbnail";
        thumbnailImg.className = "video-thumbnail";
        const overlayDiv = document.createElement("div");
        overlayDiv.className = "video-overlay";
        overlayDiv.textContent = "二次播";
        thumbnailContainer.appendChild(thumbnailImg);
        thumbnailContainer.appendChild(overlayDiv);
        videoGroup.appendChild(thumbnailContainer);

        // 影片標題
        const videoTitle = document.createElement("h3");
        videoTitle.className = "video-title";
        videoTitle.textContent = data.videoTitle;
        videoGroup.appendChild(videoTitle);

        // 上傳時間
        const uploadTime = document.createElement("p");
        uploadTime.className = "upload-time";
        uploadTime.textContent = data.uploadTime;
        videoGroup.appendChild(uploadTime);

        videoLink.appendChild(videoGroup);
        contentArea.appendChild(videoLink);

        // --- 組合所有區塊 ---
        card.appendChild(charImageContainer);
        card.appendChild(contentArea);

        // 綁定事件
        card.addEventListener("mouseenter", () => handleMouseEnter(card, data));
        card.addEventListener("mouseleave", () => handleMouseLeave(card));

        return card;
    }

    // --- 以下的互動邏輯保持不變 ---
    function handleMouseEnter(card, data) {
        const cardId = `bubble-${card.dataset.id}`;
        if (data.hoverMessages && data.hoverMessages.length > 0) {
            if (bubbleTimeoutRefs[cardId]) bubbleTimeoutRefs[cardId].forEach(clearTimeout);
            bubbleTimeoutRefs[cardId] = [];
            const cardRect = card.getBoundingClientRect();
            const bubbles = data.hoverMessages.map((message, index) => {
                const bubble = createFloatingBubble(message, card, cardRect, index);
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
        document.body.querySelectorAll(`.floating-bubble[data-parent-id="${cardId}"]`).forEach(bubble => bubble.classList.remove("visible"));
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
    function createFloatingBubble(text, parentCard, cardRect, index) {
        const bubble = document.createElement("div");
        bubble.className = "floating-bubble";
        bubble.dataset.parentId = `bubble-${parentCard.dataset.id}`;
        const bubbleX = cardRect.left + window.scrollX;
        const bubbleY = cardRect.top + window.scrollY;
        const position = generateRandomPosition({ width: cardRect.width, height: cardRect.height }, index);
        bubble.style.left = `${bubbleX + position.x}px`;
        bubble.style.top = `${bubbleY + position.y}px`;
        const bubbleContent = document.createElement("div");
        bubbleContent.className = "bubble-content";
        bubbleContent.textContent = text;
        bubble.appendChild(bubbleContent);
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

    initializeScrollers();
});