import React, { useEffect, useState } from 'react';
import styles from './MoviesList.module.scss';

function MoviesList({ onClose }) {
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

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

  console.log(movies);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Movies</h2>
          <button onClick={onClose}>×</button>
        </div>
        <button className={styles.createBtn} onClick={() => setShowForm(true)}>Create Movie</button>
        {error && <div className={styles.error}>{error}</div>}
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className={styles.grid}>
            {movies.map((movie) => (
              <div key={movie.id} className={styles.card}>
                <img src={movie.avatarUrl} alt={movie.name} />
                <h3>{movie.name}</h3>
                <p>{movie.description}</p>
                <button onClick={() => handleDelete(movie.id)}>Delete</button>
              </div>
            ))}
          </div>
        )}
        <div className={styles.pagination}>
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span>{page + 1} / {totalPages}</span>
          <button disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
        {showForm && <CreateMovieForm onCloseForm={() => { setShowForm(false); fetchMovies(); }} />}
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
        <button className={styles.closeBtn} onClick={() => onCloseForm()}>×</button>
        <h3>Create Movie</h3>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div>
            <label>Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div>
            <label>Avatar</label>
            <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files[0])} required />
          </div>
          <div>
            <label>Video</label>
            <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files[0])} required />
          </div>
          <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create'}</button>
        </form>
      </div>
    </div>
  );
}

export default MoviesList; 