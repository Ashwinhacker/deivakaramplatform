import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, Sparkles, Printer, Award } from 'lucide-react';
import { registerVolunteer } from '../db';

interface VolunteerModalProps {
  onClose: () => void;
}

const INTERESTS = ['Education', 'Healthcare', 'Food Distribution', 'Event Management', 'Fundraising', 'Social Media', 'Photography', 'Technology', 'Administration', 'Field Work'];
const SKILLS = ['Teaching', 'Medical Support', 'Cooking/Logistics', 'Content Writing', 'Photography/Video', 'Web/Design', 'Coordination', 'Counseling', 'First Aid'];

export const VolunteerModal: React.FC<VolunteerModalProps> = ({ onClose }) => {
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState<number>(20);
  const [location, setLocation] = useState('');
  const [occupation, setOccupation] = useState('');
  const [availability, setAvailability] = useState('Weekends');
  const [experience, setExperience] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const handleInterestChange = (item: string) => {
    if (selectedInterests.includes(item)) {
      setSelectedInterests(selectedInterests.filter(i => i !== item));
    } else {
      setSelectedInterests([...selectedInterests, item]);
    }
  };

  const handleSkillChange = (item: string) => {
    if (selectedSkills.includes(item)) {
      setSelectedSkills(selectedSkills.filter(s => s !== item));
    } else {
      setSelectedSkills([...selectedSkills, item]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInterests.length === 0) {
      alert('Please select at least one area of interest.');
      return;
    }

    try {
      const vol = await registerVolunteer({
        name,
        email,
        phone,
        age,
        location,
        occupation,
        skills: selectedSkills,
        interests: selectedInterests,
        availability,
        experience,
        emergency_contact: emergencyContact
      });
      setResult(vol);
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Database registration failed.');
    }
  };

  const handlePrintBadge = () => {
    window.print();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content volunteer-modal-content" style={{ maxWidth: success ? '500px' : '750px' }}>
        <button className="modal-close no-print" onClick={onClose}>
          <X size={20} />
        </button>

        {!success ? (
          <form onSubmit={handleSubmit} className="no-print">
            <h2 className="volunteer-modal-title">Join Us as a Volunteer</h2>
            <p className="volunteer-modal-subtitle">
              Become the hands and feet of compassion. Help us transform communities through service.
            </p>

            <div className="form-row">
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
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  placeholder="your.email@gmail.com"
                  className="form-control"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Mobile Number *</label>
                <input
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  className="form-control"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Age *</label>
                <input
                  type="number"
                  min={18}
                  className="form-control"
                  required
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">City, State *</label>
                <input
                  type="text"
                  placeholder="Chennai, Tamil Nadu"
                  className="form-control"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Occupation</label>
                <input
                  type="text"
                  placeholder="e.g. Student, IT Professional"
                  className="form-control"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Availability</label>
                <select className="form-control" value={availability} onChange={(e) => setAvailability(e.target.value)}>
                  <option value="Weekends">Weekends Only</option>
                  <option value="Weekdays">Weekdays Only</option>
                  <option value="Evenings">Evenings Only</option>
                  <option value="Flexible">Flexible / Anytime</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Emergency Contact (Name & Phone) *</label>
                <input
                  type="text"
                  placeholder="Father/Mother/Spouse contact"
                  className="form-control"
                  required
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                />
              </div>
            </div>

            {/* Selection Grid for Interests */}
            <div className="form-group">
              <label className="form-label">Areas of Interest (Select all that apply) *</label>
              <div className="checkbox-grid">
                {INTERESTS.map(item => (
                  <label key={item} className="form-check checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedInterests.includes(item)}
                      onChange={() => handleInterestChange(item)}
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Selection Grid for Skills */}
            <div className="form-group">
              <label className="form-label">Key Skills / Strengths (Select all that apply)</label>
              <div className="checkbox-grid">
                {SKILLS.map(item => (
                  <label key={item} className="form-check checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedSkills.includes(item)}
                      onChange={() => handleSkillChange(item)}
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tell us about any previous volunteering experience (Optional)</label>
              <textarea
                placeholder="Mention past NGOs or events you coordinated..."
                className="form-control"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
            </div>

            <div className="donate-modal-footer">
              <button type="submit" className="btn btn-primary btn-block">
                Submit Volunteer Application
              </button>
            </div>
          </form>
        ) : (
          /* SUCCESS ID CARD GENERATOR SCREEN */
          <div className="volunteer-success-screen">
            <div className="success-icon-wrapper no-print">
              <CheckCircle2 size={48} color="#10b981" />
            </div>
            <h2 className="no-print">Application Received!</h2>
            <p className="success-tag no-print">
              Welcome to the family. Your application is under review. Here is your temporary digital ID card:
            </p>

            {/* DIGITAL BADGE */}
            <div className="volunteer-badge print-area">
              <div className="badge-header">
                <img src="/logo.png" alt="Logo" className="badge-logo" />
                <div className="badge-org-title">DEIVAKARAM TRUST</div>
              </div>
              
              <div className="badge-body">
                <div className="badge-avatar-frame">
                  <div className="badge-avatar-placeholder">
                    <Award size={48} color="#0A4A9C" />
                  </div>
                </div>
                
                <h3 className="badge-name">{result.name}</h3>
                <p className="badge-role">OFFICIAL VOLUNTEER</p>
                
                <div className="badge-details-table">
                  <div className="badge-row">
                    <span>Volunteer ID:</span>
                    <strong>{result.volunteer_id}</strong>
                  </div>
                  <div className="badge-row">
                    <span>Primary Area:</span>
                    <span>{result.interests[0]}</span>
                  </div>
                  <div className="badge-row">
                    <span>Issued Date:</span>
                    <span>{new Date().toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="badge-footer">
                <div className="badge-bar-code">
                  |||||| |||| ||||| ||||||| |
                </div>
                <p>DIVINE SUPPORT. HUMANITY. TRANSFORMING LIVES.</p>
              </div>
            </div>

            <div className="volunteer-success-actions no-print" style={{ marginTop: '24px' }}>
              <button onClick={handlePrintBadge} className="btn btn-accent btn-sm">
                <Printer size={16} /> Print / Save ID Badge
              </button>
              <button onClick={onClose} className="btn btn-outline btn-sm">
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .volunteer-modal-title {
          font-size: 24px;
          margin-bottom: 4px;
        }
        .volunteer-modal-subtitle {
          font-size: 14px;
          color: var(--text-muted);
          margin-bottom: 24px;
        }
        .checkbox-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 8px;
        }
        .checkbox-item {
          background: #f8fafc;
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          border: 1px solid var(--border-color);
        }
        .checkbox-item:hover {
          border-color: var(--primary);
        }
        
        /* Success Badge Styles */
        .volunteer-success-screen {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .success-tag {
          font-size: 14px;
          color: var(--text-muted);
          margin-bottom: 20px;
        }
        
        /* PHYSICAL ID CARD BADGE */
        .volunteer-badge {
          width: 320px;
          border: 2px solid var(--primary);
          border-radius: var(--radius-md);
          background: #fff;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
          overflow: hidden;
          font-family: var(--font-body);
          text-align: center;
        }
        .badge-header {
          background-color: var(--primary);
          padding: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .badge-logo {
          height: 28px;
          object-fit: contain;
          filter: brightness(0) invert(1);
        }
        .badge-org-title {
          font-family: var(--font-heading);
          color: #fff;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 0.5px;
        }
        .badge-body {
          padding: 20px;
          background: linear-gradient(180deg, #fff, #f8fafc);
        }
        .badge-avatar-frame {
          width: 90px;
          height: 90px;
          border-radius: var(--radius-round);
          border: 3px solid var(--accent);
          margin: 0 auto 12px auto;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          box-shadow: var(--shadow-sm);
        }
        .badge-avatar-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .badge-name {
          font-size: 18px;
          font-weight: 700;
          color: var(--primary);
          margin-bottom: 2px;
        }
        .badge-role {
          font-size: 11px;
          font-weight: 800;
          color: var(--accent);
          letter-spacing: 1px;
          margin-bottom: 16px;
        }
        .badge-details-table {
          background: #fff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 8px 12px;
          font-size: 11px;
          text-align: left;
        }
        .badge-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          border-bottom: 1px solid var(--border-light);
        }
        .badge-row:last-child {
          border-bottom: none;
        }
        .badge-row span {
          color: var(--text-light);
        }
        .badge-row strong {
          color: var(--text-main);
        }
        
        .badge-footer {
          background-color: #0f172a;
          color: #fff;
          padding: 12px;
          font-size: 8px;
        }
        .badge-bar-code {
          font-family: 'Courier New', Courier, monospace;
          font-size: 14px;
          letter-spacing: 2px;
          color: #fff;
          margin-bottom: 4px;
        }
        
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            box-shadow: none;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
