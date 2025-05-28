import React, { useState } from 'react';
import ChatIcon from '../../assets/icons/ChatIcon';
import PlaylistIcon from '../../assets/icons/PlaylistIcon';
import OpenLeftIcon from '../../assets/icons/OpenLeftIcon';
import CloseRightIcon from '../../assets/icons/CloseRightIcon';
import styles from './WidgetToggleContainer.module.scss';

function WidgetToggleContainer({
  onChatToggle,
  onPlaylistToggle,
  chatVisible,
  playlistVisible
}) {
  const [isContainerVisible, setIsContainerVisible] = useState(true);

  const toggleContainerVisibility = () => {
    setIsContainerVisible(!isContainerVisible);
  };

  return (
    <div className={`${styles.widgetToggleContainer} ${!isContainerVisible ? styles.hidden : ''}`}>
      {/* Кнопка скрытия/показа контейнера - вынесена отдельно */}
      <div className={styles.toggleVisibilityContainer}>
        <button 
          className={styles.toggleVisibilityBtn}
          onClick={toggleContainerVisibility}
          title={isContainerVisible ? "Скрыть панель" : "Показать панель"}
        >
          {isContainerVisible ? <OpenLeftIcon /> : <CloseRightIcon />}
        </button>
      </div>

      {/* Основной контейнер с кнопками виджетов */}
      <div className={`${styles.widgetButtonsContainer} ${!isContainerVisible ? styles.hidden : ''}`}>
        {/* Кнопка чата */}
        <div className={styles.widgetButtonWrapper}>
          <button 
            className={`${styles.widgetBtn} ${styles.chatBtn} ${chatVisible ? styles.active : ''}`}
            onClick={onChatToggle}
            title="Открыть чат"
          >
            <ChatIcon />
          </button>
        </div>

        {/* Кнопка плейлиста */}
        <div className={styles.widgetButtonWrapper}>
          <button 
            className={`${styles.widgetBtn} ${styles.playlistBtn} ${playlistVisible ? styles.active : ''}`}
            onClick={onPlaylistToggle}
            title="Открыть плейлист"
          >
            <PlaylistIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

export default WidgetToggleContainer; 