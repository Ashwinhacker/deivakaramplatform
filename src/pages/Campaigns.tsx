import React, { useEffect, useState } from 'react';
import { Heart, Share2, Calendar, MapPin, ArrowLeft, MessageSquare, Plus, Check } from 'lucide-react';
import { getCampaigns, updateCampaign, Campaign } from '../db';

interface CampaignsProps {
  selectedCampaignId: string | null;
  onSelectCampaign: (id: string | null) => void;
  onOpenDonate: () => void;
}

export const Campaigns: React.FC<CampaignsProps> = ({
  selectedCampaignId,
  onSelectCampaign,
  onOpenDonate
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getCampaigns().then(setCampaigns);
  }, [selectedCampaignId]);

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  const handleShare = () => {
    setCopied(true);
    navigator.clipboard.writeText(window.location.href);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="campaigns-page-container" style={{ paddingTop: 'var(--header-height)' }}>
      {/* SECTION A: ALL CAMPAIGNS GRID */}
      {!selectedCampaign ? (
        <>
          <section className="campaigns-hero-banner" style={{
            backgroundImage: `linear-gradient(rgba(10, 74, 156, 0.9), rgba(15, 23, 42, 0.95)), url('https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&q=80&w=1200')`
          }}>
            <div className="container">
              <h1>Crowdfunding Campaigns</h1>
              <p>Direct allocations, complete transparency, compounding impact</p>
            </div>
          </section>

          <section className="section">
            <div className="container">
              <div className="grid-3">
                {campaigns.map(camp => {
                  const progressPct = Math.min(100, Math.round((camp.raised_amount / camp.target_amount) * 100));
                  return (
                    <div key={camp.id} className="card card-hover campaign-grid-card">
                      <div className="camp-grid-img-frame">
                        <img src={camp.cover_image} alt={camp.title} className="camp-grid-img" />
                        <span className={`camp-grid-badge badge-${camp.status}`}>
                          {camp.status}
                        </span>
                      </div>
                      
                      <div className="camp-grid-content">
                        <h3>{camp.title}</h3>
                        <p className="camp-grid-desc">{camp.description.substring(0, 120)}...</p>

                        <div className="progress-container">
                          <div className="progress-text">
                            <span>₹ {camp.raised_amount.toLocaleString('en-IN')}</span>
                            <span>{progressPct}%</span>
                          </div>
                          <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }}></div>
                          </div>
                        </div>

                        <div className="camp-grid-footer">
                          <span>Goal: <strong>₹ {camp.target_amount.toLocaleString('en-IN')}</strong></span>
                        </div>

                        <div className="camp-grid-actions">
                          <button onClick={() => onSelectCampaign(camp.id)} className="btn btn-outline btn-sm">
                            View Campaign
                          </button>
                          <button onClick={onOpenDonate} className="btn btn-primary btn-sm" disabled={camp.status !== 'active'}>
                            Donate
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </>
      ) : (
        /* SECTION B: CAMPAIGN DETAIL PAGE */
        <section className="section">
          <div className="container">
            {/* Back Nav */}
            <button onClick={() => onSelectCampaign(null)} className="btn-back-nav no-print">
              <ArrowLeft size={16} /> Back to all campaigns
            </button>

            <div className="camp-detail-grid">
              {/* Left Column: Image, Desc, Gallery, Updates */}
              <div className="camp-detail-main">
                <img src={selectedCampaign.cover_image} alt={selectedCampaign.title} className="camp-detail-hero-img" />
                
                <h1 className="camp-detail-title">{selectedCampaign.title}</h1>
                
                <div className="camp-meta-tags no-print">
                  <span><MapPin size={14} /> {selectedCampaign.location}</span>
                  <span><Calendar size={14} /> Ends: {new Date(selectedCampaign.end_date).toLocaleDateString('en-IN')}</span>
                </div>

                <div className="camp-detail-section">
                  <h3>About this Campaign</h3>
                  <p className="camp-long-desc">{selectedCampaign.description}</p>
                </div>

                <div className="camp-detail-section">
                  <h3>Beneficiary Target Info</h3>
                  <div className="camp-info-card">
                    <p><strong>Primary Beneficiaries:</strong> {selectedCampaign.beneficiary_info}</p>
                    <p><strong>Campaign Location:</strong> {selectedCampaign.location}</p>
                  </div>
                </div>

                {/* Campaign Gallery */}
                {selectedCampaign.gallery && selectedCampaign.gallery.length > 0 && (
                  <div className="camp-detail-section">
                    <h3>Campaign Gallery</h3>
                    <div className="camp-gallery-grid">
                      {selectedCampaign.gallery.map((imgUrl, i) => (
                        <img key={i} src={imgUrl} alt="Gallery item" className="camp-gallery-thumb" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Campaign Timeline Updates */}
                <div className="camp-detail-section">
                  <h3>Updates & Success Milestones</h3>
                  {selectedCampaign.updates && selectedCampaign.updates.length > 0 ? (
                    <div className="camp-updates-timeline">
                      {selectedCampaign.updates.map(upd => (
                        <div key={upd.id} className="camp-update-item">
                          <div className="update-marker"></div>
                          <div className="update-bubble">
                            <span className="update-date">{new Date(upd.date).toLocaleDateString('en-IN')}</span>
                            <h4>{upd.title}</h4>
                            <p>{upd.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted" style={{ fontStyle: 'italic', fontSize: '13px' }}>
                      No updates published for this campaign yet. Check back soon!
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Donation card, targets widget */}
              <div className="camp-detail-sidebar no-print">
                <div className="card sticky-sidebar-card">
                  <h3>Campaign Goals</h3>
                  
                  <div className="sidebar-raised-amount">
                    <h2>₹ {selectedCampaign.raised_amount.toLocaleString('en-IN')}</h2>
                    <p>raised of ₹ {selectedCampaign.target_amount.toLocaleString('en-IN')} goal</p>
                  </div>

                  {/* Progress fill */}
                  {(() => {
                    const pct = Math.min(100, Math.round((selectedCampaign.raised_amount / selectedCampaign.target_amount) * 100));
                    return (
                      <div className="progress-container">
                        <div className="progress-bar-bg" style={{ height: '10px' }}>
                          <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '6px' }}>
                          <strong>{pct}% completed</strong>
                          <span>Target: ₹ {selectedCampaign.target_amount.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="sidebar-action-buttons">
                    <button
                      onClick={onOpenDonate}
                      className="btn btn-primary btn-block"
                      disabled={selectedCampaign.status !== 'active'}
                    >
                      <Heart size={16} fill="currentColor" /> Donate to this Cause
                    </button>
                    
                    <button onClick={handleShare} className="btn btn-outline btn-block">
                      {copied ? (
                        <>
                          <Check size={16} color="var(--success)" /> Link Copied!
                        </>
                      ) : (
                        <>
                          <Share2 size={16} /> Share Campaign
                        </>
                      )}
                    </button>
                  </div>

                  <div className="sidebar-trust-seal">
                    🛡️ Verified Campaign. Deivakaram guarantees direct beneficiary funding transfers under public audits.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <style>{`
        .campaigns-hero-banner {
          background-size: cover;
          background-position: center;
          padding: 80px 0;
          color: #fff;
          text-align: center;
        }
        .campaigns-hero-banner h1 {
          font-size: 38px;
          color: #fff;
          margin-bottom: 8px;
        }
        .campaigns-hero-banner p {
          font-size: 14px;
          color: var(--accent);
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        
        /* Grid cards styles */
        .campaign-grid-card {
          padding: 0;
          display: flex;
          flex-direction: column;
        }
        .camp-grid-img-frame {
          height: 180px;
          position: relative;
          overflow: hidden;
        }
        .camp-grid-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .camp-grid-badge {
          position: absolute;
          top: 14px;
          right: 14px;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: var(--radius-round);
          text-transform: uppercase;
          color: #fff;
        }
        .badge-active { background-color: var(--success); }
        .badge-completed { background-color: var(--primary); }
        .badge-paused { background-color: var(--warning); }
        .badge-draft { background-color: var(--text-light); }
        
        .camp-grid-content {
          padding: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .camp-grid-content h3 {
          font-size: 16px;
          line-height: 1.35;
          margin-bottom: 8px;
          height: 42px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .camp-grid-desc {
          font-size: 12.5px;
          color: var(--text-muted);
          margin-bottom: 16px;
          line-height: 1.5;
        }
        .camp-grid-footer {
          font-size: 13px;
          color: var(--text-main);
          margin-top: auto;
          margin-bottom: 12px;
        }
        .camp-grid-actions {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }
        .camp-grid-actions button {
          flex: 1;
        }
        
        /* Campaign details views */
        .btn-back-nav {
          display: flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: none;
          color: var(--primary);
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
          margin-bottom: 30px;
        }
        .btn-back-nav:hover {
          color: var(--accent);
        }
        .camp-detail-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 40px;
        }
        .camp-detail-hero-img {
          width: 100%;
          max-height: 380px;
          object-fit: cover;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
        }
        .camp-detail-title {
          font-size: 32px;
          color: var(--primary);
          margin-top: 24px;
          margin-bottom: 12px;
          line-height: 1.25;
        }
        .camp-meta-tags {
          display: flex;
          gap: 20px;
          font-size: 13px;
          color: var(--text-light);
          margin-bottom: 30px;
          font-weight: 600;
        }
        .camp-meta-tags span {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .camp-detail-section {
          margin-bottom: 36px;
        }
        .camp-detail-section h3 {
          font-size: 20px;
          color: var(--primary);
          margin-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 6px;
        }
        .camp-long-desc {
          font-size: 15px;
          color: var(--text-muted);
          line-height: 1.75;
        }
        .camp-info-card {
          background-color: var(--bg-secondary);
          padding: 16px 20px;
          border-radius: var(--radius-md);
          font-size: 14px;
          line-height: 1.6;
        }
        .camp-info-card p {
          margin-bottom: 6px;
        }
        .camp-info-card p:last-child {
          margin-bottom: 0;
        }
        .camp-gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .camp-gallery-thumb {
          width: 100%;
          height: 120px;
          object-fit: cover;
          border-radius: var(--radius-sm);
        }
        
        /* Updates timeline */
        .camp-updates-timeline {
          border-left: 2px solid var(--border-color);
          padding-left: 20px;
          position: relative;
          margin-left: 10px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .camp-update-item {
          position: relative;
        }
        .update-marker {
          width: 12px;
          height: 12px;
          background-color: var(--accent);
          border-radius: var(--radius-round);
          position: absolute;
          left: -27px;
          top: 6px;
          border: 2px solid #fff;
        }
        .update-bubble {
          background-color: var(--bg-secondary);
          padding: 16px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
        }
        .update-date {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-light);
          text-transform: uppercase;
        }
        .update-bubble h4 {
          font-size: 14px;
          color: var(--primary);
          margin-top: 4px;
          margin-bottom: 6px;
        }
        .update-bubble p {
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.5;
        }
        
        /* Sidebar layout */
        .sticky-sidebar-card {
          position: sticky;
          top: 100px;
          padding: 30px;
          box-shadow: var(--shadow-lg);
          border-color: rgba(10, 74, 156, 0.1);
        }
        .sticky-sidebar-card h3 {
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-light);
          margin-bottom: 20px;
        }
        .sidebar-raised-amount h2 {
          font-size: 32px;
          color: var(--primary);
          font-weight: 800;
        }
        .sidebar-raised-amount p {
          font-size: 13px;
          color: var(--text-light);
          margin-bottom: 16px;
        }
        .sidebar-action-buttons {
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .sidebar-action-buttons button {
          width: 100%;
        }
        .sidebar-trust-seal {
          margin-top: 20px;
          font-size: 11px;
          color: #059669;
          font-weight: 600;
          text-align: center;
          line-height: 1.4;
        }
        
        @media (max-width: 992px) {
          .camp-detail-grid {
            grid-template-columns: 1fr;
          }
          .sticky-sidebar-card {
            position: static;
          }
        }
      `}</style>
    </div>
  );
};
export default Campaigns;
