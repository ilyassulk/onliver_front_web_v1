import React, { useState, useEffect, useRef } from 'react';
import AddIcon from '../../assets/icons/AddIcon';
import UpDownIcon from '../../assets/icons/UpDownIcon';
import RefreshIcon from '../../assets/icons/RefreshIcon';
import PlaylistItem from './PlaylistItem/PlaylistItem';
import DropZone from './DropZone/DropZone';
import MoviesList from '../MoviesList/MoviesList';
import styles from './PlaylistWidget.module.scss';



function PlaylistWidget({
  isVisible,
  onToggle,
  stompClient,
  connected,
  roomId
}) {
  const [playlist, setPlaylist] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [showMoviesList, setShowMoviesList] = useState(false);
  const [isDragMode, setIsDragMode] = useState(false);
  
  // Состояние для drag and drop
  const [draggedItem, setDraggedItem] = useState(null);
  
  // Состояние для хранения информации о контенте
  const [contentCache, setContentCache] = useState(new Map());
  const [loadingContent, setLoadingContent] = useState(new Set());
  
  // Поля форм (убираем moveCellId и moveTargetIndex)
  const [contentId, setContentId] = useState('');

  // Функция для загрузки информации о контенте
  const fetchContentInfo = async (contentId) => {
    if (contentCache.has(contentId) || loadingContent.has(contentId)) {
      return;
    }

    setLoadingContent(prev => new Set(prev).add(contentId));

    try {
      const response = await fetch(`https://onliver.ru:8080/content/${contentId}`);
      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status}`);
      }
      const contentInfo = await response.json();
      
      setContentCache(prev => new Map(prev).set(contentId, contentInfo));
    } catch (error) {
      console.error(`Ошибка загрузки контента ${contentId}:`, error);
      setContentCache(prev => new Map(prev).set(contentId, null));
    } finally {
      setLoadingContent(prev => {
        const newSet = new Set(prev);
        newSet.delete(contentId);
        return newSet;
      });
    }
  };

  // Функция для очистки кэша от неиспользуемых элементов
  const cleanupContentCache = (currentItems) => {
    const currentContentIds = new Set(currentItems.map(item => item.contentId));
    
    setContentCache(prev => {
      const newCache = new Map();
      for (const [contentId, data] of prev) {
        if (currentContentIds.has(contentId)) {
          newCache.set(contentId, data);
        }
      }
      return newCache;
    });
    
    setLoadingContent(prev => {
      const newSet = new Set();
      for (const contentId of prev) {
        if (currentContentIds.has(contentId)) {
          newSet.add(contentId);
        }
      }
      return newSet;
    });
  };

  // Присоединение к комнате плейлиста
  const joinRoom = (roomName) => {
    console.log('Присоединяемся к комнате:', roomName);
    
    // Отписываемся от предыдущей комнаты
    if (subscription) {
      console.log('Отписываемся от предыдущей подписки');
      subscription.unsubscribe();
    }
    
    setPlaylist(null);
    
    if (connected && stompClient) {
      // Подписываемся на обновления плейлиста
      const newSubscription = stompClient.subscribe(`/playlist/${roomName}`, function(message) {
        const playlistData = JSON.parse(message.body);
        handlePlaylistUpdate(playlistData);
      });
      
      console.log('Установлена новая подписка для комнаты:', roomName);
      setSubscription(newSubscription);
      
      // Запрашиваем состояние сразу
      requestPlaylistState(roomName);
    }
  };

  // Запрос состояния плейлиста
  const requestPlaylistState = (roomName) => {
    if (connected && stompClient && roomName) {
      console.log('Запрашиваем состояние плейлиста для комнаты:', roomName);
      stompClient.send(`/app/playlist/${roomName}/state`, {}, '{}');
    }
  };

  // Обработка обновления плейлиста
  const handlePlaylistUpdate = (playlistData) => {
    console.log('Получено обновление плейлиста:', playlistData);
    setPlaylist(playlistData);
    
    // Загружаем информацию о контенте для всех элементов
    if (playlistData && playlistData.items) {
      // Очищаем кэш от неиспользуемых элементов
      cleanupContentCache(playlistData.items);
      
      playlistData.items.forEach(item => {
        if (item.contentId) {
          fetchContentInfo(item.contentId);
        }
      });
    }
  };

  // Переключение autoPlay
  const toggleAutoPlay = () => {
    if (connected && roomId && stompClient) {
      stompClient.send(`/app/playlist/${roomId}/toggle-autoplay`, {}, '{}');
    }
  };

  // Запуск ячейки (используется только в PlaylistItem)
  const startCell = (cellId) => {
    if (connected && roomId && stompClient) {
      const request = { cellId: cellId };
      stompClient.send(`/app/playlist/${roomId}/start-cell`, {}, JSON.stringify(request));
    }
  };

  // Добавление элемента
  const addItem = () => {
    const content = contentId.trim();
    if (content && connected && roomId && stompClient) {
      const request = { contentId: content };
      stompClient.send(`/app/playlist/${roomId}/add-item`, {}, JSON.stringify(request));
      
      // Предварительно загружаем информацию о контенте
      fetchContentInfo(content);
      
      setContentId('');
    }
  };

  // Добавление фильма из списка
  const addMovieToPlaylist = (movieId) => {
    if (connected && roomId && stompClient) {
      const request = { contentId: movieId.toString() };
      stompClient.send(`/app/playlist/${roomId}/add-item`, {}, JSON.stringify(request));
      
      // Предварительно загружаем информацию о контенте
      fetchContentInfo(movieId.toString());
    }
  };

  // Удаление элемента (используется только в PlaylistItem)
  const removeItem = (cellId) => {
    if (connected && roomId && stompClient) {
      const request = { cellId: cellId };
      stompClient.send(`/app/playlist/${roomId}/remove-item`, {}, JSON.stringify(request));
    }
  };

  const quickMove = (cellId, targetIndex) => {
    targetIndex = parseInt(targetIndex);
    if (connected && roomId && !isNaN(targetIndex) && stompClient) {
      const request = { cellId: cellId, targetIndex: targetIndex };
      stompClient.send(`/app/playlist/${roomId}/move-item`, {}, JSON.stringify(request));
    }
  };

  // Перемещение элемента через drag & drop
  const moveItem = (cellId, targetIndex) => {
    if (connected && roomId && stompClient) {
      const request = { cellId: cellId, targetIndex: targetIndex };
      stompClient.send(`/app/playlist/${roomId}/move-item`, {}, JSON.stringify(request));
      console.log(`Перемещаем ячейку ${cellId} на позицию ${targetIndex}`);
    }
  };

  // Обработка нажатия Enter
  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  // Обработчик изменения состояния перетаскивания
  const handleDragStateChange = (isDragging) => {
    setIsDragMode(isDragging);
  };

  // Обработчик начала drag операции
  const handleDragStart = (item, index) => {
    console.log('Начало перетаскивания:', item);
    setDraggedItem({ ...item, originalIndex: index });
    setIsDragMode(true);
  };

  // Обработчик окончания drag операции
  const handleDragEnd = () => {
    console.log('Окончание перетаскивания');
    setDraggedItem(null);
    setIsDragMode(false);
  };

  // Обработчик drop в DropZone
  const handleDropZoneDrop = (cellId, targetIndex) => {
    if (!draggedItem || draggedItem.cellId !== cellId) {
      console.error('Несоответствие данных drag операции');
      return;
    }

    const originalIndex = draggedItem.originalIndex;
    
    console.log(`Перемещение ячейки ${cellId} с позиции ${originalIndex} на позицию ${targetIndex}`);
    
    // Корректируем индекс если перемещаем элемент вниз
    let adjustedTargetIndex = targetIndex;
    if (originalIndex < targetIndex) {
      adjustedTargetIndex = targetIndex - 1;
    }
    
    // Отправляем запрос на сервер
    quickMove(cellId, adjustedTargetIndex);
    
    // Сбрасываем состояние drag
    handleDragEnd();
  };

  // Функция для очистки подписок
  const cleanupSubscriptions = () => {
    console.log('Очищаем подписки');
    if (subscription) {
      subscription.unsubscribe();
      setSubscription(null);
    }
  };

  // Автоматическое присоединение к комнате при подключении
  useEffect(() => {
    if (connected && roomId && isVisible) {
      joinRoom(roomId);
    } else if (!isVisible) {
      // Очищаем подписки при закрытии виджета
      cleanupSubscriptions();
    }
  }, [connected, roomId, isVisible]);

  // Очистка подписки при размонтировании компонента
  useEffect(() => {
    return () => {
      cleanupSubscriptions();
    };
  }, []); // Убираем dependency array - cleanup должен работать только при unmount

  return (
    <>
      {/* Виджет плейлиста */}
      {isVisible && (
        <div className={styles.playlistWidget}>
          <div className={styles.playlistHeader}>
            <h3>Плейлист комнаты {roomId}</h3>
            <div className={styles.connectionStatus}>
              <span className={`${styles.statusIndicator} ${connected ? styles.connected : styles.disconnected}`}></span>
              {connected ? 'Подключено' : 'Отключено'}
            </div>
            <button 
              className={styles.closeBtn}
              onClick={onToggle}
            >
              ×
            </button>
          </div>

          {/* Статус плейлиста */}
          {playlist && (
            <div className={styles.playlistStatus}>
              <div className={styles.autoplayContainer}>
                <span className={styles.autoplayLabel}>AutoPlay:</span>
                <button 
                  className={`${styles.autoplayToggle} ${playlist.autoPlay ? styles.autoplayOn : styles.autoplayOff}`}
                  onClick={toggleAutoPlay}
                  disabled={!connected}
                  title={`AutoPlay ${playlist.autoPlay ? 'включен' : 'выключен'}`}
                >
                  <div className={styles.toggleSlider}></div>
                </button>
              </div>
              <button 
                className={styles.addMovieBtn}
                onClick={() => setShowMoviesList(true)}
                disabled={!connected}
                title="Добавить фильм из списка"
              >
                <AddIcon />
              </button>
              <div className={styles.statusContainer}>
                <span className={`${styles.statusBadge} ${styles[`status${playlist.status.toLowerCase()}`]}`}>
                  {playlist.status}
                </span>
                <button 
                  className={styles.refreshBtn}
                  onClick={() => requestPlaylistState(roomId)}
                  disabled={!connected}
                  title="Обновить состояние плейлиста"
                >
                  <RefreshIcon />
                </button>
              </div>
            </div>
          )}

          {/* Список элементов плейлиста */}
          <div className={styles.playlistItems}>
            {!playlist ? (
              <div className={styles.emptyState}>
                Загрузка плейлиста...
              </div>
            ) : playlist.items.length === 0 ? (
              <div className={styles.emptyState}>
                Плейлист пуст
                {/* DropZone для пустого плейлиста */}
                <DropZone 
                  index={0}
                  onDrop={handleDropZoneDrop}
                  draggedItem={draggedItem}
                />
              </div>
            ) : (
              <>
                {playlist.items.map((item, index) => (
                  <React.Fragment key={item.cellId}>
                    {/* DropZone перед каждым элементом */}
                    <DropZone 
                      index={index}
                      onDrop={handleDropZoneDrop}
                      draggedItem={draggedItem}
                    />
                    
                    <PlaylistItem 
                      item={item}
                      index={index}
                      totalItems={playlist.items.length}
                      isCurrentItem={index === playlist.currentIndex}
                      playlistStatus={playlist.status}
                      onStart={startCell}
                      onRemove={removeItem}
                      onMove={moveItem}
                      onQuickMove={quickMove}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDragStateChange={handleDragStateChange}
                      isDragMode={isDragMode}
                      contentInfo={contentCache.get(item.contentId)}
                      loadingContent={loadingContent.has(item.contentId)}
                    />
                  </React.Fragment>
                ))}
                
                {/* DropZone в конце списка */}
                <DropZone 
                  index={playlist.items.length}
                  onDrop={handleDropZoneDrop}
                  draggedItem={draggedItem}
                />
              </>
            )}
          </div>


     
        </div>
      )}

      {/* Модальное окно со списком фильмов */}
      {showMoviesList && (
        <MoviesList 
          onClose={() => setShowMoviesList(false)}
          onAddToPlaylist={addMovieToPlaylist}
          showAddButtons={true}
        />
      )}
    </>
  );
}

export default PlaylistWidget; 