import React from 'react';
import { Download, ShieldCheck, Heart, Users, FileText, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export const Transparency: React.FC = () => {
  // Chart 1: Allocation of Funds
  const allocationData = [
    { name: 'Education Scholarships', value: 40, color: '#0A4A9C' },
    { name: 'Healthcare Camps', value: 25, color: '#3b82f6' },
    { name: 'Annadanam (Food)', value: 20, color: '#D1A120' },
    { name: 'Women Skill Centers', value: 10, color: '#10b981' },
    { name: 'Administration & Tech', value: 5, color: '#64748b' } // Proudly show only 5% overheads!
  ];

  // Chart 2: Monthly Growth 2026
  const growthData = [
    { month: 'Jan', donations: 180000, reliefAllocated: 150000 },
    { month: 'Feb', donations: 240000, reliefAllocated: 200000 },
    { month: 'Mar', donations: 310000, reliefAllocated: 280000 },
    { month: 'Apr', donations: 420000, reliefAllocated: 380000 },
    { month: 'May', donations: 560000, reliefAllocated: 510000 },
    { month: 'Jun', donations: 680000, reliefAllocated: 610000 },
    { month: 'Jul', donations: 820000, reliefAllocated: 750000 }
  ];

  const auditReports = [
    { year: 'FY 2025 - 2026', type: 'Annual Audit Report', size: '1.4 MB', file: 'DVK_Audit_2025_26.pdf' },
    { year: 'FY 2024 - 2025', type: 'Annual Audit Report', size: '1.2 MB', file: 'DVK_Audit_2024_25.pdf' },
    { year: 'FY 2023 - 2024', type: 'Annual Audit Report', size: '1.1 MB', file: 'DVK_Audit_2023_24.pdf' }
  ];

  return (
    <div className="transparency-page-container" style={{ paddingTop: 'var(--header-height)' }}>
      {/* Banner */}
      <section className="transparency-hero-banner" style={{
        backgroundImage: `linear-gradient(rgba(10, 74, 156, 0.9), rgba(15, 23, 42, 0.95)), url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1200')`
      }}>
        <div className="container">
          <h1>Financial Transparency Wall</h1>
          <p>Tracking every rupee from contribution to direct allocation</p>
        </div>
      </section>

      {/* Trust Seal */}
      <section className="section">
        <div className="container">
          <div className="card trust-intro-card">
            <div className="trust-seal-icon">
              <ShieldCheck size={48} color="var(--accent)" />
            </div>
            <div className="trust-intro-text">
              <h2>Our Promise: 100% Financial Accountability</h2>
              <p>
                At Deivakaram Charitable Trust, we honor your trust. We maintain rigorous internal control mechanisms and ensure that **only 5% of funds are utilized for administrative overheads (technology development, hosting, and office utility expenses)**. The remaining 95% goes directly to scholarship disbursements, pharmaceutical purchases, meal raw supplies, and vocational tools.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Analytics Charts */}
      <section className="section section-secondary">
        <div className="container">
          <div className="section-title-wrapper">
            <span className="section-subtitle">Visual Metrics</span>
            <h2 className="section-title">Allocation of Funds & Inflow</h2>
            <p className="section-desc">Interactive visual charts showing how your contributions are divided and allocated month-over-month.</p>
          </div>

          <div className="grid-2" style={{ gap: '40px' }}>
            {/* Chart 1: Fund Allocation */}
            <div className="card chart-card">
              <h3>Where Does Your Money Go?</h3>
              <p className="text-light" style={{ fontSize: '13px', marginBottom: '20px' }}>Breakdown of program spending based on actual audited records.</p>
              
              <div style={{ width: '100%', height: '240px' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={allocationData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value ?? 0}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Custom Legend */}
              <div className="custom-legend-grid">
                {allocationData.map((e, idx) => (
                  <div key={idx} className="legend-item">
                    <span className="legend-dot" style={{ backgroundColor: e.color }}></span>
                    <span className="legend-label">{e.name} ({e.value}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Growth Chart */}
            <div className="card chart-card">
              <h3>Fund Inflow vs. Program Outflow (INR)</h3>
              <p className="text-light" style={{ fontSize: '13px', marginBottom: '20px' }}>Monthly comparison between donations received and funds deployed on projects.</p>

              <div style={{ width: '100%', height: '240px' }}>
                <ResponsiveContainer>
                  <BarChart data={growthData}>
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip formatter={(value) => `₹ ${value ? Number(value).toLocaleString('en-IN') : 0}`} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="donations" name="Received Funds" fill="#0A4A9C" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="reliefAllocated" name="Deployed Funds" fill="#D1A120" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reports Download list */}
      <section className="section">
        <div className="container grid-2 align-items-center">
          <div>
            <span className="section-subtitle">Audit Logs & Disclosures</span>
            <h2 className="section-title" style={{ textAlign: 'left', margin: '0 0 20px 0' }}>Annual Financial Reports</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '15px' }}>
              We register our annual accounts with the Income Tax department of India and the Registrar of Trusts. You can download our verified auditor clearance certificates and balance sheets directly below.
            </p>

            <div className="reports-download-list">
              {auditReports.map((rep, idx) => (
                <div key={idx} className="report-download-item">
                  <div className="report-icon-box"><FileText size={20} /></div>
                  <div className="report-item-details">
                    <h4>{rep.year} Audit Report</h4>
                    <p>{rep.type} | PDF Document ({rep.size})</p>
                  </div>
                  <button
                    onClick={() => alert(`Simulated Download of ${rep.file}`)}
                    className="btn btn-outline btn-sm report-dl-btn"
                  >
                    <Download size={14} /> Download
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card transparency-trust-stats-card">
            <h3>Compliance & Certifications</h3>
            <ul className="compliance-list">
              <li>
                <CheckCircle size={18} color="var(--success)" />
                <div>
                  <strong>Section 80G Registration</strong>
                  <p>Donations eligible for 50% tax deductions under standard Indian IT laws.</p>
                </div>
              </li>
              <li>
                <CheckCircle size={18} color="var(--success)" />
                <div>
                  <strong>Section 12A Certification</strong>
                  <p>Certified as an authorized charitable entity in India for income tax exemptions.</p>
                </div>
              </li>
              <li>
                <CheckCircle size={18} color="var(--success)" />
                <div>
                  <strong>FCRA Ready Architecture</strong>
                  <p>Strictly compliant with Foreign Contribution Regulation Act parameters for Indian trusts.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <style>{`
        .transparency-hero-banner {
          background-size: cover;
          background-position: center;
          padding: 80px 0;
          color: #fff;
          text-align: center;
        }
        .transparency-hero-banner h1 {
          font-size: 38px;
          color: #fff;
          margin-bottom: 8px;
        }
        .transparency-hero-banner p {
          font-size: 14px;
          color: var(--accent);
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        
        /* Trust introduction card */
        .trust-intro-card {
          display: flex;
          gap: 24px;
          align-items: center;
          background-color: var(--bg-primary-light);
          border-color: rgba(10, 74, 156, 0.1);
          padding: 30px;
        }
        .trust-seal-icon {
          flex-shrink: 0;
        }
        .trust-intro-text h2 {
          font-size: 20px;
          color: var(--primary);
          margin-bottom: 8px;
        }
        .trust-intro-text p {
          font-size: 14.5px;
          color: var(--text-muted);
          line-height: 1.6;
        }
        
        /* Charts styling */
        .chart-card h3 {
          font-size: 16px;
          color: var(--primary);
          margin-bottom: 4px;
        }
        .custom-legend-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 20px;
          border-top: 1px solid var(--border-light);
          padding-top: 16px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: var(--radius-round);
        }
        .legend-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
        }
        
        /* Audit list */
        .reports-download-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .report-download-item {
          display: flex;
          align-items: center;
          background-color: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 16px;
          gap: 16px;
        }
        .report-icon-box {
          width: 44px;
          height: 44px;
          background-color: var(--bg-primary-light);
          color: var(--primary);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .report-item-details h4 {
          font-size: 14px;
          color: var(--text-main);
          margin-bottom: 2px;
        }
        .report-item-details p {
          font-size: 12px;
          color: var(--text-light);
        }
        .report-dl-btn {
          margin-left: auto;
        }
        
        /* Compliance list card */
        .transparency-trust-stats-card h3 {
          font-size: 18px;
          color: var(--primary);
          margin-bottom: 20px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 8px;
        }
        .compliance-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .compliance-list li {
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }
        .compliance-list strong {
          font-size: 14.5px;
          color: var(--text-main);
          display: block;
          margin-bottom: 2px;
        }
        .compliance-list p {
          font-size: 12px;
          color: var(--text-light);
          line-height: 1.4;
        }
        
        @media (max-width: 768px) {
          .trust-intro-card {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};
export default Transparency;
