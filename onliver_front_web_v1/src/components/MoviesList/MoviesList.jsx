import React, { useEffect, useState } from 'react';
import AddIcon from '../../assets/icons/AddIcon';
import LoadIcon from '../../assets/icons/LoadIcon';
import styles from './MoviesList.module.scss';

function MoviesList({ onClose, onAddToPlaylist, showAddButtons = false }) {
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);

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
      onAddToPlaylist(movieId);
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
                          className={styles.addToPlaylistBtn}
                          onClick={() => handleAddToPlaylist(movie.id)}
                          title="Добавить в плейлист"
                        >
                          <AddIcon />
                          Добавить
                        </button>
                        <button 
                          className={styles.viewBtn}
                          onClick={() => handleViewMovie(movie)}
                          title="Просмотреть карточку"
                        >
                          👁️ Просмотр
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          className={styles.viewBtn}
                          onClick={() => handleViewMovie(movie)}
                          title="Просмотреть карточку"
                        >
                          👁️ Просмотр
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
        {selectedMovie && <MovieDetailView movie={selectedMovie} onClose={handleCloseMovieView} />}
      </div>
    </div>
  );
}

function MovieDetailView({ movie, onClose }) {
  return (
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
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateMovieForm({ onCloseForm }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!avatarFile || !videoFile) {
      setError('Select avatar and video files');
      setLoading(false);
      return;
    }
    try {
      // Шаг 1: получаем presigned URLs
      const respUrls = await fetch('https://onliver.ru:8080/content/uploadurls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarName: avatarFile.name, contentName: videoFile.name }),
      });
      if (!respUrls.ok) throw new Error(`Ошибка: ${respUrls.status}`);
      const urls = await respUrls.json();
      // Шаг 2: загружаем файлы напрямую
      await fetch(urls.avatar.uploadUrl, { method: 'PUT', body: avatarFile });
      await fetch(urls.content.uploadUrl, { method: 'PUT', body: videoFile });
      // Шаг 3: отправляем метаданные
      const respCreate = await fetch('https://onliver.ru:8080/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: name, description, avatarKey: urls.avatar.objectKey, contentKey: urls.content.objectKey }),
      });
      if (!respCreate.ok) throw new Error(`Ошибка: ${respCreate.status}`);
      onCloseForm();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
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
              {loading ? 'Загрузка...' : 'Загрузить контент'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MoviesList; 