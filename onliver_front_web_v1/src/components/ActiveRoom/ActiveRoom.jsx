import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  LiveKitRoom,
  VideoConference,
  ControlBar,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { useDataChannel } from '@livekit/components-react';   // ✨ добавлено
import styles from './ActiveRoom.module.scss';
import MoviesList from '../MoviesList/MoviesList';
import StreamStatusOverlay from '../StreamStatusOverlay/StreamStatusOverlay';

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

  const handleDisconnect = () => navigate('/');

  return (
    <div className={styles.activeRoomContainer}>
      <LiveKitRoom
        serverUrl={livekitUrl}
        token={token}
        connect
        options={{
          publishDefaults: { videoCodec: 'vp9', simulcast: true },
        }}
        onDisconnected={handleDisconnect}
        data-lk-theme="default"
      >
        <VideoConference />
        <RoomAudioRenderer />   
        <StreamStatusOverlay/>   
      </LiveKitRoom>
      <button className={styles.showMoviesBtn} onClick={() => setShowMovies(true)}>Show Movies</button>
      {showMovies && <MoviesList onClose={() => setShowMovies(false)} />}
    </div>
  );
}

export default ActiveRoom;

