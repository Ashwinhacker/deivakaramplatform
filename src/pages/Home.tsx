import React, { useEffect, useState } from 'react';
import { 
  Heart, Users, Calendar, Award, ArrowRight, ShieldCheck, CheckCircle, 
  Cake, Video, Home as HomeIcon, Baby, PawPrint, Sparkles, Check 
} from 'lucide-react';
import { getCampaigns, getDonations, getVolunteers, Campaign } from '../db';

interface HomeProps {
  onNavigate: (page: string) => void;
  onOpenDonate: (programId?: string) => void;
  onOpenVolunteer: () => void;
  onSelectCampaign: (id: string) => void;
}

export const Home: React.FC<HomeProps> = ({
  onNavigate,
  onOpenDonate,
  onOpenVolunteer,
  onSelectCampaign
}) => {
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    // Load Campaigns
    getCampaigns().then(cmps => {
      setActiveCampaigns(cmps.filter(c => c.status === 'active').slice(0, 3));
    });
  }, []);

  const handleCampaignClick = (id: string) => {
    onSelectCampaign(id);
    onNavigate('campaigns');
    window.scrollTo(0, 0);
  };

  return (
    <div className="home-page-container">
      {/* 1. HERO SECTION */}
      <section className="hero-section" style={{
        backgroundImage: `linear-gradient(rgba(10, 74, 156, 0.82), rgba(15, 23, 42, 0.9)), url('https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=1920')`
      }}>
        <div className="container hero-content">
          <div className="hero-logo-wrapper">
            <img src="/logo-circle.png" alt="Deivakaram Logo" className="hero-brand-logo" />
          </div>
          
          <h1 className="hero-title">DEIVAKARAM CHARITABLE TRUST</h1>
          <p className="hero-tagline">DIVINE SUPPORT. HUMANITY. TRANSFORMING LIVES.</p>
          
          <p className="hero-subtitle">
            "Together, we can create meaningful change, empower communities, and transform lives through compassion, service, and sustainable action."
          </p>

          <div className="hero-actions">
            <button onClick={() => onOpenDonate()} className="btn btn-accent btn-lg">
              <Heart size={16} fill="currentColor" /> Donate Now
            </button>
            <button onClick={() => onNavigate('services')} className="btn btn-white btn-lg">
              Our Services
            </button>
            <button onClick={onOpenVolunteer} className="btn btn-outline btn-lg" style={{ color: '#fff', borderColor: '#fff' }}>
              Volunteer With Us
            </button>
          </div>
        </div>
        
        {/* WAVE SEPARATOR */}
        <div className="hero-wave">
          <svg viewBox="0 0 1440 120" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,32L80,48C160,64,320,96,480,96C640,96,800,64,960,48C1120,32,1280,32,1360,32L1440,32L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
          </svg>
        </div>
      </section>

      {/* 2. CORE MISSION SPLIT */}
      <section className="section section-secondary">
        <div className="container grid-2 align-items-center">
          <div className="mission-text-block">
            <span className="section-subtitle">Who We Are</span>
            <h2 className="section-title" style={{ textAlign: 'left', margin: '0 0 20px 0' }}>Empowering Humanity with Divine Compassion</h2>
            <p style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>
              Deivakaram Charitable Trust was founded on the singular vision of extending divine support to humanity. We believe that serving fellow human beings in distress is the highest form of worship.
            </p>
            <p style={{ marginBottom: '24px', color: 'var(--text-muted)' }}>
              Through structured intervention in education, healthcare, nutrition, and skill development, we provide sustainable support structures that break the cycle of poverty and restore dignity to underprivileged families.
            </p>
            <div className="mission-highlights">
              <div className="m-highlight-item">
                <ShieldCheck size={20} color="var(--accent)" />
                <span>100% Transparency (Public Financial Audits)</span>
              </div>
              <div className="m-highlight-item">
                <ShieldCheck size={20} color="var(--accent)" />
                <span>Direct Impact Allocation (Low Administrative Overheads)</span>
              </div>
              <div className="m-highlight-item">
                <ShieldCheck size={20} color="var(--accent)" />
                <span>80G Income Tax Exemption Benefits for Donors</span>
              </div>
            </div>
            <button onClick={() => onNavigate('about')} className="btn btn-primary" style={{ marginTop: '24px' }}>
              Learn More About Our Journey <ArrowRight size={16} />
            </button>
          </div>
          
          <div className="mission-image-block">
            <img 
              src="https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&q=80&w=800" 
              alt="Humanitarian Care" 
              className="mission-img" 
            />
          </div>
        </div>
      </section>

      {/* 4. ACTIVE CAMPAIGNS SHOWCASE */}
      <section className="section">
        <div className="container">
          <div className="section-title-wrapper">
            <span className="section-subtitle">Urgent Causes</span>
            <h2 className="section-title">Active Campaigns</h2>
            <p className="section-desc">Join our ongoing campaigns to provide immediate relief and empowerment to those in need.</p>
          </div>

          <div className="grid-3">
            {activeCampaigns.map(camp => {
              const progressPct = Math.min(100, Math.round((camp.raised_amount / camp.target_amount) * 100));
              return (
                <div key={camp.id} className="card card-hover campaign-card">
                  <div className="camp-img-frame">
                    <img src={camp.cover_image} alt={camp.title} className="camp-cover-img" />
                    <span className="camp-status-badge">Active</span>
                  </div>
                  
                  <div className="camp-details">
                    <h3>{camp.title}</h3>
                    <p className="camp-desc-short">{camp.description.substring(0, 110)}...</p>
                    
                    <div className="progress-container">
                      <div className="progress-text">
                        <span>₹ {camp.raised_amount.toLocaleString('en-IN')} raised</span>
                        <span>{progressPct}%</span>
                      </div>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${progressPct}%` }}></div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Goal: ₹ {camp.target_amount.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="camp-card-actions">
                      <button onClick={() => handleCampaignClick(camp.id)} className="btn btn-outline btn-sm">
                        View Details
                      </button>
                      <button onClick={() => onOpenDonate()} className="btn btn-primary btn-sm">
                        Donate Now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. DONATION PROGRAMS & SERVICE INITIATIVES SECTION */}
      <section id="donation-area" className="section donation-programs-section" style={{ background: '#f8fafc', padding: '80px 0' }}>
        <div className="container">
          <div className="section-title-area text-center" style={{ marginBottom: '40px' }}>
            <span className="section-subtitle" style={{ color: 'var(--accent)', fontWeight: 700, letterSpacing: '1px' }}>
              DEIVAKARAM CHARITABLE TRUST
            </span>
            <h2 className="section-title" style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)', margin: '8px 0' }}>
              Donation Programs & Service Initiatives
            </h2>
            <p className="section-desc" style={{ maxWidth: '720px', margin: '0 auto', fontSize: '15px', color: 'var(--text-muted)' }}>
              Every contribution is a step towards compassion, dignity and hope. Celebrate your special moments by giving back.
            </p>
          </div>

          <div className="programs-showcase-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '40px' }}>
            {/* CARD 1: BIRTHDAY / ANNIVERSARY */}
            <div className="program-tier-card" style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '16px', right: '16px', background: '#dbeafe', color: '#1e40af', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px' }}>
                Most Popular
              </div>
              <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'rgba(10, 74, 156, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Cake size={24} color="#0A4A9C" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)', margin: '0 0 6px 0' }}>
                1. Birthday / Anniversary Donation
              </h3>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0A4A9C', marginBottom: '14px' }}>
                Starts from Rs. 2,500
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0', fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#16a34a" /> 25 food meals - Rs. 70 each</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#16a34a" /> 1 kg Cake - Rs. 550</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#16a34a" /> Photo Banner - Rs. 150</li>
              </ul>
              <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '10px 12px', marginBottom: '20px', fontSize: '12px', color: '#475569' }}>
                <strong style={{ color: '#b45309', display: 'block', marginBottom: '4px' }}>Optional Add-ons:</strong>
                • Photo Cake (Rs. 800) • Rose Milk 10 glasses (Rs. 150)<br />
                • Grocery Kit 1 family (Rs. 500) • Stationery Kit (Rs. 25 each)
              </div>
              <button 
                onClick={() => onOpenDonate('birthday_anniversary')}
                className="btn btn-primary btn-block"
                style={{ marginTop: 'auto', padding: '10px', fontSize: '13px', fontWeight: 700 }}
              >
                Choose Birthday / Anniversary
              </button>
            </div>

            {/* CARD 2: VIRTUAL BIRTHDAY CELEBRATION */}
            <div className="program-tier-card" style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '16px', right: '16px', background: '#fef3c7', color: '#92400e', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px' }}>
                Live Virtual Meet
              </div>
              <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'rgba(10, 74, 156, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Video size={24} color="#0A4A9C" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)', margin: '0 0 6px 0' }}>
                2. Virtual Birthday Celebration
              </h3>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0A4A9C', marginBottom: '14px' }}>
                Rs. 3,500
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0', fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#16a34a" /> 20 food meals for children</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#16a34a" /> Delicious Celebration Cake</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#16a34a" /> Chocolates & Juice</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#16a34a" /> Festive balloons and party caps</li>
              </ul>
              <p style={{ fontSize: '12px', fontStyle: 'italic', color: '#64748b', marginTop: 'auto', marginBottom: '16px', borderLeft: '2px solid #0A4A9C', paddingLeft: '8px' }}>
                "You can join a virtual meet and celebrate your special day with the children."
              </p>
              <button 
                onClick={() => onOpenDonate('virtual_birthday')}
                className="btn btn-primary btn-block"
                style={{ padding: '10px', fontSize: '13px', fontWeight: 700 }}
              >
                Choose Virtual Celebration
              </button>
            </div>

            {/* CARD 3: OLD AGE HOME DONATION */}
            <div className="program-tier-card" style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '16px', right: '16px', background: '#dcfce7', color: '#166534', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px' }}>
                Senior Care
              </div>
              <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'rgba(10, 74, 156, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <HomeIcon size={24} color="#0A4A9C" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)', margin: '0 0 6px 0' }}>
                3. Old Age Home Donation
              </h3>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0A4A9C', marginBottom: '14px' }}>
                Total: Rs. 10,000
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0', fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#16a34a" /> Wholesome feast food for all resident elders</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#16a34a" /> Special Celebration Cake</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#16a34a" /> Essential daily care items & toiletries</li>
              </ul>
              <p style={{ fontSize: '12px', fontStyle: 'italic', color: '#64748b', marginTop: 'auto', marginBottom: '16px', borderLeft: '2px solid #0A4A9C', paddingLeft: '8px' }}>
                "A meaningful way to share love, care and respect with senior citizens."
              </p>
              <button 
                onClick={() => onOpenDonate('old_age_home')}
                className="btn btn-primary btn-block"
                style={{ padding: '10px', fontSize: '13px', fontWeight: 700 }}
              >
                Donate to Old Age Home
              </button>
            </div>

            {/* CARD 4: ORPHANAGE HOME DONATION */}
            <div className="program-tier-card" style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '16px', right: '16px', background: '#f3e8ff', color: '#6b21a8', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px' }}>
                Child Welfare
              </div>
              <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'rgba(10, 74, 156, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Baby size={24} color="#0A4A9C" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)', margin: '0 0 6px 0' }}>
                4. Orphanage Home Donation
              </h3>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0A4A9C', marginBottom: '14px' }}>
                Total: Rs. 7,500
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0', fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#16a34a" /> Wholesome hot food for all children</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#16a34a" /> Special Celebration Cake</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#16a34a" /> Essential stationery & supplies for children</li>
              </ul>
              <p style={{ fontSize: '12px', fontStyle: 'italic', color: '#64748b', marginTop: 'auto', marginBottom: '16px', borderLeft: '2px solid #0A4A9C', paddingLeft: '8px' }}>
                "Make a special occasion brighter by sharing it with children in need."
              </p>
              <button 
                onClick={() => onOpenDonate('orphanage_home')}
                className="btn btn-primary btn-block"
                style={{ padding: '10px', fontSize: '13px', fontWeight: 700 }}
              >
                Donate to Orphanage Home
              </button>
            </div>

            {/* CARD 5: FEED STRAY ANIMALS */}
            <div className="program-tier-card" style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '16px', right: '16px', background: '#ffedd5', color: '#c2410c', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px' }}>
                Animal Welfare
              </div>
              <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'rgba(10, 74, 156, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <PawPrint size={24} color="#0A4A9C" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)', margin: '0 0 6px 0' }}>
                5. Feed Stray Animals
              </h3>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0A4A9C', marginBottom: '14px' }}>
                Minimum: Rs. 750 (25 Portions)
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0', fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#16a34a" /> Minimum: 25 food portions</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#16a34a" /> Rs. 30 per food portion</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#16a34a" /> Minimum contribution for 25 portions - Rs. 750</li>
              </ul>
              <p style={{ fontSize: '12px', fontStyle: 'italic', color: '#64748b', marginTop: 'auto', marginBottom: '16px', borderLeft: '2px solid #0A4A9C', paddingLeft: '8px' }}>
                "Help provide nourishment and care to animals in need."
              </p>
              <button 
                onClick={() => onOpenDonate('feed_stray_animals')}
                className="btn btn-primary btn-block"
                style={{ padding: '10px', fontSize: '13px', fontWeight: 700 }}
              >
                Feed Stray Animals
              </button>
            </div>
          </div>

          {/* JOIN US IN SPREADING KINDNESS BANNER */}
          <div className="join-kindness-banner" style={{ background: 'linear-gradient(135deg, #0A4A9C 0%, #032d64 100%)', borderRadius: '16px', padding: '32px', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ maxWidth: '650px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
                <Sparkles size={16} /> JOIN US IN SPREADING KINDNESS
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px 0', color: '#ffffff' }}>
                Celebrate your special moments by giving back.
              </h3>
              <p style={{ fontSize: '14px', margin: 0, opacity: 0.9, lineHeight: '1.5' }}>
                Your support helps Deivakaram Charitable Trust serve food, provide essentials and bring happiness to children, elders and animals. Together, let’s make every occasion meaningful.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => onOpenDonate()} 
                className="btn btn-accent btn-lg"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Heart size={16} fill="currentColor" /> Donate for Any Occasion
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION - VOLUNTEER BANNER */}
      <section className="cta-volunteer-banner" style={{
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.9), rgba(10, 74, 156, 0.85)), url('https://images.unsplash.com/photo-1559027615-cdbe687d8a4b?auto=format&fit=crop&q=80&w=1920')`
      }}>
        <div className="container cta-content">
          <span className="section-subtitle" style={{ color: 'var(--accent)' }}>Make A Difference</span>
          <h2>We Need Your Hands And Compassion</h2>
          <p>
            Our network of volunteers is the foundation of our relief drives, medical camps, and education classes. Dedicate a few hours of your weekends to bring light into someone’s life.
          </p>
          <div className="cta-actions">
            <button onClick={onOpenVolunteer} className="btn btn-accent btn-lg">
              Become A Volunteer
            </button>
            <button onClick={() => onNavigate('contact')} className="btn btn-outline btn-lg" style={{ color: '#fff', borderColor: '#fff' }}>
              Locate Our Centers
            </button>
          </div>
        </div>
      </section>

      <style>{`
        /* Hero Section */
        .hero-section {
          padding-top: calc(var(--header-height) + 60px);
          padding-bottom: 120px;
          background-size: cover;
          background-position: center;
          color: #ffffff;
          text-align: center;
          position: relative;
        }
        .hero-content {
          max-width: 900px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .hero-logo-wrapper {
          background-color: #ffffff;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          padding: 6px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3.5px solid var(--accent);
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.35), 0 0 0 3px rgba(255, 255, 255, 0.3);
          transition: var(--transition-smooth);
          overflow: hidden;
        }
        .hero-logo-wrapper:hover {
          transform: scale(1.08);
          box-shadow: 0 16px 44px rgba(209, 161, 32, 0.5), 0 0 0 4px rgba(255, 255, 255, 0.5);
        }
        .hero-brand-logo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }
        .hero-title {
          font-family: var(--font-heading);
          font-size: 42px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 6px;
          letter-spacing: 0.5px;
        }
        .hero-tagline {
          font-size: 13px;
          font-weight: 700;
          color: var(--accent);
          letter-spacing: 2px;
          margin-bottom: 24px;
        }
        .hero-subtitle {
          font-size: 18px;
          font-weight: 400;
          line-height: 1.6;
          color: #e2e8f0;
          margin-bottom: 40px;
          font-style: italic;
        }
        .hero-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
          position: relative;
          z-index: 5;
        }
        .hero-wave {
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          line-height: 0;
          pointer-events: none;
        }
        
        /* Who We Are Split */
        .align-items-center {
          align-items: center;
        }
        .mission-highlights {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 12px;
        }
        .m-highlight-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-main);
        }
        .mission-img {
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          border: 4px solid #fff;
        }
        
        /* Campaign Card styles */
        .campaign-card {
          padding: 0;
        }
        .camp-img-frame {
          position: relative;
          height: 200px;
          overflow: hidden;
        }
        .camp-cover-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .camp-status-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          background-color: var(--success);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: var(--radius-round);
          text-transform: uppercase;
        }
        .camp-details {
          padding: 24px;
        }
        .camp-details h3 {
          font-size: 17px;
          color: var(--primary);
          margin-bottom: 10px;
          line-height: 1.3;
          height: 44px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .camp-desc-short {
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 16px;
          line-height: 1.5;
        }
        .camp-card-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 16px;
        }
        
        /* CTA Banner */
        .cta-volunteer-banner {
          background-size: cover;
          background-position: center;
          padding: 100px 0;
          color: #fff;
          text-align: center;
        }
        .cta-content {
          max-width: 750px;
        }
        .cta-content h2 {
          font-size: 36px;
          color: #fff;
          margin-bottom: 16px;
        }
        .cta-content p {
          font-size: 16px;
          color: #cbd5e1;
          margin-bottom: 32px;
          line-height: 1.7;
        }
        .cta-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        @media (max-width: 768px) {
          .hero-title { font-size: 32px; }
          .hero-subtitle { font-size: 15px; }
          .cta-content h2 { font-size: 26px; }
        }
        @media (max-width: 640px) {
          .hero-section {
            padding-top: 100px;
            padding-bottom: 70px;
          }
          .hero-brand-logo {
            width: 70px;
            height: 70px;
          }
          .hero-logo-wrapper {
            width: 76px;
            height: 76px;
            margin-bottom: 16px;
          }
          .hero-title {
            font-size: 24px;
            line-height: 1.25;
            margin-bottom: 8px;
          }
          .hero-tagline {
            font-size: 11px;
            letter-spacing: 1px;
            margin-bottom: 16px;
          }
          .hero-subtitle {
            font-size: 14px;
            line-height: 1.5;
            margin-bottom: 24px;
          }
          .hero-actions {
            flex-direction: column;
            gap: 10px;
            width: 100%;
          }
          .hero-actions button {
            width: 100%;
            justify-content: center;
          }
          .programs-showcase-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .program-tier-card {
            padding: 20px 16px !important;
          }
          .cta-volunteer-banner {
            padding: 60px 0;
          }
          .cta-actions {
            flex-direction: column;
            width: 100%;
          }
          .cta-actions button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
export default Home;
