import React, { useState, useEffect, useRef } from 'react';
import styles from './PlaylistItem.module.scss';
import ElipsisDragIcon from '../../../assets/icons/ElipsisDragIcon';
import PlayIcon from '../../../assets/icons/PlayIcon';
import DeleteIcon from '../../../assets/icons/DeleteIcon';
import UpIcon from '../../../assets/icons/UpIcon';
import DownIcon from '../../../assets/icons/DownIcon';
import UpDownIcon from '../../../assets/icons/UpDownIcon';



// Компонент для отображения отдельного элемента плейлиста
function PlaylistItem({ 
  item, 
  index, 
  totalItems,
  isCurrentItem, 
  playlistStatus,
  onStart, 
  onRemove,
  onMove,
  onQuickMove,
  onDragStart,
  onDragEnd,
  onDragStateChange,
  isDragMode,
  contentInfo,
  loadingContent 
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchCurrentY, setTouchCurrentY] = useState(0);
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  
  const itemRef = useRef(null);
  const touchTimeoutRef = useRef(null);

  // Определяем, является ли устройство сенсорным
  const isTouchDevice = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
  };

  // Сброс состояния изображения при изменении контента
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [contentInfo]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoaded(false);
    setImageError(true);
  };

  // Определяем, можно ли запустить ячейку (только когда плейлист не активен)
  const canStart = playlistStatus !== 'ACTIVE';

  // Обработчики drag событий
  const handleDragStart = (e) => {
    console.log('PlaylistItem: начало drag', item);
    setIsDragging(true);
    
    // Устанавливаем данные для drag операции
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.cellId);
    
    // Уведомляем родительский компонент
    if (onDragStart) {
      onDragStart(item, index);
    }
    if (onDragStateChange) {
      onDragStateChange(true);
    }
  };

  const handleDragEnd = (e) => {
    console.log('PlaylistItem: конец drag', item);
    setIsDragging(false);
    
    // Уведомляем родительский компонент
    if (onDragEnd) {
      onDragEnd();
    }
    if (onDragStateChange) {
      onDragStateChange(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Обработчики для кнопок перемещения на сенсорных устройствах
  const handleMoveUp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickMove && index > 0) {
      onQuickMove(item.cellId, index - 1);
    }
  };

  const handleMoveDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickMove && index < totalItems - 1) {
      onQuickMove(item.cellId, index + 1);
    }
  };

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <>
      <div 
        ref={itemRef}
        className={`${styles.playlistItem} ${isCurrentItem ? styles.current : ''} ${isDragging ? styles.dragging : ''}`}
        draggable={true}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        style={isTouchDragging ? {
          transform: `translateY(${touchCurrentY - touchStartY}px)`,
          zIndex: 1000,
          transition: 'none'
        } : {}}
      >
        {/* Иконка перетаскивания */}
        <div className={styles.dragHandle}>
          <ElipsisDragIcon />
          {/* Fallback если иконка не загружается */}
          <span className={styles.dragHandleFallback}>⋮⋮</span>
        </div>

        {/* Иконка контента */}
        <div className={styles.itemIcon}>
          {loadingContent ? (
            <div className={styles.loadingSpinner}></div>
          ) : contentInfo ? (
            <>
              {!imageError && (
                <img 
                  src={contentInfo.avatarUrl} 
                  alt={contentInfo.name}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  style={{ display: imageLoaded ? 'block' : 'none' }}
                />
              )}
              {(!imageLoaded || imageError) && (
                <div className={styles.iconPlaceholder}>🎬</div>
              )}
            </>
          ) : (
            <div className={styles.iconPlaceholder}>⚠️</div>
          )}
        </div>

        {/* Информация о контенте */}
        <div className={styles.itemInfo}>
          {loadingContent ? (
            <>
              <div className={styles.itemTitle}>Загрузка...</div>
              <div className={styles.itemDescription}>
                Index: {index} | Cell ID: {item.cellId}
                {isCurrentItem && ' | CURRENT'}
              </div>
            </>
          ) : contentInfo ? (
            <>
              <div className={styles.itemTitle}>{contentInfo.name}</div>
              <div className={styles.itemDescription}>
                {contentInfo.description}
              </div>
            </>
          ) : (
            <>
              <div className={styles.itemTitle}>Ошибка загрузки контента</div>
              <div className={styles.itemDescription}>
                Index: {index} | Cell ID: {item.cellId} | Content ID: {item.contentId}
                {isCurrentItem && ' | CURRENT'}
              </div>
            </>
          )}
        </div>

        {/* Кнопки перемещения для сенсорных устройств */}
        {isTouchDevice() && (
          <div className={styles.touchMoveButtons}>
            <button 
              className={`${styles.moveButton} ${styles.moveUpButton} ${index === 0 ? styles.disabled : ''}`}
              onClick={handleMoveUp}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              disabled={index === 0}
              title="Переместить вверх"
            >
              <UpIcon />
            </button>
            <button 
              className={`${styles.moveButton} ${styles.moveDownButton} ${index === totalItems - 1 ? styles.disabled : ''}`}
              onClick={handleMoveDown}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              disabled={index === totalItems - 1}
              title="Переместить вниз"
            >
              <DownIcon />
            </button>
          </div>
        )}

        {/* Кнопка запуска */}
        <button 
          className={`${styles.playButton} ${!canStart ? styles.disabled : ''}`}
          onClick={() => canStart && onStart(item.cellId)}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          disabled={!canStart}
          title={canStart ? "Запустить" : "Нельзя запустить когда плейлист активен"}
        >
          <PlayIcon />
        </button>

        {/* Кнопка удаления */}
        <button 
          className={styles.deleteButton}
          onClick={() => onRemove(item.cellId)}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          title="Удалить"
        >
          <DeleteIcon />
        </button>
      </div>
    </>
  );
}

export default PlaylistItem; 