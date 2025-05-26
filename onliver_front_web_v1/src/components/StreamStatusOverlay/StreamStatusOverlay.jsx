import React, { useEffect, useRef, useState } from 'react';
import { useDataChannel } from '@livekit/components-react';
import styles from './StreamStatusOverlay.module.scss';
import PlayIcon from '../../assets/icons/PlayIcon';
import PauseIcon from '../../assets/icons/PauseIcon';
import StopIcon from '../../assets/icons/StopIcon';
import OpenRightIcon from '../../assets/icons/OpenRightIcon';
import CloseLeftIcon from '../../assets/icons/CloseLeftIcon';
import ElipsisDragIcon from '../../assets/icons/ElipsisDragIcon';

function StreamStatusOverlay() {
  const [status, setStatus] = useState(null);
  const [currentPos, setCurrentPos] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const lastUpdate = useRef(0);
  const widgetRef = useRef(null);

  // Определяем мобильное устройство
  useEffect(() => {
    const checkMobile = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768;
      // Дополнительная проверка для DevTools эмуляции
      const isDevToolsEmulation = window.navigator.userAgent.includes('Mobile') || 
                                  window.navigator.userAgent.includes('Android') ||
                                  window.navigator.userAgent.includes('iPhone');
      
      const isMobileDevice = hasTouch || isSmallScreen || isDevToolsEmulation;
      console.log('Mobile detection:', { hasTouch, isSmallScreen, isDevToolsEmulation, isMobileDevice });
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Приходящие сообщения
  useDataChannel('stream-status', (msg) => {
    const text = new TextDecoder().decode(msg.payload);
    try {
      const { durationMs, positionMs, state, room: roomName } = JSON.parse(text);
      console.log(JSON.parse(text));
      
      // Если state = -1, немедленно скрываем виджет
      if (state === -1) {
        setStatus(null);
        setIsExpanded(false);
        return;
      }
      
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
    console.log("status.state", status.state);
    sendControl(status.state === 4 ? 'PAUSE' : 'PLAY', null);
  };

  const handleStop = () => sendControl('STOP', null);

  const handleSeek = (e) => {
    const val = Number(e.target.value);
    setCurrentPos(val);
    sendControl('SEEK', Math.floor(val / 1000));
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Универсальная функция получения координат (мышь или touch)
  const getEventCoordinates = (e) => {
    if (e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  // Обработчики перетаскивания (мышь и touch)
  const handleDragStart = (e) => {
    console.log('Drag start:', e.type, { isMobile, hasTouch: 'ontouchstart' in window });
    e.preventDefault();
    setIsDragging(true);
    const coords = getEventCoordinates(e);
    setDragStart({
      x: coords.x - position.x,
      y: coords.y - position.y,
    });
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const coords = getEventCoordinates(e);
    const newX = coords.x - dragStart.x;
    const newY = coords.y - dragStart.y;
    
    // Ограничиваем перемещение в пределах экрана
    const maxX = window.innerWidth - (widgetRef.current?.offsetWidth || 0);
    const maxY = window.innerHeight - (widgetRef.current?.offsetHeight || 0);
    
    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Добавляем обработчики событий (мышь и touch)
  useEffect(() => {
    if (isDragging) {
      // Добавляем обработчики для обоих типов событий
      document.addEventListener('mousemove', handleDragMove, { passive: false });
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDragMove, { passive: false });
      document.addEventListener('touchend', handleDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging, dragStart]);

  // Эмулируем прогресс и скрытие через 6 секунд после последнего сообщения
  useEffect(() => {
    if (!status) return;
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - lastUpdate.current;
      if (elapsed > 6000) {
        setStatus(null);
        setIsExpanded(false);
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
  const PlayPauseIcon = status.state === 4 ? PauseIcon : status.state === 3 ? PlayIcon : null;

  // Определяем очень маленький экран
  const isVerySmallScreen = window.innerWidth <= 480;

  return (
    <div 
      ref={widgetRef}
      className={`${styles.streamWidget} ${isExpanded ? styles.expanded : ''} ${isDragging ? styles.dragging : ''} ${isMobile ? styles.mobile : ''}`}
      style={{
        left: position.x,
        bottom: window.innerHeight - position.y - (widgetRef.current?.offsetHeight || 80),
      }}
    >
      <div 
        className={styles.dragHandle}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <ElipsisDragIcon />
      </div>
      
      <div className={styles.circleButton}>
        <button className={styles.playPauseBtn} onClick={handlePlayPause}>
          {PlayPauseIcon && <PlayPauseIcon />}
        </button>
        <button className={styles.expandBtn} onClick={toggleExpanded}>
          {isExpanded ? <CloseLeftIcon /> : <OpenRightIcon />}
        </button>
      </div>
      
      {isExpanded && (
        <div className={styles.controls}>
          <button className={styles.stopBtn} onClick={handleStop}>
            <StopIcon />
          </button>
          <div className={styles.timeControls}>
            <span className={styles.time}>{fmt(currentPos)}</span>
            {!isVerySmallScreen && (
              <input
                className={styles.slider}
                type="range"
                min={0}
                max={status.durationMs}
                value={currentPos}
                onChange={(e) => setCurrentPos(Number(e.target.value))}
                onMouseUp={handleSeek}
                onTouchEnd={handleSeek}
              />
            )}
            <span className={styles.time}>{fmt(status.durationMs)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default StreamStatusOverlay; 