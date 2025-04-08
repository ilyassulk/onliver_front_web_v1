import { useEffect, useState, useCallback } from 'react';
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
import { 
  Track, 
  ConnectionQuality,
  ConnectionState
} from 'livekit-client';
import './VideoRoom.css';
import { 
  fetchToken, 
  setRoomName, 
  setParticipantName, 
  clearToken,
  setSelectedVideoDevice,
  setSelectedAudioDevice
} from '../store/slices/videoRoomSlice';
import MediaPreview from './MediaPreview';

// Логотип
const Logo = () => (
  <div className="app-logo">
    <span className="logo-text">OnLiver</span>
    <span className="logo-subtitle">Meet</span>
  </div>
);

// Компонент для отображения статуса подключения
const ConnectionStatus = ({ room }) => {
  const [status, setStatus] = useState({ level: 'good', text: 'Хорошее' });
  const [isConnected, setIsConnected] = useState(false);
  
  // Отслеживаем состояние подключения
  useEffect(() => {
    if (!room) return;
    
    const handleConnected = () => setIsConnected(true);
    const handleDisconnected = () => setIsConnected(false);
    
    try {
      room.on('connected', handleConnected);
      room.on('disconnected', handleDisconnected);
      
      // Устанавливаем начальное состояние
      setIsConnected(room.state === ConnectionState.Connected);
      
      return () => {
        room.off('connected', handleConnected);
        room.off('disconnected', handleDisconnected);
      };
    } catch (error) {
      console.error('Ошибка при настройке слушателей состояния комнаты:', error);
    }
  }, [room]);
  
  useEffect(() => {
    if (!room || !room.localParticipant) return;
    
    // Функция для обновления статуса соединения
    const updateConnectionStatus = () => {
      try {
        if (!room || !room.localParticipant) return;
        
        let connectionQuality;
        try {
          connectionQuality = room.localParticipant.connectionQuality;
        } catch (error) {
          console.error('Не удалось получить качество соединения:', error);
          // Запасной вариант - используем метрики обратного вызова
          connectionQuality = ConnectionQuality.Excellent; // По умолчанию считаем хорошим
        }
        
        let newStatus = { level: 'good', text: 'Хорошее' };
        
        if (connectionQuality === ConnectionQuality.Poor) {
          newStatus = { level: 'poor', text: 'Плохое' };
        } else if (connectionQuality === ConnectionQuality.Low) {
          newStatus = { level: 'warning', text: 'Среднее' };
        }
        
        setStatus(newStatus);
      } catch (error) {
        console.error('Ошибка при обновлении статуса соединения:', error);
      }
    };
    
    try {
      // Обновляем статус при изменении качества соединения
      room.localParticipant.on('connectionQualityChanged', updateConnectionStatus);
      
      // Начальное обновление
      updateConnectionStatus();
      
      // Также обновляем статус с интервалом (как запасной вариант)
      const intervalId = setInterval(updateConnectionStatus, 5000);
      
      return () => {
        try {
          if (room && room.localParticipant) {
            room.localParticipant.off('connectionQualityChanged', updateConnectionStatus);
          }
          clearInterval(intervalId);
        } catch (error) {
          console.error('Ошибка при удалении слушателя событий:', error);
        }
      };
    } catch (error) {
      console.error('Ошибка при установке слушателя событий:', error);
    }
  }, [room]);
  
  if (!isConnected || !room?.state || room?.state !== ConnectionState.Connected) {
    return null;
  }
  
  return (
    <div className={`connection-status connection-status-${status.level}`}>
      <div className={`connection-status-indicator status-${status.level}`}></div>
      <span>Качество: {status.text}</span>
    </div>
  );
};

