import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  LiveKitRoom,
  VideoConference,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import './VideoRoom.css';
import { 
  fetchToken, 
  setRoomName, 
  setParticipantName, 
  clearToken 
} from '../store/slices/videoRoomSlice';
import MediaPreview from './MediaPreview';

// Логотип
const Logo = () => (
  <div className="app-logo">
    <span className="logo-text">OnLiver</span>
    <span className="logo-subtitle">Meet</span>
  </div>
);

function VideoRoom() {
  const dispatch = useDispatch();
  const [screenSize, setScreenSize] = useState('desktop'); // desktop, tablet, mobile
  const { 
    serverUrl, 
    token, 
    roomName, 
    participantName, 
    isConnecting,
    error,
    isCameraEnabled,
    isMicrophoneEnabled
  } = useSelector(state => state.videoRoom);

  // Определяем размер экрана для адаптивной вёрстки
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1200) {
        setScreenSize('desktop');
      } else if (width >= 768) {
        setScreenSize('tablet');
      } else {
        setScreenSize('mobile');
      }
    };

    // Вызываем обработчик при монтировании
    handleResize();

    // Добавляем слушатель изменения размера окна
    window.addEventListener('resize', handleResize);

    // Очищаем слушатель при размонтировании
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleConnect = () => {
    dispatch(fetchToken({ roomName, participantName }));
  };

  const handleRoomNameChange = (e) => {
    dispatch(setRoomName(e.target.value));
  };

  const handleParticipantNameChange = (e) => {
    dispatch(setParticipantName(e.target.value));
  };

  const handleDisconnect = () => {
    dispatch(clearToken());
  };

  // Показываем форму подключения, если нет токена
  if (!token) {
    return (
      <div className={`connect-container ${screenSize}`}>
        <Logo />
        <div className={`connect-form ${screenSize}`}>
          <h2>Подключиться к видеоконференции</h2>
          
          {/* Добавляем компонент превью медиа */}
          <MediaPreview />
          
          <div className="form-group">
            <label>Имя комнаты:</label>
            <input 
              type="text" 
              value={roomName} 
              onChange={handleRoomNameChange}
              placeholder="Введите имя комнаты"
            />
          </div>
          <div className="form-group">
            <label>Ваше имя:</label>
            <input 
              type="text" 
              value={participantName} 
              onChange={handleParticipantNameChange}
              placeholder="Введите ваше имя"
            />
          </div>
          
          <div className="form-footer">
            <button 
              className="button button-primary"
              onClick={handleConnect} 
              disabled={isConnecting || !roomName || !participantName}
            >
              {isConnecting ? 'Подключение...' : 'Присоединиться'}
            </button>
          </div>
          
          {error && <div className="error-message">{error}</div>}
        </div>
        
        <div className="connect-footer">
          <p>©2025 OnLiver Meet</p>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect={true}
      onDisconnected={handleDisconnect}
      className={`video-room ${screenSize}`}
      // Передаем начальное состояние медиа устройств
      options={{
        videoCaptureDefaults: {
          deviceId: undefined,
          resolution: undefined,
          publishDefaults: {
            enabled: isCameraEnabled,
            simulcast: true,
            videoCodec: 'vp8',
          }
        },
        audioCaptureDefaults: {
          deviceId: undefined,
          publishDefaults: {
            enabled: isMicrophoneEnabled
          }
        }
      }}
    >
      <div className={`video-room-header ${screenSize}`}>
        <Logo />
        <div className="room-info">
          <span className="room-name">{roomName}</span>
          {screenSize !== 'mobile' && <span className="participant-name">({participantName})</span>}
        </div>
      </div>
      
      {/* Рендерит аудио для всех участников */}
      <RoomAudioRenderer />
      
      {/* Основной интерфейс видеоконференции */}
      <VideoConference />
      
      {/* Панель управления с кнопками для управления камерой, микрофоном и т.д. */}
      <ControlBar />
      
      <button 
        className={`leave-button button button-primary ${screenSize}`}
        onClick={handleDisconnect}
      >
        {screenSize === 'mobile' ? 'Выйти' : 'Покинуть встречу'}
      </button>
    </LiveKitRoom>
  );
}

export default VideoRoom; 