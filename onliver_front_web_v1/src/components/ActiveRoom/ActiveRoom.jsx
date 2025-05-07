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

function StreamStatusOverlay() {
  const [status, setStatus] = useState(null);
  const [currentPos, setCurrentPos] = useState(0);
  const lastUpdate = useRef(0);

  // Приходящие сообщения
  useDataChannel('stream-status', (msg) => {
    const text = new TextDecoder().decode(msg.payload);
    try {
      const { durationMs, positionMs, state, room: roomName } = JSON.parse(text);
      console.log(JSON.parse(text));
      
      setStatus({ durationMs, positionMs, state, roomName });
      setCurrentPos(positionMs);
      lastUpdate.current = Date.now();
    } catch (e) {
      console.warn('Invalid stream-status payload', e);
    }
  });

  // Функция отправки управления трансляцией
  const sendControl = (command, seekTime) => {
    console.log(status);
    
    if (!status?.roomName) return;
    fetch('https://onliver.ru:8080/translation/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomName: status.roomName,
        command,
        seekTime,
      }),
    }).catch((e) => console.error('Control send error', e));
  };

  const handlePlayPause = () => {
    console.log("status.state",status.state);
    sendControl(status.state === 4 ? 'PAUSE' : 'PLAY', null)};
  const handleStop = () => sendControl('STOP', null);
  const handleSeek = (e) => {
    const val = Number(e.target.value);
    setCurrentPos(val);
    sendControl('SEEK', Math.floor(val / 1000));
  };

  // Эмулируем прогресс и скрытие через 6 секунд после последнего сообщения
  useEffect(() => {
    if (!status) return;
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - lastUpdate.current;
      if (elapsed > 6000) {
        setStatus(null);
        clearInterval(intervalId);
      } else {
        const newPos = status.positionMs + elapsed;
        setCurrentPos(Math.min(newPos, status.durationMs));
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [status]);

  // Если нет статуса — не показываем оверлей
  if (!status) return null;

  // Форматируем мс в HH:MM:SS
  const fmt = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return [
      h > 0 ? String(h).padStart(2, '0') : null,
      String(m).padStart(2, '0'),
      String(s).padStart(2, '0'),
    ]
      .filter((x) => x !== null)
      .join(':');
  };

  // Показываем Play или Pause в зависимости от state
  // (state === 4 → «Pause», state === 3 → «Play»)
  const buttonLabel =
    status.state === 4 ? '⏸︎' : status.state === 3 ? '▶︎' : '';

  return (
    <div className={styles.streamStatusOverlay}>
      <button onClick={handlePlayPause}>{buttonLabel}</button>
      <button onClick={handleStop}>■</button>
      <span className="time">{fmt(currentPos)}</span>
      <input
        type="range"
        min={0}
        max={status.durationMs}
        value={currentPos}
        onChange={(e) => setCurrentPos(Number(e.target.value))}
        onMouseUp={handleSeek}
      />
      <span className="time">{fmt(status.durationMs)}</span>
    </div>
  );
}