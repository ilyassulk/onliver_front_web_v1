import { useState, useEffect } from 'react';
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

function VideoRoom() {
  const serverUrl = 'wss://onliver.ru:8080/livekit';
  const [token, setToken] = useState(null);
  const [roomName, setRoomName] = useState('exampleRoom');
  const [participantName, setParticipantName] = useState(`user_${Math.floor(Math.random() * 10000)}`);
  const [isConnecting, setIsConnecting] = useState(false);

  const getToken = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch(`https://onliver.ru:8080/token?roomName=${roomName}&participantName=${participantName}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Ошибка получения токена');
      }
      
      const tokenData = await response.json();
      setToken(tokenData.token);
    } catch (error) {
      console.error('Ошибка при получении токена:', error);
      alert('Не удалось подключиться. Проверьте консоль для деталей.');
    } finally {
      setIsConnecting(false);
    }
  };

  if (!token) {
    return (
      <div className="connect-form">
        <h2>Подключиться к комнате</h2>
        <div>
          <label>
            Имя комнаты:
            <input 
              type="text" 
              value={roomName} 
              onChange={(e) => setRoomName(e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            Ваше имя:
            <input 
              type="text" 
              value={participantName} 
              onChange={(e) => setParticipantName(e.target.value)}
            />
          </label>
        </div>
        <button 
          onClick={getToken} 
          disabled={isConnecting || !roomName || !participantName}
        >
          {isConnecting ? 'Подключение...' : 'Подключиться'}
        </button>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect={true}
      onDisconnected={() => setToken(null)}
      className="video-room"
    >
      {/* Рендерит аудио для всех участников */}
      <RoomAudioRenderer />
      
      {/* Основной интерфейс видеоконференции */}
      <VideoConference />
      
      {/* Панель управления с кнопками для управления камерой, микрофоном и т.д. */}
      <ControlBar />
    </LiveKitRoom>
  );
}

export default VideoRoom; 