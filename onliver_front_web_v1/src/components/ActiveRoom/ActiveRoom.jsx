import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  LiveKitRoom,
  VideoConference,
  ControlBar,
  RoomAudioRenderer,
  useTracks,
} from '@livekit/components-react';
import '@livekit/components-styles';
import styles from './ActiveRoom.module.scss';
import { Track } from 'livekit-client';

function ActiveRoom() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const token = location.state?.token;
  const participantName = location.state?.participantName;

  const livekitUrl = 'wss://onliver.ru:8080/livekit';

  // Если нет токена, возвращаемся на главную
  if (!token) {
    // Можно показать сообщение или просто перенаправить
    React.useEffect(() => {
      navigate('/');
    }, [navigate]);
    return <div>Перенаправление...</div>; // Или null, или спиннер
  }

  const handleDisconnect = () => {
    navigate('/'); // Возврат на страницу входа при отключении
  };

  return (
    <div className={styles.activeRoomContainer}>
      <LiveKitRoom
        serverUrl={livekitUrl}
        token={token}
        connect={true}
        // video={true} // Включаем видео по умолчанию
        // audio={true} // Включаем аудио по умолчанию
        options={{
            publishDefaults: {
              videoCodec: "vp9", // Используем VP9 для лучшего качества и поддержки Simulcast
              simulcast: true, // Включаем Simulcast
            },
        }}
        onDisconnected={handleDisconnect}
        data-lk-theme="default" // Используем стандартную тему LiveKit
      >
        {/* Компонент VideoConference отображает всех участников */}
        <VideoConference />
        {/* Компонент RoomAudioRenderer воспроизводит аудио всех участников */}
        <RoomAudioRenderer />
        {/* ControlBar предоставляет кнопки управления (микрофон, камера, экран, выход) */}
        <ControlBar />
      </LiveKitRoom>
    </div>
  );
}

export default ActiveRoom; 