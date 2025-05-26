import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  LiveKitRoom,
  ControlBar,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { useDataChannel } from '@livekit/components-react';   // ✨ добавлено
import styles from './ActiveRoom.module.scss';
import MoviesList from '../MoviesList/MoviesList';
import StreamStatusOverlay from '../StreamStatusOverlay/StreamStatusOverlay';
import CustomVideoConference from '../CustomVideoConference';

function DataLogger() {                                      // ✨ новый компонент
  useDataChannel('stream-status', (msg) => {
    console.log('msg', msg);
    const text = new TextDecoder().decode(msg.payload);
    console.log('[stream-status]', {
      text,
      topic: msg.topic,
      kind: msg.kind,          // RELIABLE | LOSSY
      sender: msg.participant?.identity ?? 'server',
    });
  });

  return null;
}

function ActiveRoom() {
  const [showMovies, setShowMovies] = useState(false);
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const token = location.state?.token;
  const participantName = location.state?.participantName;

  const livekitUrl = 'wss://onliver.ru:8080/livekit';

  // если токена нет — редирект
  React.useEffect(() => {
    if (!token) navigate('/');
  }, [token, navigate]);

  if (!token) return <div>Перенаправление...</div>;

  // Логирование параметров подключения
  console.log('🔑 Параметры подключения:', {
    roomId,
    participantName,
    tokenLength: token?.length,
    livekitUrl
  });

  const handleDisconnect = (reason) => {
    console.log('🚪 Отключение от комнаты:', reason);
    navigate('/');
  };

  return (
    <div className={styles.activeRoomContainer}>
      <LiveKitRoom
        serverUrl={livekitUrl}
        token={token}
        connect={true}
        options={{
          publishDefaults: { 
            videoCodec: 'h264',
            simulcast: false,
          },
          videoCaptureDefaults: {
            resolution: {
              width: 640,
              height: 480,
              frameRate: 15,
            },
          },
          audioCaptureDefaults: {
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: true,
          },
        }}
        onDisconnected={handleDisconnect}
        onConnected={(room) => {
          console.log('🎉 Подключен к комнате:', room?.name || 'Неизвестная комната');
          console.log('🔍 Объект комнаты:', room);
        }}
        onError={(error) => {
          console.error('❌ Ошибка подключения:', error);
          console.error('🔍 Детали ошибки:', {
            message: error?.message,
            code: error?.code,
            stack: error?.stack
          });
        }}
        data-lk-theme="default"
      >
        <CustomVideoConference />
        <StreamStatusOverlay/>   
      </LiveKitRoom>
      <button className={styles.showMoviesBtn} onClick={() => setShowMovies(true)}>Show Movies</button>
      {showMovies && <MoviesList onClose={() => setShowMovies(false)} />}
    </div>
  );
}

export default ActiveRoom;

