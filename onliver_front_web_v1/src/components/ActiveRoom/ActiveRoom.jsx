import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  LiveKitRoom,
  ControlBar,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { useDataChannel } from '@livekit/components-react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import styles from './ActiveRoom.module.scss';
import MoviesList from '../MoviesList/MoviesList';
import StreamStatusOverlay from '../StreamStatusOverlay/StreamStatusOverlay';
import CustomVideoConference from '../CustomVideoConference';
import ChatWidget from '../ChatWidget/ChatWidget';

function DataLogger() {
  useDataChannel('stream-status', (msg) => {
    console.log('msg', msg);
    const text = new TextDecoder().decode(msg.payload);
    console.log('[stream-status]', {
      text,
      topic: msg.topic,
      kind: msg.kind,
      sender: msg.participant?.identity ?? 'server',
    });
  });

  return null;
}

function ActiveRoom() {
  const [showMovies, setShowMovies] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatConnected, setChatConnected] = useState(false);
  const [stompClient, setStompClient] = useState(null);
  const [chatMessages, setChatMessages] = useState({});
  const [currentChatRoom, setCurrentChatRoom] = useState(null);
  
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const token = location.state?.token;
  const participantName = location.state?.participantName;

  const livekitUrl = 'wss://onliver.ru:8080/livekit';

  // WebSocket подключение для чата
  useEffect(() => {
    const connectToChat = () => {
      const socket = new SockJS('https://onliver.ru:8080/ws');
      const client = Stomp.over(socket);
      
      client.connect({}, 
        function(frame) {
          console.log('Подключено к чату: ' + frame);
          setChatConnected(true);
          setStompClient(client);
        },
        function(error) {
          console.error('Ошибка подключения к чату: ', error);
          setChatConnected(false);
          
          // Пробуем переподключиться через 5 секунд
          setTimeout(connectToChat, 5000);
        }
      );
    };

    connectToChat();

    // Очистка при размонтировании
    return () => {
      if (stompClient) {
        stompClient.disconnect();
      }
    };
  }, []);

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

  const handleToggleChat = () => {
    setShowChat(!showChat);
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
      
      <ChatWidget 
        isVisible={showChat}
        onToggle={handleToggleChat}
        stompClient={stompClient}
        connected={chatConnected}
        messages={chatMessages}
        setMessages={setChatMessages}
        currentRoom={currentChatRoom}
        setCurrentRoom={setCurrentChatRoom}
        username={participantName || 'Аноним'}
        userId={`user-${Date.now()}`}
        roomId={roomId}
      />
      
      {/*<button className={styles.showMoviesBtn} onClick={() => setShowMovies(true)}>Show Movies</button>
      {showMovies && <MoviesList onClose={() => setShowMovies(false)} />}*/}
    </div>
  );
}

export default ActiveRoom;

