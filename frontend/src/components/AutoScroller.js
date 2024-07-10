import React, { useEffect } from 'react';

const AutoScroller = ({ children }) => {
  useEffect(() => {
    let scrollInterval = null;

    const autoScroll = (clientY) => {
      const scrollSpeed = 15;
      const scrollThreshold = 100;
      const scrollableElement = document.scrollingElement || document.documentElement;

      const viewportHeight = window.innerHeight;
      const scrollTop = scrollableElement.scrollTop;
      const scrollHeight = scrollableElement.scrollHeight;

      if (clientY < scrollThreshold) {
        // Scroll up
        scrollableElement.scrollTop = Math.max(0, scrollTop - scrollSpeed);
      } else if (clientY > viewportHeight - scrollThreshold) {
        // Scroll down
        scrollableElement.scrollTop = Math.min(scrollHeight, scrollTop + scrollSpeed);
      }
    };

    const handleDragOver = (e) => {
      if (scrollInterval) return;
      scrollInterval = setInterval(() => autoScroll(e.clientY), 100);
    };

    const handleDragEnd = () => {
      if (scrollInterval) {
        clearInterval(scrollInterval);
        scrollInterval = null;
      }
    };

    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragend', handleDragEnd);
    document.addEventListener('drop', handleDragEnd);

    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragend', handleDragEnd);
      document.removeEventListener('drop', handleDragEnd);
      if (scrollInterval) {
        clearInterval(scrollInterval);
      }
    };
  }, []);

  return <>{children}</>;
};

export default AutoScroller;
