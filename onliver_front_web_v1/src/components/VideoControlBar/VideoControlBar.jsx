import React from 'react';
import { ControlBar } from '@livekit/components-react';
import OpenUpIcon from '../../assets/icons/OpenUpIcon';
import CloseDownIcon from '../../assets/icons/CloseDownIcon';
import styles from './VideoControlBar.module.scss';

function VideoControlBar({ 
  isControlBarVisible, 
  onToggleControlBar, 
  onDisconnect 
}) {
  return (
    <div className={`${styles.controlBarWrapper} ${!isControlBarVisible ? styles.controlBarWrapperHidden : ''}`}>
      {/* Кнопка скрытия/показа панели управления */}
      <div className={styles.toggleButton}>
        <button onClick={onToggleControlBar} className={styles.toggleBtn}>
          {isControlBarVisible ? <CloseDownIcon /> : <OpenUpIcon />}
        </button>
      </div>

      {/* Кастомная панель управления с группировкой */}
      <div className={`${styles.controlBarContainer} ${!isControlBarVisible ? styles.controlBarHidden : ''}`}>
        <div className={styles.customControlBar}>
          {/* Группа микрофона */}
          <div className={styles.deviceGroup}>
            <ControlBar 
              variation="minimal"
              controls={{
                camera: false,
                microphone: true,
                screenShare: false,
                leave: false,
                chat: false,
                settings: false,
              }}
            />
          </div>
          
          {/* Группа камеры */}
          <div className={styles.deviceGroup}>
            <ControlBar 
              variation="minimal"
              controls={{
                camera: true,
                microphone: false,
                screenShare: false,
                leave: false,
                chat: false,
                settings: false,
              }}
            />
          </div>
          
          {/* Кнопка демонстрации экрана */}
          <ControlBar 
            variation="minimal"
            controls={{
              camera: false,
              microphone: false,
              screenShare: true,
              leave: false,
              chat: false,
              settings: false,
            }}
          />
          
          {/* Кнопка выхода */}
          <ControlBar 
            variation="minimal"
            controls={{
              camera: false,
              microphone: false,
              screenShare: false,
              leave: true,
              chat: false,
              settings: false,
            }}
            onLeave={onDisconnect}
          />
        </div>
      </div>
    </div>
  );
}

export default VideoControlBar; 