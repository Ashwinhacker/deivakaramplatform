import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, FileText, Send, ArrowRight } from 'lucide-react';
import { submitBeneficiaryCase } from '../db';

export const AssistanceRequest: React.FC = () => {
  const [success, setSuccess] = useState(false);
  const [caseId, setCaseId] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState<'Medical' | 'Education' | 'Food' | 'Child Welfare' | 'Senior Citizen' | 'Women Support' | 'Emergency' | 'Other'>('Medical');
  const [description, setDescription] = useState('');
  const [familyInfo, setFamilyInfo] = useState('');
  const [incomeInfo, setIncomeInfo] = useState('');
  const [requiredAssistance, setRequiredAssistance] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !address || !description || !requiredAssistance) {
      alert('All fields marked * are required.');
      return;
    }

    try {
      const result = await submitBeneficiaryCase({
        name,
        phone,
        email: email || undefined,
        address,
        category,
        description,
        family_info: familyInfo,
        income_info: incomeInfo,
        required_assistance: requiredAssistance,
        priority,
        supporting_docs: ['identity_proof.pdf', 'income_certificate.pdf'] // simulated file uploads
      });

      setCaseId(result.case_id);
      setSuccess(true);

      // Reset
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setDescription('');
      setFamilyInfo('');
      setIncomeInfo('');
      setRequiredAssistance('');
    } catch (err) {
      console.error(err);
      alert('Failed to submit request.');
    }
  };

  return (
    <div className="assistance-page-container" style={{ paddingTop: 'var(--header-height)' }}>
      {/* Banner */}
      <section className="assistance-hero-banner" style={{
        backgroundImage: `linear-gradient(rgba(10, 74, 156, 0.9), rgba(15, 23, 42, 0.95)), url('https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&q=80&w=1200')`
      }}>
        <div className="container">
          <h1>Request Trust Support</h1>
          <p>Submit a beneficiary case application for verification and assistance</p>
        </div>
      </section>

      {/* Form Intake */}
      <section className="section">
        <div className="container grid-2" style={{ gridTemplateColumns: '1.2fr 2fr', gap: '40px' }}>
          {/* Instructions Column */}
          <div className="instructions-column">
            <div className="card instructions-card">
              <ShieldAlert size={28} color="var(--accent)" style={{ marginBottom: '16px' }} />
              <h3>Application Guidelines</h3>
              <p className="text-light" style={{ fontSize: '13px', lineHeight: '1.5', marginBottom: '20px' }}>
                Deivakaram maintains a rigorous verification system to ensure allocations reach genuine distress. Please note:
              </p>
              
              <ul className="guide-points">
                <li>
                  <strong>Verification Call:</strong> Our local field volunteer will visit the applicant address within 3-5 days.
                </li>
                <li>
                  <strong>Documents Required:</strong> Income certificate, Aadhaar copy, and specific case receipts (hospital quotes, school fee card) must be presented during visit.
                </li>
                <li>
                  <strong>Case ID:</strong> Keep note of the generated Case ID to check updates.
                </li>
              </ul>
            </div>

            <div className="emergency-note-box">
              <h4>🚨 Emergency Medical Case?</h4>
              <p>For critical care surgery or acute hospital accidents, call our ECR trust office directly on <strong>+91 94440 12345</strong> for immediate approval.</p>
            </div>
          </div>

          {/* Form Column */}
          <div className="form-column">
            <div className="card assistance-form-card">
              {!success ? (
                <form onSubmit={handleSubmit}>
                  <h3>Assistance Case Intake Form</h3>
                  <p className="text-muted" style={{ fontSize: '12.5px', marginBottom: '24px' }}>Fill all particulars as accurately as possible. Fields with * are mandatory.</p>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Applicant Full Name *</label>
                      <input
                        type="text"
                        placeholder="Enter full name"
                        className="form-control"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Contact Mobile Number *</label>
                      <input
                        type="tel"
                        placeholder="+91 XXXXX XXXXX"
                        className="form-control"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Email Address (Optional)</label>
                      <input
                        type="email"
                        placeholder="your.name@gmail.com"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Support Category *</label>
                      <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value as any)}>
                        <option value="Medical">Medical Care / Hospital Bill</option>
                        <option value="Education">Education Tuition / Scholarships</option>
                        <option value="Food">Food / Nutritional Groceries</option>
                        <option value="Child Welfare">Children & Orphan Shelter support</option>
                        <option value="Senior Citizen">Senior Citizen Essential aids</option>
                        <option value="Women Support">Women Vocational / Self Livelihood</option>
                        <option value="Emergency">Emergency Flood / Fire relief</option>
                        <option value="Other">Other Particular support</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Full Residential Address *</label>
                    <input
                      type="text"
                      placeholder="Applicant full address"
                      className="form-control"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Family Information (Dependents count, status) *</label>
                      <input
                        type="text"
                        placeholder="e.g. 3 children, mother is bedridden widow"
                        className="form-control"
                        required
                        value={familyInfo}
                        onChange={(e) => setFamilyInfo(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Income Information (Source & annual earnings) *</label>
                      <input
                        type="text"
                        placeholder="e.g. Daily wage laborer - ₹55,000/year"
                        className="form-control"
                        required
                        value={incomeInfo}
                        onChange={(e) => setIncomeInfo(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Specific Assistance Required *</label>
                      <input
                        type="text"
                        placeholder="e.g. College fees support of ₹20,000"
                        className="form-control"
                        required
                        value={requiredAssistance}
                        onChange={(e) => setRequiredAssistance(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Distress Priority Level</label>
                      <select className="form-control" value={priority} onChange={(e) => setPriority(e.target.value as any)}>
                        <option value="Low">Low (No urgency)</option>
                        <option value="Medium">Medium (Within 1 month)</option>
                        <option value="High">High (Immediate action needed)</option>
                        <option value="Critical">Critical (Life-threatening emergency)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Describe the case details in full *</label>
                    <textarea
                      placeholder="Explain the background and why applicant is requesting support..."
                      className="form-control"
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-block">
                    <Send size={16} /> Submit Support Request
                  </button>
                </form>
              ) : (
                <div className="assistance-success-box">
                  <CheckCircle2 size={54} color="var(--success)" />
                  <h3>Case Logged Successfully</h3>
                  <p className="success-tag">
                    Your request has been saved in Deivakaram Case Directory.
                  </p>
                  
                  <div className="case-id-display">
                    <span>Your Case ID:</span>
                    <strong>{caseId}</strong>
                  </div>

                  <p className="text-light" style={{ fontSize: '12px', marginTop: '16px' }}>
                    Please note down this Case ID. An administrator will call you shortly on the provided mobile number to schedule the field verification.
                  </p>

                  <button onClick={() => setSuccess(false)} className="btn btn-outline btn-sm" style={{ marginTop: '20px' }}>
                    Submit another request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .assistance-hero-banner {
          background-size: cover;
          background-position: center;
          padding: 80px 0;
          color: #fff;
          text-align: center;
        }
        .assistance-hero-banner h1 {
          font-size: 38px;
          color: #fff;
          margin-bottom: 8px;
        }
        .assistance-hero-banner p {
          font-size: 14px;
          color: var(--accent);
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        
        /* Guidelines list */
        .instructions-card h3 {
          font-size: 16px;
          color: var(--primary);
          margin-bottom: 12px;
        }
        .guide-points {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 16px;
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.5;
        }
        .guide-points li {
          position: relative;
          padding-left: 16px;
        }
        .guide-points li::before {
          content: '•';
          color: var(--accent);
          font-size: 20px;
          position: absolute;
          left: 0;
          top: -4px;
        }
        .emergency-note-box {
          margin-top: 24px;
          background-color: var(--danger-bg);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: var(--danger);
          padding: 16px;
          border-radius: var(--radius-md);
          font-size: 12.5px;
        }
        .emergency-note-box h4 {
          margin-bottom: 4px;
          font-weight: 700;
        }
        
        /* Form Card */
        .assistance-form-card {
          padding: 40px;
          border-color: rgba(10, 74, 156, 0.1);
          box-shadow: var(--shadow-lg);
        }
        .assistance-form-card h3 {
          font-size: 20px;
          color: var(--primary);
          margin-bottom: 4px;
        }
        
        /* Success output box */
        .assistance-success-box {
          text-align: center;
          padding: 20px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .assistance-success-box h3 {
          color: var(--success);
          margin: 0;
        }
        .case-id-display {
          background-color: var(--bg-primary-light);
          padding: 12px 24px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(10, 74, 156, 0.2);
          display: flex;
          gap: 12px;
          font-size: 15px;
          align-items: center;
          margin-top: 10px;
        }
        .case-id-display strong {
          color: var(--primary);
          font-family: monospace;
          font-size: 18px;
        }
      `}</style>
    </div>
  );
};
export default AssistanceRequest;
