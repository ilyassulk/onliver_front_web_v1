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
  const [retryCount, setRetryCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchCurrentY, setTouchCurrentY] = useState(0);
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  
  const itemRef = useRef(null);
  const touchTimeoutRef = useRef(null);
  const currentContentInfoRef = useRef(null);

  // Определяем, является ли устройство сенсорным
  const isTouchDevice = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
  };

  // Сброс состояния изображения при изменении контента
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setRetryCount(0);
    currentContentInfoRef.current = contentInfo;
    
    // Если contentInfo есть, проверяем, не загружено ли изображение уже в кеше
    if (contentInfo && contentInfo.avatarUrl) {
      const img = new Image();
      img.onload = () => {
        // Проверяем, что contentInfo не изменился пока изображение загружалось
        if (currentContentInfoRef.current === contentInfo) {
          setImageLoaded(true);
          setImageError(false);
        }
      };
      img.onerror = () => {
        // Не устанавливаем ошибку здесь, пусть основной img элемент попробует загрузить
        console.warn(`Предварительная проверка изображения не удалась: ${contentInfo.avatarUrl}`);
      };
      img.src = contentInfo.avatarUrl;
    }
  }, [contentInfo]);

  const handleImageLoad = (event) => {
    // Проверяем, что событие относится к текущему contentInfo
    const loadedSrc = event.target.src;
    const originalUrl = loadedSrc.split('?')[0]; // Убираем query параметры для сравнения
    
    if (currentContentInfoRef.current && 
        (loadedSrc === currentContentInfoRef.current.avatarUrl || 
         originalUrl === currentContentInfoRef.current.avatarUrl)) {
      setImageLoaded(true);
      setImageError(false);
      setRetryCount(0);
    }
  };

  const handleImageError = (event) => {
    // Проверяем, что событие относится к текущему contentInfo
    const failedSrc = event.target.src;
    const originalUrl = failedSrc.split('?')[0]; // Убираем query параметры для сравнения
    
    if (currentContentInfoRef.current && 
        (failedSrc === currentContentInfoRef.current.avatarUrl || 
         originalUrl === currentContentInfoRef.current.avatarUrl)) {
      console.warn(`Ошибка загрузки изображения: ${failedSrc}, попытка ${retryCount + 1}`);
      
      // Пытаемся загрузить повторно максимум 2 раза
      if (retryCount < 2) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          // Принудительно обновляем src, добавляя timestamp для обхода кеша
          const img = event.target;
          const originalSrc = img.src.split('?')[0]; // Убираем существующие query параметры
          img.src = `${originalSrc}?retry=${retryCount + 1}&t=${Date.now()}`;
        }, 1000 * (retryCount + 1)); // Увеличиваем задержку с каждой попыткой
      } else {
        setImageLoaded(false);
        setImageError(true);
      }
    }
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
      currentContentInfoRef.current = null; // Очищаем ссылку
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
                  key={`${contentInfo.avatarUrl}-${retryCount}`}
                  src={retryCount > 0 ? `${contentInfo.avatarUrl}?retry=${retryCount}&t=${Date.now()}` : contentInfo.avatarUrl}
                  alt={contentInfo.name}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  style={{ display: imageLoaded ? 'block' : 'none' }}
                />
              )}
              {(!imageLoaded || imageError) && (
                <div className={styles.iconPlaceholder}>
                  {imageError ? '⚠️' : '🎬'}
                </div>
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