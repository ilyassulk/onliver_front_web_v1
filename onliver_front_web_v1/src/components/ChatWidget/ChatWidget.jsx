import React, { useState, useEffect, useRef } from 'react';
import styles from './ChatWidget.module.scss';
import DeleteIcon from '../../assets/icons/DeleteIcon';

function ChatWidget({
  isVisible,
  onToggle,
  stompClient,
  connected,
  messages,
  setMessages,
  currentRoom,
  setCurrentRoom,
  username,
  userId,
  roomId
}) {
  const [messageInput, setMessageInput] = useState('');
  const [subscription, setSubscription] = useState(null);
  const messagesEndRef = useRef(null);

  // Автоскролл к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentRoom]);

  // Присоединение к комнате чата
  const joinRoom = (roomName) => {
    if (currentRoom === roomName) return;
    
    // Отписываемся от предыдущей комнаты
    if (subscription) {
      subscription.unsubscribe();
    }
    
    setCurrentRoom(roomName);
    
    if (connected && stompClient) {
      const newSubscription = stompClient.subscribe('/chat/' + roomName, function(message) {
        const chatMessage = JSON.parse(message.body);
        
        // Обрабатываем удаление сообщения
        if (chatMessage.type === 'DELETE') {
          setMessages(prev => ({
            ...prev,
            [roomName]: (prev[roomName] || []).filter(msg => msg.id !== chatMessage.id)
          }));
        } else {
          // Сохраняем обычное сообщение в состоянии
          setMessages(prev => ({
            ...prev,
            [roomName]: [...(prev[roomName] || []), chatMessage]
          }));
        }
      });
      
      setSubscription(newSubscription);
    }
  };

  // Отправка сообщения
  const sendMessage = () => {
    const content = messageInput.trim();
    if (content && connected && currentRoom && stompClient) {
      const messageRequest = {
        userId: userId,
        username: username,
        content: content
      };
      
      stompClient.send(`/app/chat/${currentRoom}/send`, {}, JSON.stringify(messageRequest));
      setMessageInput('');
    }
  };

  // Удаление сообщения
  const deleteMessage = (messageId) => {
    if (connected && currentRoom && stompClient) {
      const deleteRequest = {
        messageId: messageId,
        userId: userId
      };
      
      stompClient.send(`/app/chat/${currentRoom}/delete`, {}, JSON.stringify(deleteRequest));
    }
  };

  // Обработка нажатия Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // Автоматическое присоединение к комнате при подключении
  useEffect(() => {
    if (connected && roomId && !currentRoom) {
      joinRoom(roomId);
    }
  }, [connected, roomId]);

  // Очистка подписки при размонтировании
  useEffect(() => {
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [subscription]);

  const currentMessages = messages[currentRoom] || [];

  return (
    <>
      {/* Виджет чата */}
      {isVisible && (
        <div className={styles.chatWidget}>
          <div className={styles.chatHeader}>
            <h3>Чат комнаты {roomId}</h3>
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

          {/* Сообщения */}
          <div className={styles.messagesContainer}>
            {currentMessages.length === 0 ? (
              <div className={styles.emptyState}>
                Пока нет сообщений в комнате {roomId}
              </div>
            ) : (
              currentMessages.map((message) => {
                const isMyMessage = message.username === username;
                return (
                  <div key={message.id} className={`${styles.message} ${isMyMessage ? styles.myMessage : styles.otherMessage}`}>
                    <div className={styles.messageHeader}>
                      <span className={styles.username}>{message.username}</span>
                      <div className={styles.messageActions}>
                        <span className={styles.timestamp}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                        {message.username === username && (
                          <button 
                            className={styles.deleteBtn}
                            onClick={() => deleteMessage(message.id)}
                            title="Удалить сообщение"
                          >
                            <DeleteIcon />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className={styles.messageContent}>
                      {message.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Поле ввода */}
          <div className={styles.inputArea}>
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={connected ? `Сообщение в комнату ${roomId}...` : 'Нет подключения...'}
              disabled={!connected}
              className={styles.messageInput}
            />
            <button 
              onClick={sendMessage}
              disabled={!connected || !messageInput.trim()}
              className={styles.sendBtn}
            >
              Отправить
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatWidget; 