function VideoRoom() {
  const dispatch = useDispatch();
  const [screenSize, setScreenSize] = useState('desktop'); // desktop, tablet, mobile
  const [connectionError, setConnectionError] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  
  const { 
    serverUrl, 
    token, 
    roomName, 
    participantName, 
    isConnecting,
    error,
    isCameraEnabled,
    isMicrophoneEnabled,
    selectedVideoDevice,
    selectedAudioDevice,
    videoDevices,
    audioDevices,
    reconnectAttempts
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

  // Функция для автоматического переподключения
  const attemptReconnect = useCallback(() => {
    if (roomName && participantName) {
      console.log(`Попытка переподключения ${reconnectAttempts}/3`);
      dispatch(fetchToken({ roomName, participantName }));
    }
  }, [dispatch, roomName, participantName, reconnectAttempts]);

  // Переподключаемся автоматически при потере соединения,
  // но не более 3-х раз
  useEffect(() => {
    if (error && reconnectAttempts < 3) {
      // Задержка перед повторным подключением
      const reconnectTimer = setTimeout(() => {
        attemptReconnect();
      }, 3000); // 3 секунды задержки
      
      return () => clearTimeout(reconnectTimer);
    }
  }, [error, reconnectAttempts, attemptReconnect]);

  const handleConnect = () => {
    setConnectionError(null);
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

  // Обработчик возможных ошибок LiveKit
  const handleError = (error) => {
    console.error('LiveKit ошибка:', error);
    setConnectionError(error?.message || 'Ошибка подключения к видеоконференции');
    
    // При определенных ошибках можно автоматически отключиться
    if (error?.code === 4001 || error?.code === 4002 || error?.code === 4003 || error?.code === 1005) {
      handleDisconnect();
    }
  };

  // Обработчик выбора устройств
  const handleVideoDeviceChange = (e) => {
    dispatch(setSelectedVideoDevice(e.target.value));
  };

  const handleAudioDeviceChange = (e) => {
    dispatch(setSelectedAudioDevice(e.target.value));
  };

  // Обработчик подключения к комнате
  const handleRoomConnected = (room) => {
    setCurrentRoom(room);
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
          
          {/* Добавляем выбор устройств */}
          {videoDevices.length > 0 && (
            <div className="form-group">
              <label>Камера:</label>
              <select 
                value={selectedVideoDevice || ''} 
                onChange={handleVideoDeviceChange}
                disabled={!isCameraEnabled}
              >
                {videoDevices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Камера ${device.deviceId.substring(0, 5)}...`}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {audioDevices.length > 0 && (
            <div className="form-group">
              <label>Микрофон:</label>
              <select 
                value={selectedAudioDevice || ''} 
                onChange={handleAudioDeviceChange}
                disabled={!isMicrophoneEnabled}
              >
                {audioDevices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Микрофон ${device.deviceId.substring(0, 5)}...`}
                  </option>
                ))}
              </select>
            </div>
          )}
          
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
          {connectionError && <div className="error-message">{connectionError}</div>}
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
      onError={handleError}
      onConnected={handleRoomConnected}
      connectOptions={{
        autoSubscribe: true,
        rtcConfiguration: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ],
          iceTransportPolicy: 'all',
          bundlePolicy: 'balanced',
          sdpSemantics: 'unified-plan'
        }
      }}
      className={`video-room ${screenSize}`}
      // Передаем начальное состояние медиа устройств
      options={{
        videoCaptureDefaults: {
          deviceId: selectedVideoDevice,
          resolution: {
            width: 1280,
            height: 720,
            frameRate: 30,
          },
          publishDefaults: {
            enabled: isCameraEnabled,
            simulcast: true,
            videoCodec: 'vp8',
          }
        },
        audioCaptureDefaults: {
          deviceId: selectedAudioDevice,
          publishDefaults: {
            enabled: isMicrophoneEnabled,
            dtx: true,
            audioProcessing: true,
          }
        },
        adaptiveStream: true,
        dynacast: true,
        disconnectOnPageLeave: true,
      }}
    >
      <div className={`video-room-header ${screenSize}`}>
        <Logo />
        <div className="room-info">
          <span className="room-name">{roomName}</span>
          {screenSize !== 'mobile' && <span className="participant-name">({participantName})</span>}
          <ConnectionStatus room={currentRoom} />
        </div>
      </div>
      
      {/* Рендерит аудио для всех участников */}
      <RoomAudioRenderer />
      
      {/* Основной интерфейс видеоконференции */}
      <VideoConference />
      
      {/* Панель управления с кнопками для управления камерой, микрофоном и т.д. */}
      <ControlBar />
      
      {connectionError && <div className="error-message">{connectionError}</div>}
      
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