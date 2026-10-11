import React, { useState, useEffect } from 'react';
import { Camera, Video, Grid, Maximize } from 'lucide-react';
import { getGalleryItems, GalleryItem } from '../db';

export const Gallery: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos');
  const [filterCategory, setFilterCategory] = useState('All');
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [photoItems, setPhotoItems] = useState<GalleryItem[]>([]);

  useEffect(() => {
    const loadItems = async () => {
      const items = await getGalleryItems();
      setPhotoItems(items);
    };
    loadItems();
  }, []);

  const categories = ['All', 'Food Distribution', 'Child Welfare', 'Senior Citizens', 'Animal Welfare', 'Medical Camps', 'Education', 'Events'];

  const videoItems = [
    { id: 1, category: 'Events', title: 'Deivakaram Trust Documentary 2026', duration: '5:42', thumbnail: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=400' },
    { id: 2, category: 'Medical Camps', title: 'Jawadhu Hills Medical Camp Highlight', duration: '3:15', thumbnail: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400' },
    { id: 3, category: 'Education', title: 'Scholarship Scholar Interviews', duration: '4:20', thumbnail: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=400' }
  ];

  const filteredPhotos = filterCategory === 'All' 
    ? photoItems 
    : photoItems.filter(p => p.category === filterCategory);

  const filteredVideos = filterCategory === 'All' 
    ? videoItems 
    : videoItems.filter(v => v.category === filterCategory);

  return (
    <div className="gallery-page-container" style={{ paddingTop: 'var(--header-height)' }}>
      {/* Banner */}
      <section className="gallery-hero-banner" style={{
        backgroundImage: `linear-gradient(rgba(10, 74, 156, 0.9), rgba(15, 23, 42, 0.95)), url('https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1200')`
      }}>
        <div className="container">
          <h1>Media & Gallery</h1>
          <p>Visual logs of our campaigns, medical camps, and relief distributions</p>
        </div>
      </section>

      {/* Main Grid section */}
      <section className="section">
        <div className="container">
          {/* Tab Selector */}
          <div className="gallery-tab-selector no-print">
            <button
              onClick={() => setActiveTab('photos')}
              className={`gallery-main-tab ${activeTab === 'photos' ? 'active' : ''}`}
            >
              <Camera size={18} /> Photo Gallery
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`gallery-main-tab ${activeTab === 'videos' ? 'active' : ''}`}
            >
              <Video size={18} /> Video Gallery
            </button>
          </div>

          {/* Category Filter */}
          <div className="news-filter-bar no-print" style={{ marginBottom: '40px' }}>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setFilterCategory(c)}
                className={`news-filter-btn ${filterCategory === c ? 'active' : ''}`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Photos Display */}
          {activeTab === 'photos' && (
            <div className="gallery-grid">
              {filteredPhotos.map(item => (
                <div key={item.id} className="gallery-item-card" onClick={() => setLightboxImg(item.url)}>
                  <img src={item.url} alt={item.title} className="gallery-img" />
                  <div className="gallery-item-overlay">
                    <Maximize size={24} color="#fff" />
                    <h4>{item.title}</h4>
                    <span className="gallery-badge">{item.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Videos Display */}
          {activeTab === 'videos' && (
            <div className="gallery-grid">
              {filteredVideos.map(item => (
                <div key={item.id} className="gallery-item-card video-item-card" onClick={() => alert(`Simulated Video Player Launch for "${item.title}"`)}>
                  <img src={item.thumbnail} alt={item.title} className="gallery-img" />
                  <div className="video-play-button-overlay">
                    <div className="play-triangle"></div>
                  </div>
                  <div className="gallery-item-overlay">
                    <span>Duration: {item.duration}</span>
                    <h4>{item.title}</h4>
                    <span className="gallery-badge">{item.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div className="modal-overlay" onClick={() => setLightboxImg(null)} style={{ zIndex: 1200 }}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setLightboxImg(null)} style={{ color: '#fff', top: '10px', right: '10px' }}>
              ✕
            </button>
            <img src={lightboxImg} alt="Lightbox Zoom" className="lightbox-img" />
          </div>
        </div>
      )}

      <style>{`
        .gallery-hero-banner {
          background-size: cover;
          background-position: center;
          padding: 80px 0;
          color: #fff;
          text-align: center;
        }
        .gallery-hero-banner h1 {
          font-size: 38px;
          color: #fff;
          margin-bottom: 8px;
        }
        .gallery-hero-banner p {
          font-size: 14px;
          color: var(--accent);
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        
        /* Tab Select */
        .gallery-tab-selector {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 30px;
          border-bottom: 2px solid var(--border-color);
          padding-bottom: 12px;
        }
        .gallery-main-tab {
          padding: 10px 24px;
          background: transparent;
          border: none;
          font-size: 16px;
          font-weight: 700;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: var(--transition-fast);
          position: relative;
        }
        .gallery-main-tab.active {
          color: var(--primary);
        }
        .gallery-main-tab.active::after {
          content: '';
          position: absolute;
          bottom: -14px;
          left: 0;
          right: 0;
          height: 3px;
          background-color: var(--primary);
          border-radius: var(--radius-round);
        }
        
        /* Grid Display */
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .gallery-item-card {
          height: 240px;
          border-radius: var(--radius-md);
          overflow: hidden;
          position: relative;
          cursor: pointer;
          box-shadow: var(--shadow-sm);
        }
        .gallery-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: var(--transition-smooth);
        }
        .gallery-item-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(rgba(10, 74, 156, 0.1), rgba(15, 23, 42, 0.85));
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: var(--transition-smooth);
          color: #fff;
          padding: 20px;
          text-align: center;
        }
        .gallery-item-card:hover .gallery-img {
          transform: scale(1.05);
        }
        .gallery-item-card:hover .gallery-item-overlay {
          opacity: 1;
        }
        .gallery-item-overlay h4 {
          font-size: 14px;
          color: #fff;
          margin-top: 10px;
          margin-bottom: 4px;
        }
        .gallery-badge {
          font-size: 10px;
          font-weight: 700;
          background: var(--accent);
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          text-transform: uppercase;
        }
        
        /* Video items spec */
        .video-play-button-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 50px;
          height: 50px;
          background: rgba(10, 74, 156, 0.9);
          border-radius: var(--radius-round);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-lg);
          border: 2px solid #fff;
          transition: var(--transition-fast);
        }
        .play-triangle {
          width: 0;
          height: 0;
          border-top: 8px solid transparent;
          border-bottom: 8px solid transparent;
          border-left: 14px solid #fff;
          margin-left: 4px;
        }
        .video-item-card:hover .video-play-button-overlay {
          background-color: var(--accent);
          transform: translate(-50%, -50%) scale(1.1);
        }
        
        /* Lightbox modal zoom */
        .lightbox-content {
          max-width: 90%;
          max-height: 90vh;
        }
        .lightbox-img {
          max-width: 100%;
          max-height: 80vh;
          border-radius: var(--radius-sm);
          border: 4px solid #fff;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        }
        
        @media (max-width: 768px) {
          .gallery-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .gallery-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
export default Gallery;
