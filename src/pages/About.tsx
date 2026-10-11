import React, { useState } from 'react';
import { Eye, Target, Calendar } from 'lucide-react';

export const About: React.FC = () => {
  const [activeTimeline, setActiveTimeline] = useState(4); // default 2026

  const timelineData = [
    { year: 2022, title: 'Foundation & Incorporation', desc: 'Deivakaram Charitable Trust was registered with a small cohort of 5 volunteers offering food relief to Chennai street-dwellers.' },
    { year: 2023, title: 'Mobile Clinic Rollout', desc: 'Acquired our first medical diagnostic van, allowing us to screen and distribute free medications across 12 coastal slums weekly.' },
    { year: 2024, title: 'Women Tailoring Center', desc: 'Opened our first vocational skills center, training 40 widows and single mothers to achieve self-reliance with industrial sewing machines.' },
    { year: 2025, title: 'APJ Kalam Scholarships', desc: 'Launched the educational scholarship fund. Sponsored college tuition fees for 50 student scholars from backward districts.' },
    { year: 2026, title: 'Digital Enterprise Platform', desc: 'Scaled operations digitally. Built our real-time donor transparency tracker, matching 80G tax receipt issuance instantly.' }
  ];

  const values = [
    { name: 'Compassion', desc: 'Serving humanity with pure empathy, dignity and respect for all living beings.' },
    { name: 'Humanity', desc: 'Believing in the universal bond of humanity above any creed, caste, or background.' },
    { name: 'Integrity', desc: 'Upholding strict ethical standards in fundraising, allocations, and operations.' },
    { name: 'Transparency', desc: 'Sharing real-time donation metrics and publicizing audited annual accounts.' },
    { name: 'Equality', desc: 'Ensuring fair access to healthcare and education for the most marginalized.' },
    { name: 'Empowerment', desc: 'Equipping individuals with tools (education, tools) to lead self-reliant lives.' },
    { name: 'Service', desc: 'Divine worship through active, dedicated, and selfless community service.' },
    { name: 'Sustainability', desc: 'Designing community programs that create long-term impact rather than short-term relief.' }
  ];

  return (
    <div className="about-page-container" style={{ paddingTop: 'var(--header-height)' }}>
      {/* Page Hero Banner */}
      <section className="about-hero-banner" style={{
        backgroundImage: `linear-gradient(rgba(10, 74, 156, 0.9), rgba(15, 23, 42, 0.95)), url('https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&q=80&w=1200')`
      }}>
        <div className="container">
          <h1>About Deivakaram</h1>
          <p>Divine Support. Humanity. Transforming Lives.</p>
        </div>
      </section>

      {/* Intro section */}
      <section className="section">
        <div className="container grid-2 align-items-center">
          <div>
            <span className="section-subtitle">Our Story</span>
            <h2 className="section-title" style={{ textAlign: 'left', margin: '0 0 24px 0' }}>Why Deivakaram Exists</h2>
            <p className="about-p">
              The Sanskrit phrase <strong>"Deivakaram"</strong> translates to <em>"The Hand of God"</em>. We believe that when we extend our hands to help a suffering child, a hungry elder, or an aspiring student, we become instruments of divine grace.
            </p>
            <p className="about-p">
              Founded in Chennai, India, Deivakaram was born from a realization that while there are resources in society, there remains a massive bridge needed to safely, transparently, and effectively connect benevolent donors directly to genuine, verified human needs.
            </p>
            <p className="about-p">
              Today, Deivakaram supports hundreds of families daily, ensuring that every rupee contributed is accounted for, tracked, and deployed with zero wastage.
            </p>
          </div>

          <div className="about-mvg-card">
            <div className="mvg-item">
              <div className="mvg-icon"><Eye size={24} /></div>
              <div>
                <h3>Our Vision</h3>
                <p>A society where no human being is deprived of quality healthcare, basic education, or nutrition due to economic status, enabling everyone to live with dignity.</p>
              </div>
            </div>
            
            <div className="mvg-item">
              <div className="mvg-icon"><Target size={24} /></div>
              <div>
                <h3>Our Mission</h3>
                <p>To deliver direct, compassionate support to underprivileged communities through scholarships, diagnostic healthcare, nutritional support, and vocational skills programs.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="section section-secondary">
        <div className="container">
          <div className="section-title-wrapper">
            <span className="section-subtitle">Values</span>
            <h2 className="section-title">The Principles We Uphold</h2>
            <p className="section-desc">These 8 core values guide our trustees, sub-admins, and field volunteers in every action we take.</p>
          </div>

          <div className="grid-4" style={{ gap: '20px' }}>
            {values.map((v, i) => (
              <div key={i} className="card card-hover value-card">
                <div className="value-index">0{i+1}</div>
                <h3>{v.name}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Journey Timeline */}
      <section className="section">
        <div className="container">
          <div className="section-title-wrapper">
            <span className="section-subtitle">Timeline</span>
            <h2 className="section-title">Our Growth Journey</h2>
            <p className="section-desc">Click through the years to see how Deivakaram has scaled from a local feeding drive to an institutional platform.</p>
          </div>

          <div className="timeline-interactive-container">
            {/* Year selectors */}
            <div className="timeline-years-bar">
              {timelineData.map((t, idx) => (
                <button
                  key={t.year}
                  onClick={() => setActiveTimeline(idx)}
                  className={`timeline-year-btn ${activeTimeline === idx ? 'active' : ''}`}
                >
                  {t.year}
                </button>
              ))}
              <div className="timeline-progress-line" style={{
                width: `${(activeTimeline / (timelineData.length - 1)) * 100}%`
              }}></div>
            </div>

            {/* Display active card */}
            <div className="card timeline-details-card">
              <div className="timeline-card-header">
                <Calendar size={24} color="var(--accent)" />
                <span>Roadmap Milestone</span>
                <h3>{timelineData[activeTimeline].year}</h3>
              </div>
              <h4>{timelineData[activeTimeline].title}</h4>
              <p>{timelineData[activeTimeline].desc}</p>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .about-hero-banner {
          background-size: cover;
          background-position: center;
          padding: 80px 0;
          color: #fff;
          text-align: center;
        }
        .about-hero-banner h1 {
          font-size: 38px;
          color: #fff;
          margin-bottom: 8px;
        }
        .about-hero-banner p {
          font-size: 14px;
          color: var(--accent);
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .about-p {
          font-size: 15px;
          color: var(--text-muted);
          line-height: 1.7;
          margin-bottom: 16px;
        }
        
        /* MVG Card */
        .about-mvg-card {
          display: flex;
          flex-direction: column;
          gap: 24px;
          background-color: var(--bg-primary-light);
          border: 1px solid rgba(10, 74, 156, 0.1);
          border-radius: var(--radius-lg);
          padding: 40px;
          box-shadow: var(--shadow-sm);
        }
        .mvg-item {
          display: flex;
          gap: 20px;
        }
        .mvg-icon {
          width: 50px;
          height: 50px;
          background-color: var(--primary);
          color: #fff;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 10px rgba(10, 74, 156, 0.2);
        }
        .mvg-item h3 {
          font-size: 18px;
          margin-bottom: 8px;
          color: var(--primary);
        }
        .mvg-item p {
          font-size: 13.5px;
          color: var(--text-muted);
          line-height: 1.5;
        }
        
        /* Value Cards */
        .value-card {
          text-align: left;
        }
        .value-index {
          font-size: 28px;
          font-weight: 800;
          color: rgba(209, 161, 32, 0.25);
          margin-bottom: 12px;
          font-family: var(--font-heading);
        }
        .value-card h3 {
          font-size: 16px;
          color: var(--primary);
          margin-bottom: 8px;
        }
        .value-card p {
          font-size: 12.5px;
          color: var(--text-muted);
          line-height: 1.5;
        }
        
        /* Timeline */
        .timeline-interactive-container {
          max-width: 800px;
          margin: 0 auto;
        }
        .timeline-years-bar {
          display: flex;
          justify-content: space-between;
          position: relative;
          margin-bottom: 40px;
          padding: 0 10px;
        }
        .timeline-years-bar::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 3px;
          background-color: var(--border-color);
          transform: translateY(-50%);
          z-index: 1;
        }
        .timeline-progress-line {
          position: absolute;
          top: 50%;
          left: 0;
          height: 3px;
          background-color: var(--accent);
          transform: translateY(-50%);
          z-index: 2;
          transition: width 0.3s ease;
        }
        .timeline-year-btn {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-round);
          background-color: #fff;
          border: 2px solid var(--border-color);
          font-weight: 700;
          font-size: 13px;
          color: var(--text-muted);
          cursor: pointer;
          position: relative;
          z-index: 3;
          transition: var(--transition-smooth);
        }
        .timeline-year-btn.active {
          border-color: var(--accent);
          background-color: var(--accent);
          color: #fff;
          box-shadow: 0 4px 10px rgba(209, 161, 32, 0.3);
          transform: scale(1.15);
        }
        .timeline-details-card {
          animation: scaleUp 0.3s ease-out;
          border-left: 5px solid var(--accent);
        }
        .timeline-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          font-size: 12px;
          font-weight: 700;
          color: var(--text-light);
          text-transform: uppercase;
        }
        .timeline-card-header h3 {
          margin-left: auto;
          font-size: 24px;
          color: var(--primary);
        }
        .timeline-details-card h4 {
          font-size: 18px;
          margin-bottom: 12px;
        }
        .timeline-details-card p {
          font-size: 14.5px;
          color: var(--text-muted);
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
};
export default About;
