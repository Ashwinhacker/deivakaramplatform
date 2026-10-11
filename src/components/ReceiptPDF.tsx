import React from 'react';
import { Download, Printer, X, ShieldCheck } from 'lucide-react';
import { Donation, Donor, Settings } from '../db';

interface ReceiptPDFProps {
  donation: Donation;
  donor: Donor;
  settings: Settings;
  onClose: () => void;
}

export const ReceiptPDF: React.FC<ReceiptPDFProps> = ({ donation, donor, settings, onClose }) => {
  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="receipt-modal-overlay">
      <div className="receipt-actions-top no-print">
        <button onClick={printReceipt} className="btn btn-primary btn-sm">
          <Printer size={16} /> Print / Save PDF
        </button>
        <button onClick={onClose} className="btn btn-outline btn-sm" style={{ borderColor: '#fff', color: '#fff' }}>
          <X size={16} /> Close
        </button>
      </div>

      <div className="receipt-container print-area">
        {/* Border Frame */}
        <div className="receipt-border-frame">
          {/* Header Row */}
          <div className="receipt-header">
            <div className="receipt-logo-sec">
              <img src="/logo.png" alt="Deivakaram Logo" className="receipt-logo" />
            </div>
            <div className="receipt-title-sec">
              <h1>DEIVAKARAM CHARITABLE TRUST</h1>
              <p className="receipt-tagline">DIVINE SUPPORT. HUMANITY. TRANSFORMING LIVES.</p>
              <p className="receipt-reg">Reg No: IV-210/2022 | PAN: AADTD0891P</p>
            </div>
          </div>

          <hr className="receipt-divider" />

          {/* Receipt Meta */}
          <div className="receipt-meta-grid">
            <div>
              <p><strong>Receipt Number:</strong> {donation.receipt_number || 'DVK-REC-PENDING'}</p>
              <p><strong>Donation ID:</strong> {donation.donation_id}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p><strong>Date:</strong> {new Date(donation.created_at).toLocaleDateString('en-IN')}</p>
              <p><strong>Time:</strong> {new Date(donation.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>

          <h2 className="receipt-doc-title">DONATION RECEIPT</h2>

          {/* Donor Details Table */}
          <div className="receipt-table-wrapper">
            <table className="receipt-table">
              <tbody>
                <tr>
                  <td width="30%"><strong>Received With Thanks From:</strong></td>
                  <td>{donation.is_anonymous ? 'Anonymous Donor' : donor.name}</td>
                </tr>
                {!donation.is_anonymous && (
                  <>
                    <tr>
                      <td><strong>Email / Mobile:</strong></td>
                      <td>{donor.email} {donor.phone ? `/ ${donor.phone}` : ''}</td>
                    </tr>
                    {donor.pan && (
                      <tr>
                        <td><strong>Donor PAN Number:</strong></td>
                        <td><span style={{ textTransform: 'uppercase' }}>{donor.pan}</span></td>
                      </tr>
                    )}
                    {donor.address && (
                      <tr>
                        <td><strong>Address:</strong></td>
                        <td>{donor.address}</td>
                      </tr>
                    )}
                  </>
                )}
                <tr>
                  <td><strong>Donation Amount:</strong></td>
                  <td>
                    <span className="receipt-amount-badge">
                      ₹ {donation.amount.toLocaleString('en-IN')}/-
                    </span>
                  </td>
                </tr>
                <tr>
                  <td><strong>Amount in words:</strong></td>
                  <td style={{ textTransform: 'capitalize', fontStyle: 'italic' }}>
                    {amountToWords(donation.amount)} Rupees Only
                  </td>
                </tr>
                <tr>
                  <td><strong>Purpose of Donation:</strong></td>
                  <td>{donation.purpose} {donation.campaign_id ? '(Specific Campaign)' : ''}</td>
                </tr>
                {donation.plan && (
                  <tr>
                    <td><strong>Chosen Contribution Plan:</strong></td>
                    <td><strong style={{ color: '#0A4A9C' }}>{donation.plan}</strong></td>
                  </tr>
                )}
                <tr>
                  <td><strong>Payment Reference:</strong></td>
                  <td>{donation.payment_method} - Transaction ID: {donation.transaction_id}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Verification stamp & signature */}
          <div className="receipt-footer-grid">
            <div className="receipt-verification-note">
              <div className="shield-icon">
                <ShieldCheck size={28} color="#0A4A9C" />
              </div>
              <div>
                <h4>Official Contribution Receipt</h4>
                <p>This is a computer-generated official receipt verifying your charitable contribution to Deivakaram Charitable Trust. Thank you for your divine support to humanity.</p>
              </div>
            </div>
            
            <div className="receipt-signature-block">
              <div className="signature-line">
                <div className="trustee-digital-seal">
                  <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 'bold', fontSize: '19px', color: '#0A4A9C', letterSpacing: '0.5px' }}>
                      K. Ramanathan
                    </span>
                    <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#16a34a', fontWeight: 700, marginTop: '2px' }}>
                      ✓ Digitally Verified
                    </span>
                  </div>
                </div>
              </div>
              <p><strong>Managing Trustee / Treasurer</strong></p>
              <p>Deivakaram Charitable Trust (Regd.)</p>
            </div>
          </div>

          <hr className="receipt-divider" />

          {/* Contact footer */}
          <div className="receipt-footer-contact">
            <p><strong>Address:</strong> {settings.orgAddress}</p>
            <p><strong>Email:</strong> {settings.orgEmail} | <strong>Phone:</strong> {settings.orgPhone}</p>
          </div>
        </div>
      </div>

      <style>{`
        .receipt-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(15, 23, 42, 0.85);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 40px 20px;
          z-index: 1100;
          overflow-y: auto;
        }
        .receipt-actions-top {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          max-width: 800px;
          width: 100%;
          justify-content: flex-end;
        }
        .receipt-container {
          background-color: #ffffff;
          padding: 30px;
          border-radius: var(--radius-md);
          max-width: 800px;
          width: 100%;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
          color: #0f172a;
        }
        .receipt-border-frame {
          border: 2px solid #0A4A9C;
          border-radius: var(--radius-sm);
          padding: 24px;
          position: relative;
        }
        .receipt-header {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .receipt-logo {
          max-height: 85px;
          object-fit: contain;
        }
        .receipt-title-sec h1 {
          font-size: 20px;
          color: #0A4A9C;
          margin-bottom: 2px;
          letter-spacing: 0.5px;
        }
        .receipt-tagline {
          font-size: 11px;
          font-weight: 700;
          color: #D1A120;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }
        .receipt-reg, .receipt-exemption {
          font-size: 11px;
          color: #64748b;
          margin: 0;
          line-height: 1.3;
        }
        .receipt-exemption {
          color: #059669;
          font-weight: 600;
        }
        .receipt-divider {
          border: 0;
          border-top: 1px solid #cbd5e1;
          margin: 16px 0;
        }
        .receipt-meta-grid {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #475569;
          margin-bottom: 20px;
        }
        .receipt-meta-grid p {
          margin-bottom: 4px;
        }
        .receipt-doc-title {
          text-align: center;
          font-size: 22px;
          color: #0A4A9C;
          letter-spacing: 1.5px;
          margin-bottom: 20px;
          border-bottom: 2px double #D1A120;
          padding-bottom: 4px;
          display: inline-block;
          left: 50%;
          transform: translateX(-50%);
          position: relative;
        }
        .receipt-table-wrapper {
          margin-bottom: 24px;
        }
        .receipt-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .receipt-table td {
          padding: 8px 12px;
          border-bottom: 1px solid #f1f5f9;
        }
        .receipt-table tr td:first-child {
          color: #475569;
        }
        .receipt-amount-badge {
          background-color: #f0f6fc;
          color: #0A4A9C;
          font-size: 16px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(10, 74, 156, 0.2);
        }
        .receipt-footer-grid {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          margin-top: 30px;
          margin-bottom: 20px;
        }
        .receipt-verification-note {
          display: flex;
          gap: 12px;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: var(--radius-md);
          padding: 14px;
          max-width: 440px;
        }
        .receipt-verification-note h4 {
          font-size: 12px;
          color: #0A4A9C;
          margin-bottom: 4px;
        }
        .receipt-verification-note p {
          font-size: 10px;
          color: #64748b;
          line-height: 1.4;
        }
        .receipt-signature-block {
          text-align: center;
          font-size: 11px;
          color: #475569;
        }
        .signature-line {
          border-bottom: 1px solid #cbd5e1;
          width: 150px;
          margin: 0 auto 6px auto;
          height: 35px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .trustee-digital-seal {
          transform: translateY(2px);
          padding: 4px 8px;
        }
        .receipt-footer-contact {
          text-align: center;
          font-size: 10px;
          color: #64748b;
          line-height: 1.5;
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
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          .receipt-modal-overlay {
            position: absolute;
            background-color: transparent;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
};

// Helper function to convert numeric amount to words
function amountToWords(amount: number): string {
  const single = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const double = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  
  function convert(n: number): string {
    if (n < 20) return single[n];
    const digit = n % 10;
    if (n < 100) return double[Math.floor(n / 10)] + (digit ? ' ' + single[digit] : '');
    if (n < 1000) return single[Math.floor(n / 100)] + ' hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
  }

  if (amount === 0) return 'zero';
  return convert(amount).trim();
}
