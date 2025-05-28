import React, { useState, useEffect } from 'react';
import styles from './PlaylistItem.module.scss';

// Компонент для отображения отдельного элемента плейлиста
function PlaylistItem({ 
  item, 
  index, 
  isCurrentItem, 
  playlistStatus,
  onStart, 
  onMoveUp, 
  onMoveDown, 
  onRemove,
  contentInfo,
  loadingContent 
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

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

  // Определяем, можно ли запустить ячейку (только когда плейлист остановлен)
  const canStart = playlistStatus === 'STOPPED';

  return (
    <div 
      className={`${styles.playlistItem} ${isCurrentItem ? styles.current : ''}`}
      onClick={() => canStart && onStart(item.cellId)}
      style={{ cursor: canStart ? 'pointer' : 'default' }}
    >
      <div className={styles.itemContent}>
        {loadingContent ? (
          <div className={styles.itemLoading}>
            <div className={styles.loadingSpinner}></div>
            <div className={styles.itemInfo}>
              <div className={styles.itemTitle}>Загрузка...</div>
              <div className={styles.itemDetails}>
                Index: {index} | Cell ID: {item.cellId}
                {isCurrentItem && ' | CURRENT'}
              </div>
            </div>
          </div>
        ) : contentInfo ? (
          <div className={styles.itemWithContent}>
            <div className={styles.itemAvatar}>
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
                <div className={styles.avatarPlaceholder}>🎬</div>
              )}
            </div>
            <div className={styles.itemInfo}>
              <div className={styles.itemTitle}>{contentInfo.name}</div>
              <div className={styles.itemDescription}>{contentInfo.description}</div>
              <div className={styles.itemDetails}>
                Index: {index} | Cell ID: {item.cellId} | Content ID: {item.contentId}
                {isCurrentItem && ' | CURRENT'}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.itemError}>
            <div className={styles.itemInfo}>
              <div className={styles.itemTitle}>Ошибка загрузки контента</div>
              <div className={styles.itemDetails}>
                Index: {index} | Cell ID: {item.cellId} | Content ID: {item.contentId}
                {isCurrentItem && ' | CURRENT'}
              </div>
            </div>
          </div>
        )}
      </div>
      <div 
        className={styles.itemActions}
        onClick={(e) => e.stopPropagation()} // Предотвращаем всплытие события
      >
        <button 
          className={`${styles.btnSmall} ${styles.btnSuccess}`}
          onClick={() => onStart(item.cellId)}
          disabled={!canStart}
          title={canStart ? "Запустить" : "Можно запустить только когда плейлист остановлен"}
        >
          ▶
        </button>
        <button 
          className={`${styles.btnSmall} ${styles.btnSecondary}`}
          onClick={onMoveUp}
          title="Переместить вверх"
        >
          ↑
        </button>
        <button 
          className={`${styles.btnSmall} ${styles.btnSecondary}`}
          onClick={onMoveDown}
          title="Переместить вниз"
        >
          ↓
        </button>
        <button 
          className={`${styles.btnSmall} ${styles.btnDanger}`}
          onClick={() => onRemove(item.cellId)}
          title="Удалить"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

export default PlaylistItem; 