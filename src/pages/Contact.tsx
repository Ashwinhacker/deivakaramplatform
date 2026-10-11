import React, { useState } from 'react';
import { MapPin, Mail, Phone, Clock, Send, CheckCircle2 } from 'lucide-react';
import { submitContactMessage } from '../db';

export const Contact: React.FC = () => {
  const [success, setSuccess] = useState(false);
  const [inquiryId, setInquiryId] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      alert('All fields marked * are required.');
      return;
    }

    try {
      const msg = await submitContactMessage({
        name,
        email,
        phone: phone || undefined,
        subject,
        message
      });
      setInquiryId(msg.inquiry_id);
      setSuccess(true);
      
      // Reset Form
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (err) {
      console.error(err);
      alert('Message submission failed.');
    }
  };

  return (
    <div className="contact-page-container" style={{ paddingTop: 'var(--header-height)' }}>
      {/* Banner */}
      <section className="contact-hero-banner" style={{
        backgroundImage: `linear-gradient(rgba(10, 74, 156, 0.9), rgba(15, 23, 42, 0.95)), url('https://images.unsplash.com/photo-1423666639041-f56000c27a9a?auto=format&fit=crop&q=80&w=1200')`
      }}>
        <div className="container">
          <h1>Contact Trust Office</h1>
          <p>Get in touch with us for partnerships, donations, or queries</p>
        </div>
      </section>

      {/* Grid section */}
      <section className="section">
        <div className="container grid-2">
          {/* Column 1: Info */}
          <div className="contact-info-column">
            <span className="section-subtitle">Reach Us</span>
            <h2 className="section-title" style={{ textAlign: 'left', margin: '0 0 30px 0' }}>Trust Headquarters</h2>
            
            <div className="contact-info-blocks">
              <div className="c-info-item">
                <MapPin size={24} className="c-info-icon" />
                <div>
                  <h4>Trust Registered Office</h4>
                  <p>No 4/298, East Coast Road, Neelankarai, Chennai - 600115, Tamil Nadu, India.</p>
                </div>
              </div>

              <div className="c-info-item">
                <Mail size={24} className="c-info-icon" />
                <div>
                  <h4>Electronic Inquiries</h4>
                  <p><a href="mailto:info@deivakaram.org">info@deivakaram.org</a></p>
                  <p><a href="mailto:donations@deivakaram.org">donations@deivakaram.org</a></p>
                </div>
              </div>

              <div className="c-info-item">
                <Phone size={24} className="c-info-icon" />
                <div>
                  <h4>Phone Support Helplines</h4>
                  <p>+91 44 2449 1122 (Landline Office)</p>
                  <p>+91 94440 12345 (Direct Trustee Hotline)</p>
                </div>
              </div>

              <div className="c-info-item">
                <Clock size={24} className="c-info-icon" />
                <div>
                  <h4>Office Timings</h4>
                  <p>Monday - Saturday: 09:30 AM - 06:00 PM</p>
                  <p>Sunday: Closed (Except for field camps)</p>
                </div>
              </div>
            </div>

            {/* Live Interactive Google Map */}
            <div className="map-embed-frame">
              <iframe 
                title="Deivakaram Charitable Trust Location"
                src="https://maps.google.com/maps?q=Neelankarai,+ECR+Road,+Chennai,+Tamil+Nadu+600115&t=&z=14&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="220"
                style={{ border: 0, borderRadius: 'var(--radius-md)', display: 'block' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          {/* Column 2: Form */}
          <div className="contact-form-column">
            <div className="card contact-form-card">
              {!success ? (
                <form onSubmit={handleSubmit}>
                  <h3>Send a Message</h3>
                  <p className="text-light" style={{ fontSize: '13px', marginBottom: '20px' }}>Our administration desk will revert to you within 24-48 business hours.</p>

                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      placeholder="Your full name"
                      className="form-control"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Email Address *</label>
                      <input
                        type="email"
                        placeholder="your.name@gmail.com"
                        className="form-control"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mobile Number</label>
                      <input
                        type="tel"
                        placeholder="+91 XXXXX XXXXX"
                        className="form-control"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Subject / Purpose *</label>
                    <input
                      type="text"
                      placeholder="e.g. CSR Partnership, Donation query"
                      className="form-control"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Detailed Message *</label>
                    <textarea
                      placeholder="Write your detailed query..."
                      className="form-control"
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-block">
                    <Send size={16} /> Send Message to Trust CRM
                  </button>
                </form>
              ) : (
                <div className="contact-success-box">
                  <CheckCircle2 size={48} color="var(--success)" />
                  <h3>Message Logged!</h3>
                  <p>
                    Your message has been successfully registered in our Secure CRM system under **Inquiry ID: {inquiryId}**.
                  </p>
                  <p className="text-light" style={{ fontSize: '12px' }}>
                    An administrator has been notified.
                  </p>
                  <button onClick={() => setSuccess(false)} className="btn btn-outline btn-sm" style={{ marginTop: '20px' }}>
                    Send another message
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .contact-hero-banner {
          background-size: cover;
          background-position: center;
          padding: 80px 0;
          color: #fff;
          text-align: center;
        }
        .contact-hero-banner h1 {
          font-size: 38px;
          color: #fff;
          margin-bottom: 8px;
        }
        .contact-hero-banner p {
          font-size: 14px;
          color: var(--accent);
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        
        /* Contact info blocks */
        .contact-info-blocks {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 30px;
        }
        .c-info-item {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        .c-info-icon {
          color: var(--accent);
          flex-shrink: 0;
          margin-top: 2px;
        }
        .c-info-item h4 {
          font-size: 15px;
          color: var(--primary);
          margin-bottom: 4px;
        }
        .c-info-item p {
          font-size: 13.5px;
          color: var(--text-muted);
          line-height: 1.4;
        }
        .c-info-item a {
          color: var(--text-muted);
        }
        .c-info-item a:hover {
          color: var(--primary);
        }
        
        /* Live Map Frame */
        .map-embed-frame {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          margin-top: 15px;
        }
        
        /* Contact Form */
        .contact-form-card {
          padding: 40px;
          border-color: rgba(10, 74, 156, 0.1);
          box-shadow: var(--shadow-lg);
        }
        .contact-form-card h3 {
          font-size: 20px;
          color: var(--primary);
          margin-bottom: 4px;
        }
        .contact-success-box {
          text-align: center;
          padding: 20px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .contact-success-box h3 {
          color: var(--success);
          margin: 0;
        }
        .contact-success-box p {
          font-size: 14px;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
};
export default Contact;
