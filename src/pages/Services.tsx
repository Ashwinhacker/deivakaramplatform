import React, { useEffect, useState } from 'react';
import { 
  Heart, UserCheck, GraduationCap, ShieldAlert, Award, Stethoscope, Utensils, 
  HeartHandshake, Cake, Video, Home as HomeIcon, Baby, PawPrint, Check, Sparkles 
} from 'lucide-react';
import { getCampaigns, Campaign } from '../db';

interface ServicesProps {
  onNavigate: (page: string) => void;
  onOpenDonate: (programId?: string) => void;
  onOpenVolunteer: () => void;
}

export const Services: React.FC<ServicesProps> = ({ onNavigate, onOpenDonate, onOpenVolunteer }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    getCampaigns().then(setCampaigns);
  }, []);

  const serviceCategories = [
    {
      id: 'srv-edu',
      title: 'Education Support',
      icon: <GraduationCap size={28} />,
      image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=600',
      description: 'Scholarships for higher education, distribution of school supplies/books, tuition fees assistance, digital classrooms, and professional career guidance.',
      objective: 'To ensure no brilliant child from marginalized families is forced to drop out of school or college due to lack of finances.',
      beneficiaries: 'Meritorious children of single parents, farm laborers, daily wage earners, and orphan youths.',
      campaignId: 'cmp-1' // Kalam Memorial Scholarship
    },
    {
      id: 'srv-health',
      title: 'Healthcare Support',
      icon: <Stethoscope size={28} />,
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600',
      description: 'Conducting weekly free medical diagnostic camps in tribal villages, distributing essential medicines, emergency surgery sponsorships, and health awareness drives.',
      objective: 'To provide free access to basic diagnostic care and life-saving medical procedures to the under-reached.',
      beneficiaries: 'Tribal communities, remote village groups, and elderly citizens without family support.',
      campaignId: 'cmp-2' // Mobile Healthcare Clinic
    },
    {
      id: 'srv-food',
      title: 'Food & Basic Needs',
      icon: <Utensils size={28} />,
      image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=600',
      description: 'Deivakaram Annadanam Project delivering hot lunches, dry grocery ration kits distribution, clothing, shelter tarpaulins, and essential hygiene kits.',
      objective: 'To eradicate hunger and malnutrition among the homeless, stranded daily laborers, and isolated elderly.',
      beneficiaries: 'Homeless shelters, daily wage clusters, slum-dwelling families, and distressed seniors.',
      campaignId: 'cmp-3' // Hunger Alleviation
    },
    {
      id: 'srv-women',
      title: 'Women Empowerment',
      icon: <Award size={28} />,
      image: 'https://images.unsplash.com/photo-1489533119213-66a5cd877091?auto=format&fit=crop&q=80&w=600',
      description: 'Vocational training courses (primarily tailoring and handicrafts), business mentorship sessions, and free sewing machine distributions to help women setup home micro-businesses.',
      objective: 'To create independent livelihood opportunities for marginalized women and mothers, lifting their families sustainably.',
      beneficiaries: 'Widows, single mothers, deserted women, and unemployed rural girls.',
      campaignId: 'cmp-4' // Tailoring Center
    },
    {
      id: 'srv-children',
      title: 'Children & Orphan Support',
      icon: <Heart size={28} />,
      image: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&q=80&w=600',
      description: 'Monthly supplies (groceries, blankets, stationery) to orphanages, nutritional milk distribution, children recreation events, and educational sponsorships.',
      objective: 'To ensure orphans and children in shelters receive warm meals, safe shelter, quality education, and emotional care.',
      beneficiaries: 'Children in registered local shelters, orphan houses, and street-rescued minors.',
      campaignId: '' // General
    },
    {
      id: 'srv-seniors',
      title: 'Senior Citizen Support',
      icon: <HeartHandshake size={28} />,
      image: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=600',
      description: 'Free healthcare, monthly grocery supply bags, essential survival needs, eldercare shelter support, and community social programs to resolve isolation.',
      objective: 'To provide secure, dignified living support and medical comfort to senior citizens neglected by families.',
      beneficiaries: 'Bedridden elders, abandoned senior citizens, and low-income old age shelters.',
      campaignId: '' // General
    },
    {
      id: 'srv-disaster',
      title: 'Emergency Relief',
      icon: <ShieldAlert size={28} />,
      image: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&q=80&w=600',
      description: 'Immediate distribution of dry food packets, blankets, clothing, tarpaulins, water filtration tablets, first-aid support during floods, fires, or lockdowns.',
      objective: 'To deliver rapid crisis response to minimize suffering and prevent post-disaster disease outbreaks.',
      beneficiaries: 'Families impacted by seasonal coastal flooding, house fires, or extreme climate crises.',
      campaignId: 'cmp-5' // Flood Relief
    }
  ];

  return (
    <div className="services-page-container" style={{ paddingTop: 'var(--header-height)' }}>
      {/* Banner */}
      <section className="services-hero-banner" style={{
        backgroundImage: `linear-gradient(rgba(10, 74, 156, 0.9), rgba(15, 23, 42, 0.95)), url('https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&q=80&w=1200')`
      }}>
        <div className="container">
          <h1>Our Programs & Services</h1>
          <p>Structured interventions to uplift and transform lives</p>
        </div>
      </section>

      {/* Services List section */}
      <section className="section">
        <div className="container">
          <div className="services-rows-list">
            {serviceCategories.map((s, idx) => {
              const campaign = campaigns.find(c => c.id === s.campaignId);
              const progressPct = campaign 
                ? Math.min(100, Math.round((campaign.raised_amount / campaign.target_amount) * 100))
                : 0;

              return (
                <div key={s.id} className={`service-row-card ${idx % 2 !== 0 ? 'row-reverse' : ''}`}>
                  {/* Left Column: Image & Icon */}
                  <div className="service-row-img-col">
                    <img src={s.image} alt={s.title} className="service-row-img" />
                    <div className="service-row-icon-badge">{s.icon}</div>
                  </div>

                  {/* Right Column: Details */}
                  <div className="service-row-details-col">
                    <h2>{s.title}</h2>
                    <p className="service-desc">{s.description}</p>
                    
                    <div className="service-meta-specs">
                      <p><strong>Primary Objective:</strong> {s.objective}</p>
                      <p><strong>Target Beneficiaries:</strong> {s.beneficiaries}</p>
                    </div>

                    {/* Integrated campaign check */}
                    {campaign && campaign.status === 'active' && (
                      <div className="service-card-campaign-box">
                        <h4>Associated Campaign: {campaign.title}</h4>
                        <div className="progress-container" style={{ margin: '8px 0' }}>
                          <div className="progress-text">
                            <span style={{ fontSize: '12px' }}>₹ {campaign.raised_amount.toLocaleString('en-IN')} Raised</span>
                            <span style={{ fontSize: '12px' }}>{progressPct}% Target reached</span>
                          </div>
                          <div className="progress-bar-bg" style={{ height: '6px' }}>
                            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }}></div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="service-row-actions">
                      <button onClick={() => onOpenDonate()} className="btn btn-primary btn-sm">
                        <Heart size={13} fill="currentColor" /> Donate to {s.title.split(' ')[0]}
                      </button>
                      <button onClick={onOpenVolunteer} className="btn btn-outline btn-sm">
                        <UserCheck size={13} /> Volunteer for this
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* DONATION PROGRAMS & SERVICE INITIATIVES PRICING SECTION */}
      <section id="donation-programs" className="section donation-programs-section" style={{ background: '#f8fafc', padding: '80px 0', borderTop: '1px solid #e2e8f0' }}>
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
                • Photo Cake - Rs. 800 • Rose Milk - 10 glasses - Rs. 150<br />
                • Grocery Kit - 1 family - Rs. 500 • Stationery Kit - Rs. 25 each
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
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#16a34a" /> Cake</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#16a34a" /> Chocolates & Juice</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#16a34a" /> Festive items such as balloons and caps</li>
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
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#16a34a" /> Food</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#16a34a" /> Cake</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#16a34a" /> Essential items for elders</li>
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
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#16a34a" /> Food</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#16a34a" /> Cake</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={16} color="#16a34a" /> Essential items for children</li>
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
            <div>
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

      <style>{`
        .services-hero-banner {
          background-size: cover;
          background-position: center;
          padding: 80px 0;
          color: #fff;
          text-align: center;
        }
        .services-hero-banner h1 {
          font-size: 38px;
          color: #fff;
          margin-bottom: 8px;
        }
        .services-hero-banner p {
          font-size: 14px;
          color: var(--accent);
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        
        /* Service Rows List */
        .services-rows-list {
          display: flex;
          flex-direction: column;
          gap: 60px;
        }
        .service-row-card {
          display: flex;
          gap: 50px;
          align-items: center;
          background-color: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 40px;
          box-shadow: var(--shadow-sm);
        }
        .service-row-card.row-reverse {
          flex-direction: row-reverse;
        }
        .service-row-img-col {
          flex: 1;
          position: relative;
          max-width: 440px;
        }
        .service-row-img {
          width: 100%;
          border-radius: var(--radius-md);
          border: 4px solid var(--bg-secondary);
          box-shadow: var(--shadow-md);
        }
        .service-row-icon-badge {
          position: absolute;
          bottom: -15px;
          right: -15px;
          width: 60px;
          height: 60px;
          background-color: var(--primary);
          color: #fff;
          border-radius: var(--radius-round);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-lg);
          border: 3px solid #fff;
        }
        
        .service-row-details-col {
          flex: 1.5;
        }
        .service-row-details-col h2 {
          font-size: 26px;
          color: var(--primary);
          margin-bottom: 12px;
        }
        .service-desc {
          font-size: 15px;
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .service-meta-specs {
          background-color: var(--bg-secondary);
          padding: 16px 20px;
          border-radius: var(--radius-md);
          font-size: 13.5px;
          color: var(--text-main);
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          border-left: 4px solid var(--accent);
        }
        .service-card-campaign-box {
          background-color: #fffdf5;
          border: 1px solid #fef3c7;
          border-radius: var(--radius-md);
          padding: 16px;
          margin-bottom: 20px;
        }
        .service-card-campaign-box h4 {
          font-size: 13.5px;
          color: var(--primary);
        }
        .service-row-actions {
          display: flex;
          gap: 14px;
        }
        
        @media (max-width: 992px) {
          .service-row-card, .service-row-card.row-reverse {
            flex-direction: column;
            padding: 24px;
            gap: 30px;
          }
          .service-row-img-col {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
export default Services;
