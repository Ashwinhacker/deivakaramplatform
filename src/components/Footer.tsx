import React from 'react';
import { Heart, MapPin, Mail, Phone, Shield } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
  onOpenDonate: () => void;
  onOpenVolunteer: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenDonate, onOpenVolunteer }) => {
  const currentYear = new Date().getFullYear();

  const handleLinkClick = (pageId: string) => {
    onNavigate(pageId);
    window.scrollTo(0, 0);
  };

  return (
    <footer className="public-footer">
      <div className="container footer-grid">
        {/* Org Summary */}
        <div className="footer-col-brand">
          <div className="footer-logo-block">
            <img src="/logo-circle.png" alt="Deivakaram Logo" className="footer-logo" />
            <div className="footer-logo-text">
              <span className="footer-brand-name">DEIVAKARAM</span>
              <span className="footer-brand-sub">CHARITABLE TRUST</span>
            </div>
          </div>
          <p className="footer-tagline">
            DIVINE SUPPORT. HUMANITY. TRANSFORMING LIVES.
          </p>
          <p className="footer-about-text">
            Together, we can create meaningful change, empower communities, and transform lives through compassion, service, and sustainable action.
          </p>
          <div className="footer-social-links">
            <a href="https://facebook.com/deivakaramtrust" target="_blank" rel="noreferrer" title="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </a>
            <a href="https://twitter.com/deivakaramtrust" target="_blank" rel="noreferrer" title="Twitter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
            </a>
            <a href="https://instagram.com/deivakaramtrust" target="_blank" rel="noreferrer" title="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" title="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-col">
          <h3>Quick Links</h3>
          <ul className="footer-links-list">
            <li><button onClick={() => handleLinkClick('home')}>Home Page</button></li>
            <li><button onClick={() => handleLinkClick('about')}>About Us</button></li>
            <li><button onClick={() => handleLinkClick('services')}>Our Programs</button></li>
            <li><button onClick={() => { onNavigate('home'); setTimeout(() => document.getElementById('donation-programs')?.scrollIntoView({ behavior: 'smooth' }), 150); }}>Donation Plans & Pricing</button></li>
            <li><button onClick={() => handleLinkClick('campaigns')}>Active Campaigns</button></li>
            <li><button onClick={() => handleLinkClick('events')}>Events & News</button></li>
            <li><button onClick={() => handleLinkClick('gallery')}>Media Gallery</button></li>
            <li><button onClick={() => handleLinkClick('transparency')}>Transparency Wall</button></li>
          </ul>
        </div>

        {/* Get Involved Links */}
        <div className="footer-col">
          <h3>Get Involved</h3>
          <ul className="footer-links-list">
            <li><button onClick={onOpenDonate} style={{ color: '#D1A120', fontWeight: '700' }}><Heart size={12} fill="currentColor" /> Donate Now</button></li>
            <li><button onClick={onOpenVolunteer}>Become a Volunteer</button></li>
            <li><button onClick={() => handleLinkClick('request_assistance')}>Request Assistance</button></li>
            <li><button onClick={() => handleLinkClick('donor_portal_login')}>Donor Login Portal</button></li>
            <li><button onClick={() => handleLinkClick('crm_login')}><Shield size={12} style={{ display: 'inline', marginRight: 4 }} /> Staff CRM Portal</button></li>
            <li><button onClick={() => handleLinkClick('contact')}>Contact Trust Office</button></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="footer-col-contact">
          <h3>Trust Office</h3>
          <ul className="footer-contact-list">
            <li>
              <MapPin size={22} className="footer-contact-icon" />
              <span>No 4/298, East Coast Road, Neelankarai, Chennai - 600115, Tamil Nadu, India.</span>
            </li>
            <li>
              <Mail size={18} className="footer-contact-icon" />
              <a href="mailto:info@deivakaram.org">info@deivakaram.org</a>
            </li>
            <li>
              <Phone size={18} className="footer-contact-icon" />
              <span>+91 44 2449 1122<br />+91 94440 12345</span>
            </li>
          </ul>
        </div>
      </div>

      <hr className="footer-divider" />

      {/* Bottom Bar */}
      <div className="container footer-bottom-bar">
        <p className="copyright-text">
          &copy; {currentYear} Deivakaram Charitable Trust. All rights reserved.
        </p>
        <div className="footer-legal-links">
          <button onClick={() => handleLinkClick('privacy_policy')}>Privacy Policy</button>
          <button onClick={() => handleLinkClick('terms_conditions')}>Terms & Conditions</button>
          <button onClick={() => handleLinkClick('donation_policy')}>Donation Policy</button>
          <span className="it-tag"><Shield size={12} /> 80G Tax Deductible NGO</span>
        </div>
      </div>

      <style>{`
        .public-footer {
          background-color: #0c1524;
          color: #94a3b8;
          padding: 80px 0 30px 0;
          font-size: 14px;
          border-top: 4px solid var(--primary);
        }
        .footer-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1.5fr;
          gap: 40px;
        }
        .footer-logo-block {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .footer-logo {
          width: 50px;
          height: 50px;
          object-fit: cover;
          background: #fff;
          padding: 2px;
          border-radius: 50%;
          border: 2px solid var(--accent);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          transition: var(--transition-smooth);
        }
        .footer-logo-block:hover .footer-logo {
          transform: scale(1.08);
          border-color: #ffd700;
        }
        .footer-brand-name {
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 18px;
          color: #ffffff;
          letter-spacing: 0.5px;
          line-height: 1.1;
        }
        .footer-brand-sub {
          font-size: 8px;
          font-weight: 700;
          color: var(--accent);
          letter-spacing: 1px;
        }
        .footer-tagline {
          font-size: 10px;
          font-weight: 700;
          color: var(--accent);
          letter-spacing: 1.5px;
          margin-bottom: 16px;
          text-transform: uppercase;
        }
        .footer-about-text {
          font-size: 13px;
          line-height: 1.6;
          margin-bottom: 24px;
          color: #64748b;
        }
        .footer-social-links {
          display: flex;
          gap: 12px;
        }
        .footer-social-links a {
          width: 36px;
          height: 36px;
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: var(--radius-round);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          transition: var(--transition-fast);
        }
        .footer-social-links a:hover {
          background-color: var(--primary);
          color: #fff;
          transform: translateY(-2px);
        }
        
        .footer-col h3, .footer-col-contact h3 {
          font-family: var(--font-heading);
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 24px;
          position: relative;
          padding-bottom: 8px;
        }
        .footer-col h3::after, .footer-col-contact h3::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 30px;
          height: 2px;
          background-color: var(--accent);
        }
        .footer-links-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .footer-links-list button {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 14px;
          cursor: pointer;
          transition: var(--transition-fast);
          text-align: left;
        }
        .footer-links-list button:hover {
          color: #ffffff;
          padding-left: 4px;
        }
        
        .footer-contact-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .footer-contact-list li {
          display: flex;
          gap: 12px;
          line-height: 1.5;
        }
        .footer-contact-icon {
          color: var(--accent);
          flex-shrink: 0;
        }
        .footer-contact-list a {
          color: #94a3b8;
        }
        .footer-contact-list a:hover {
          color: #fff;
        }
        
        .footer-divider {
          border: 0;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          margin: 40px 0 20px 0;
        }
        .footer-bottom-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: #64748b;
        }
        .footer-legal-links {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .footer-legal-links button {
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 12px;
          cursor: pointer;
          transition: var(--transition-fast);
        }
        .footer-legal-links button:hover {
          color: #fff;
        }
        .it-tag {
          color: #10b981;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        
        @media (max-width: 992px) {
          .footer-grid {
            grid-template-columns: 1.5fr 1.5fr;
            gap: 30px;
          }
        }
        @media (max-width: 576px) {
          .footer-grid {
            grid-template-columns: 1fr;
          }
          .footer-bottom-bar {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }
        }
      `}</style>
    </footer>
  );
};
export default Footer;
