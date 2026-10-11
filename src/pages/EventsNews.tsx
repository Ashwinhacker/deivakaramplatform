import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Clock, Users, Tag, Award, Check, Loader2 } from 'lucide-react';
import { getEvents, getNews, registerVolunteerForEvent, Event, NewsArticle } from '../db';

export const EventsNews: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeredEvents, setRegisteredEvents] = useState<string[]>([]);
  const [newsCategory, setNewsCategory] = useState('All');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([getEvents(), getNews()])
      .then(([evts, articles]) => {
        if (isMounted) {
          setEvents(evts);
          setNews(articles);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to load events/news:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [registeredEvents]);

  const handleRegisterEvent = async (eventId: string, eventTitle: string) => {
    const activeUser = JSON.parse(localStorage.getItem('deivakaram_active_user') || 'null');
    const volunteerName = activeUser ? activeUser.name : prompt('Please enter your full name to register:');
    
    if (!volunteerName) return;

    try {
      await registerVolunteerForEvent(eventId, volunteerName);
      setRegisteredEvents(prev => [...prev, eventId]);
      alert(`Thank you ${volunteerName}! You are successfully registered for "${eventTitle}".`);
    } catch (err) {
      console.error(err);
      alert('Could not complete registration. Please try again.');
    }
  };

  const filteredNews = newsCategory === 'All' 
    ? news 
    : news.filter(n => n.category === newsCategory);

  const categories = ['All', 'Education Support', 'Healthcare Support', 'Women Empowerment', 'General', 'Community Welfare', 'Elder Care'];

  return (
    <div className="events-news-page-container" style={{ paddingTop: 'var(--header-height)' }}>
      {/* Banner */}
      <section className="events-hero-banner" style={{
        backgroundImage: `linear-gradient(rgba(10, 74, 156, 0.9), rgba(15, 23, 42, 0.95)), url('https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=1200')`
      }}>
        <div className="container">
          <h1>Events & Press News</h1>
          <p>Community activities, campaign updates, and milestones</p>
        </div>
      </section>

      {/* Events section */}
      <section className="section">
        <div className="container">
          <div className="section-title-wrapper">
            <span className="section-subtitle">Get Involved</span>
            <h2 className="section-title">Upcoming & Past Events</h2>
            <p className="section-desc">Join us on the field. Register to participate or volunteer in our campaigns.</p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <Loader2 size={32} className="spinning" style={{ color: 'var(--primary)', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading upcoming community events...</p>
            </div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderRadius: 'var(--radius-md)' }}>
              <Calendar size={36} style={{ color: 'var(--text-light)', margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-muted)' }}>No upcoming events scheduled right now. Check back soon!</p>
            </div>
          ) : (
            <div className="grid-2" style={{ gap: '30px' }}>
              {events.map(evt => {
                const isPast = evt.status === 'completed';
                const isRegistered = registeredEvents.includes(evt.id) || (Array.isArray(evt.registrations) && evt.registrations.includes('Super Admin User'));

                return (
                  <div key={evt.id} className={`card event-card ${isPast ? 'past-event' : ''}`}>
                    <div className="event-img-frame">
                      <img src={evt.cover_image || 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&q=80&w=400'} alt={evt.title} className="event-cover-img" />
                      <span className={`event-status-badge ${isPast ? 'past' : 'upcoming'}`}>
                        {isPast ? 'Completed' : 'Upcoming'}
                      </span>
                    </div>

                    <div className="event-body-details">
                      <span className="event-date-stamp">
                        <Calendar size={13} /> {new Date(evt.event_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                      <h3>{evt.title}</h3>
                      <p className="event-desc">{evt.description}</p>
                      
                      <div className="event-meta-specs">
                        <span><MapPin size={14} /> {evt.location}</span>
                        <span><Clock size={14} /> {evt.time_str}</span>
                        {evt.volunteer_required > 0 && (
                          <span style={{ color: 'var(--primary)', fontWeight: '600' }}>
                            <Users size={14} /> Req: {evt.volunteer_required} volunteers ({(evt.registrations || []).length} joined)
                          </span>
                        )}
                      </div>

                      {!isPast && (
                        <div className="event-action-block">
                          {isRegistered ? (
                            <div className="event-joined-badge">
                              <Check size={16} /> Joined Event
                            </div>
                          ) : (
                            <button
                              onClick={() => handleRegisterEvent(evt.id, evt.title)}
                              className="btn btn-primary btn-sm"
                            >
                              Register to Volunteer
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* News section */}
      <section className="section section-secondary">
        <div className="container">
          <div className="section-title-wrapper">
            <span className="section-subtitle">Press Room</span>
            <h2 className="section-title">Latest Announcements</h2>
            <p className="section-desc">Success stories, project setups, and trust releases.</p>
          </div>

          {/* Category Filter */}
          <div className="news-filter-bar no-print">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setNewsCategory(c)}
                className={`news-filter-btn ${newsCategory === c ? 'active' : ''}`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* News list grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <Loader2 size={32} className="spinning" style={{ color: 'var(--primary)', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading trust bulletins and announcements...</p>
            </div>
          ) : filteredNews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderRadius: 'var(--radius-md)' }}>
              <p style={{ color: 'var(--text-muted)' }}>No announcements found in this category.</p>
            </div>
          ) : (
            <div className="grid-3">
              {filteredNews.map(item => (
                <div key={item.id} className="card card-hover news-grid-card">
                  <div className="news-img-frame">
                    <img src={item.image || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=400'} alt={item.title} className="news-img" />
                    <span className="news-category-badge">{item.category}</span>
                  </div>
                  <div className="news-content">
                    <div className="news-date">
                      <Calendar size={12} /> {new Date(item.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <div className="news-author">By {item.author}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <style>{`
        .events-hero-banner {
          background-size: cover;
          background-position: center;
          padding: 80px 0;
          color: #fff;
          text-align: center;
        }
        .events-hero-banner h1 {
          font-size: 38px;
          color: #fff;
          margin-bottom: 8px;
        }
        .events-hero-banner p {
          font-size: 14px;
          color: var(--accent);
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        
        /* Event Cards */
        .event-card {
          padding: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .event-card.past-event {
          opacity: 0.75;
        }
        .event-img-frame {
          height: 180px;
          position: relative;
        }
        .event-cover-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .event-status-badge {
          position: absolute;
          top: 14px;
          right: 14px;
          font-size: 10px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: var(--radius-round);
          color: #fff;
          text-transform: uppercase;
        }
        .event-status-badge.upcoming { background-color: var(--primary); }
        .event-status-badge.past { background-color: var(--text-light); }
        
        .event-body-details {
          padding: 24px;
        }
        .event-date-stamp {
          font-size: 11px;
          font-weight: 700;
          color: var(--accent);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .event-body-details h3 {
          font-size: 17px;
          color: var(--primary);
          margin-bottom: 8px;
        }
        .event-desc {
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.5;
          margin-bottom: 16px;
        }
        .event-meta-specs {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12.5px;
          color: var(--text-light);
          margin-bottom: 20px;
          padding-top: 12px;
          border-top: 1px solid var(--border-light);
        }
        .event-meta-specs span {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .event-joined-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: var(--success);
          background-color: var(--success-bg);
          padding: 6px 14px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        
        /* News Section */
        .news-filter-bar {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }
        .news-filter-btn {
          padding: 8px 16px;
          background-color: #fff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-round);
          color: var(--text-muted);
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .news-filter-btn.active, .news-filter-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
          background-color: var(--bg-primary-light);
        }
        
        .news-grid-card {
          padding: 0;
          display: flex;
          flex-direction: column;
        }
        .news-img-frame {
          position: relative;
          height: 180px;
          overflow: hidden;
        }
        .news-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .news-category-badge {
          position: absolute;
          bottom: 12px;
          left: 12px;
          background-color: var(--primary);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
        }
        .news-content {
          padding: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .news-date {
          font-size: 11px;
          color: var(--text-light);
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 6px;
        }
        .news-content h3 {
          font-size: 15px;
          color: var(--primary);
          margin-bottom: 8px;
          line-height: 1.35;
        }
        .news-content p {
          font-size: 12.5px;
          color: var(--text-muted);
          line-height: 1.5;
          margin-bottom: 12px;
        }
        .news-author {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-light);
          margin-top: auto;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
export default EventsNews;
