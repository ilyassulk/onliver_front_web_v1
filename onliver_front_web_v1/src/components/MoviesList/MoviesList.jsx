import React, { useEffect, useState } from 'react';
import AddIcon from '../../assets/icons/AddIcon';
import LoadIcon from '../../assets/icons/LoadIcon';
import EyeIcon from '../../assets/icons/EyeIcon';
import CheckIcon from '../../assets/icons/CheckIcon';
import PlayIcon from '../../assets/icons/PlayIcon';
import styles from './MoviesList.module.scss';

function MoviesList({ onClose, onAddToPlaylist, showAddButtons = false }) {
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [addingMovies, setAddingMovies] = useState(new Set());

  const fetchMovies = async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await fetch(`https://onliver.ru:8080/content?page=${page}&size=10`);
      if (!resp.ok) throw new Error(`Ошибка: ${resp.status}`);
      const data = await resp.json();
      setMovies(data.content);
      setTotalPages(data.totalPages);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [page]);

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const resp = await fetch(`https://onliver.ru:8080/content/${id}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error(`Ошибка: ${resp.status}`);
      fetchMovies();
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const handleAddToPlaylist = (movieId) => {
    if (onAddToPlaylist) {
      setAddingMovies(prev => new Set(prev).add(movieId));
      
      onAddToPlaylist(movieId);
      
      setTimeout(() => {
        setAddingMovies(prev => {
          const newSet = new Set(prev);
          newSet.delete(movieId);
          return newSet;
        });
      }, 1200);
    }
  };

  const handleViewMovie = (movie) => {
    setSelectedMovie(movie);
  };

  const handleCloseMovieView = () => {
    setSelectedMovie(null);
  };

  console.log(movies);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>{showAddButtons ? 'Добавить фильм в плейлист' : 'Movies'}</h2>
          <div className={styles.headerActions}>
              <button 
                className={styles.loadBtn} 
                onClick={() => setShowForm(true)}
                title="Загрузить новый контент"
              >
                <LoadIcon />
                Загрузить
              </button>
            <button className={styles.closeBtn} onClick={onClose}>×</button>
          </div>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        
        <div className={styles.contentArea}>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className={styles.grid}>
              {movies.map((movie) => (
                <div key={movie.id} className={styles.card}>
                  <img src={movie.avatarUrl} alt={movie.name} />
                  <h3>{movie.name}</h3>
                  <div className={styles.cardActions}>
                    {showAddButtons ? (
                      <>
                        <button 
                          className={`${styles.addToPlaylistBtn} ${addingMovies.has(movie.id) ? styles.adding : ''}`}
                          onClick={() => handleAddToPlaylist(movie.id)}
                          title="Добавить в плейлист"
                          disabled={addingMovies.has(movie.id)}
                        >
                          {addingMovies.has(movie.id) ? <CheckIcon /> : <AddIcon />}
                          Добавить
                        </button>
                        <button 
                          className={styles.viewBtn}
                          onClick={() => handleViewMovie(movie)}
                          title="Просмотреть карточку"
                        >
                          <EyeIcon />
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          className={styles.viewBtn}
                          onClick={() => handleViewMovie(movie)}
                          title="Просмотреть карточку"
                        >
                          <EyeIcon />
                        </button>
                        <button 
                          className={styles.deleteBtn}
                          onClick={() => handleDelete(movie.id)}
                        >
                          🗑️ Удалить
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className={styles.pagination}>
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span>{page + 1} / {totalPages}</span>
          <button disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
        
        {showForm && <CreateMovieForm onCloseForm={() => { setShowForm(false); fetchMovies(); }} />}
        {selectedMovie && (
          <MovieDetailView 
            movie={selectedMovie} 
            onClose={handleCloseMovieView}
            onAddToPlaylist={showAddButtons ? onAddToPlaylist : null}
            showAddButton={showAddButtons}
          />
        )}
      </div>
    </div>
  );
}

function MovieDetailView({ movie, onClose, onAddToPlaylist, showAddButton }) {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handlePlayMovie = async () => {
    setLoadingVideo(true);
    setVideoError('');
    
    try {
      const response = await fetch(`https://onliver.ru:8080/content/${movie.id}/url`);
      if (!response.ok) {
        throw new Error(`Ошибка загрузки видео: ${response.status}`);
      }
      
      const videoUrl = await response.text();
      console.log('Полученный URL видео:', videoUrl);
      setVideoUrl(videoUrl);
      setShowVideoModal(true);
    } catch (error) {
      setVideoError(error.message);
    } finally {
      setLoadingVideo(false);
    }
  };

  const handleCloseVideoModal = () => {
    setShowVideoModal(false);
    setVideoUrl('');
  };

  const handleAddToPlaylist = () => {
    if (onAddToPlaylist) {
      setIsAdding(true);
      onAddToPlaylist(movie.id);
      
      setTimeout(() => {
        setIsAdding(false);
      }, 1200);
    }
  };

  return (
    <>
      <div className={styles.detailOverlay}>
        <div className={styles.detailModal}>
          <div className={styles.detailHeader}>
            <h2>Информация о фильме</h2>
            <button className={styles.detailCloseBtn} onClick={onClose}>×</button>
          </div>
          
          <div className={styles.detailContent}>
            <div className={styles.detailImageContainer}>
              <img src={movie.avatarUrl} alt={movie.name} className={styles.detailImage} />
            </div>
            
            <div className={styles.detailInfo}>
              <h3 className={styles.detailTitle}>{movie.name}</h3>
              <div className={styles.detailDescription}>
                <h4>Описание:</h4>
                <p>{movie.description}</p>
              </div>
              
              {videoError && <div className={styles.error}>{videoError}</div>}
            </div>
          </div>
          
          <div className={styles.detailActions}>
            <button 
              className={styles.playBtn}
              onClick={handlePlayMovie}
              disabled={loadingVideo}
              title="Предпросмотр фильма"
            >
              <PlayIcon />
              {loadingVideo ? 'Загрузка...' : 'Предпросмотр'}
            </button>
            
            {showAddButton && (
              <button 
                className={`${styles.addToPlaylistBtnDetail} ${isAdding ? styles.adding : ''}`}
                onClick={handleAddToPlaylist}
                title="Добавить в плейлист"
                disabled={isAdding}
              >
                {isAdding ? <CheckIcon /> : <AddIcon />}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {showVideoModal && (
        <VideoModal 
          videoUrl={videoUrl} 
          movieTitle={movie.name}
          onClose={handleCloseVideoModal} 
        />
      )}
    </>
  );
}

function CreateMovieForm({ onCloseForm }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');

  const uploadFileWithProgress = (url, file, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(percentComplete);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Ошибка загрузки: ${xhr.status}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Ошибка сети при загрузке файла'));
      });
      
      xhr.open('PUT', url);
      xhr.send(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setUploadProgress(0);
    
    if (!avatarFile || !videoFile) {
      setError('Select avatar and video files');
      setLoading(false);
      return;
    }
    
    try {
      // Шаг 1: получаем presigned URLs
      setUploadStage('Подготовка загрузки...');
      const respUrls = await fetch('https://onliver.ru:8080/content/uploadurls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarName: avatarFile.name, contentName: videoFile.name }),
      });
      if (!respUrls.ok) throw new Error(`Ошибка: ${respUrls.status}`);
      const urls = await respUrls.json();
      
      // Шаг 2: загружаем файлы с отслеживанием прогресса
      setUploadStage('Загрузка постера...');
      await uploadFileWithProgress(urls.avatar.uploadUrl, avatarFile, (progress) => {
        setUploadProgress(progress * 0.4); // 40% для постера
      });
      
      setUploadStage('Загрузка видео...');
      await uploadFileWithProgress(urls.content.uploadUrl, videoFile, (progress) => {
        setUploadProgress(40 + (progress * 0.5)); // 50% для видео (40% + 50% = 90%)
      });
      
      // Шаг 3: отправляем метаданные
      setUploadStage('Завершение...');
      setUploadProgress(95);
      const respCreate = await fetch('https://onliver.ru:8080/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: name, description, avatarKey: urls.avatar.objectKey, contentKey: urls.content.objectKey }),
      });
      if (!respCreate.ok) throw new Error(`Ошибка: ${respCreate.status}`);
      
      setUploadProgress(100);
      setUploadStage('Завершено!');
      setTimeout(() => {
        onCloseForm();
      }, 500);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setUploadProgress(0);
      setUploadStage('');
    }
  };

  return (
    <div className={styles.formOverlay}>
      <div className={styles.formModal}>
        <div className={styles.formHeader}>
          <h3>Загрузить новый контент</h3>
          <button className={styles.formCloseBtn} onClick={() => onCloseForm()}>×</button>
        </div>
        
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} className={styles.uploadForm}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Название</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              className={styles.formInput}
              placeholder="Введите название фильма"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Описание</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              required 
              className={styles.formTextarea}
              placeholder="Введите описание фильма"
              rows="3"
            />
          </div>
          
          <div className={styles.fileInputsContainer}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Постер</label>
              <div className={styles.fileInputWrapper}>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setAvatarFile(e.target.files[0])} 
                  required 
                  className={styles.fileInput}
                  id="avatar-input"
                />
                <label htmlFor="avatar-input" className={styles.fileInputLabel}>
                  <LoadIcon />
                  {avatarFile ? avatarFile.name : 'Выберите изображение'}
                </label>
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Видео</label>
              <div className={styles.fileInputWrapper}>
                <input 
                  type="file" 
                  accept="video/*" 
                  onChange={(e) => setVideoFile(e.target.files[0])} 
                  required 
                  className={styles.fileInput}
                  id="video-input"
                />
                <label htmlFor="video-input" className={styles.fileInputLabel}>
                  <LoadIcon />
                  {videoFile ? videoFile.name : 'Выберите видео файл'}
                </label>
              </div>
            </div>
          </div>
          
          <div className={styles.formActions}>
            <button 
              type="button" 
              onClick={onCloseForm}
              className={styles.cancelBtn}
              disabled={loading}
            >
              Отмена
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className={styles.submitBtn}
            >
              {loading ? (
                <div className={styles.uploadProgress}>
                  <div className={styles.progressInfo}>
                    <span>{uploadStage}</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill} 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              ) : 'Загрузить контент'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function VideoModal({ videoUrl, movieTitle, onClose }) {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.videoModalOverlay} onClick={handleOverlayClick}>
      <div className={styles.videoModalContainer}>
        <div className={styles.videoModalHeader}>
          <h3>{movieTitle}</h3>
          <button className={styles.videoModalCloseBtn} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.videoContainer}>
          <video 
            src={videoUrl} 
            controls 
            autoPlay
            className={styles.videoPlayer}
            onError={(e) => {
              console.error('Ошибка загрузки видео:', e);
            }}
          >
            Ваш браузер не поддерживает воспроизведение видео.
          </video>
        </div>
      </div>
    </div>
  );
}

export default MoviesList; 