import React, { useState } from 'react';
import styles from './DropZone.module.scss';

function DropZone({ index, onDrop, draggedItem }) {
  const [isHovered, setIsHovered] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsHovered(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    // Проверяем что мы действительно покинули зону, а не перешли на дочерний элемент
    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      setIsHovered(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsHovered(false);
    
    if (draggedItem && onDrop) {
      onDrop(draggedItem.cellId, index);
    }
  };

  return (
    <div
      className={`${styles.dropZone} ${isHovered ? styles.hovered : ''} ${draggedItem ? styles.active : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isHovered && draggedItem && (
        <div className={styles.dropIndicator}>
          Вставить здесь
        </div>
      )}
    </div>
  );
}

export default DropZone; 