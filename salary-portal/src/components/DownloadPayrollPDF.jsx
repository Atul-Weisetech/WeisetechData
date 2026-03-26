import React from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'react-toastify';
import { FaDownload } from 'react-icons/fa';

const DownloadPayrollPDF = ({
  payrollData,
  employeeData,
  companyName = "Weisetech Developers",
  location = "Ganesh Glory 11, E-620, Gota, Ahmedabad, Gujarat 382470",
  companyPhone = "+91 79 4000 0000",
  companyEmail = "hr@weisetech.com",
  className = "",
}) => {

  const numberToWords = (num) => {
    if (num === 0) return 'Zero Only';
    const ones  = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine'];
    const teens = ['Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const tens  = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

    const convertLessThanOneThousand = (n) => {
      if (n === 0) return '';
      let result = '';
      if (n >= 100) { result += ones[Math.floor(n / 100)] + ' Hundred '; n %= 100; }
      if (n >= 20)  { result += tens[Math.floor(n / 10)] + ' '; n %= 10; }
      if (n >= 10)  { result += teens[n - 10] + ' '; return result; }
      if (n > 0)    { result += ones[n] + ' '; }
      return result;
    };

    const convertIndian = (n) => {
      let result = '';
      const crore    = Math.floor(n / 10000000);
      const lakh     = Math.floor((n % 10000000) / 100000);
      const thousand = Math.floor((n % 100000) / 1000);
      const remainder = n % 1000;
      if (crore    > 0) result += convertLessThanOneThousand(crore)    + 'Crore ';
      if (lakh     > 0) result += convertLessThanOneThousand(lakh)     + 'Lakh ';
      if (thousand > 0) result += convertLessThanOneThousand(thousand) + 'Thousand ';
      if (remainder > 0) result += convertLessThanOneThousand(remainder);
      return result.trim() + ' Only';
    };

    return convertIndian(Math.floor(num));
  };

  const parseAmount = (amount) => {
    if (amount === null || amount === undefined || amount === '') return 0;
    const num = parseFloat(amount);
    return isNaN(num) ? 0 : num;
  };

  const generatePDF = async () => {
    try {
      const element = document.createElement('div');
      element.style.position  = 'absolute';
      element.style.left      = '-9999px';
      element.style.width     = '210mm';
      element.style.padding   = '0';
      element.style.fontFamily = "'Segoe UI', Arial, sans-serif";
      element.style.color     = '#1a202c';
      element.style.backgroundColor = 'white';

      const formatDate = (dateString) => {
        try {
          return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'long', year: 'numeric',
          });
        } catch { return dateString || '—'; }
      };

      let totalEarnings = 0;
      let totalDeductions = 0;
      const earnings   = [];
      const deductions = [];

      if (payrollData.breakdown && Array.isArray(payrollData.breakdown)) {
        payrollData.breakdown.forEach((item) => {
          let amount = 0;
          if (typeof item.amount === 'number') {
            amount = item.amount;
          } else if (typeof item.amount === 'string') {
            amount = parseFloat(item.amount.replace(/[^\d.-]/g, '')) || 0;
          } else {
            amount = parseAmount(item.amount);
          }

          let isEarning = true;
          if (item.category === 2 || item.category === '2') {
            isEarning = false;
          } else if (item.category === 1 || item.category === '1') {
            isEarning = true;
          } else if (item.is_earning === 0 || item.is_earning === false || item.is_earning === '0') {
            isEarning = false;
          }

          const type = item.type || (isEarning ? 'Earning' : 'Deduction');
          if (isEarning) {
            totalEarnings += amount;
            earnings.push({ type, amount });
          } else {
            totalDeductions += amount;
            deductions.push({ type, amount });
          }
        });
      }

      const baseAmount = parseAmount(payrollData.payroll_amount || 0);
      if (baseAmount > 0) {
        earnings.unshift({ type: 'Base Salary', amount: baseAmount });
        totalEarnings += baseAmount;
      }

      const netPayable = totalEarnings - totalDeductions;

      const fmt = (n) => `&#8377;${parseFloat(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

      const earningRows = earnings.map((e) => `
        <tr>
          <td style="padding:9px 12px;border-bottom:1px solid #e2e8f0;">${e.type}</td>
          <td style="padding:9px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;">${fmt(e.amount)}</td>
        </tr>`).join('');

      const deductionRows = deductions.length > 0
        ? deductions.map((d) => `
        <tr>
          <td style="padding:9px 12px;border-bottom:1px solid #e2e8f0;">${d.type}</td>
          <td style="padding:9px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;color:#dc2626;">${fmt(d.amount)}</td>
        </tr>`).join('')
        : `<tr><td colspan="2" style="padding:9px 12px;border-bottom:1px solid #e2e8f0;color:#9ca3af;text-align:center;">No deductions</td></tr>`;

      element.innerHTML = `
<div style="padding:0;background:#fff;">

  <!-- ── Company Header ─────────────────────────────────── -->
  <div style="background:linear-gradient(135deg,#1d4ed8 0%,#2563eb 60%,#3b82f6 100%);padding:28px 32px 24px;color:#fff;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <div style="font-size:26px;font-weight:800;letter-spacing:-0.5px;margin-bottom:4px;">${companyName}</div>
          <div style="font-size:12px;opacity:0.85;margin-bottom:3px;">${location}</div>
          <div style="font-size:12px;opacity:0.85;">
            &#128222; ${companyPhone} &nbsp;&nbsp;|&nbsp;&nbsp; &#9993; ${companyEmail}
          </div>
        </td>
        <td style="text-align:right;vertical-align:top;">
          <div style="background:rgba(255,255,255,0.15);border-radius:8px;padding:10px 16px;display:inline-block;text-align:center;">
            <div style="font-size:11px;opacity:0.8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Payslip</div>
            <div style="font-size:16px;font-weight:700;">${payrollData.pay_month || '—'}</div>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- ── Employee Details ───────────────────────────────── -->
  <div style="padding:20px 32px 0;">
    <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:20px;">
      <div style="background:#eff6ff;padding:10px 16px;border-bottom:1px solid #bfdbfe;">
        <span style="font-size:11px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.5px;">Employee Information</span>
      </div>
      <div style="padding:16px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="50%" style="padding-bottom:8px;">
              <div style="font-size:11px;color:#6b7280;margin-bottom:2px;">Full Name</div>
              <div style="font-size:14px;font-weight:600;color:#111827;">${employeeData.name || '—'}</div>
            </td>
            <td width="50%" style="padding-bottom:8px;">
              <div style="font-size:11px;color:#6b7280;margin-bottom:2px;">Designation</div>
              <div style="font-size:14px;font-weight:600;color:#111827;">${employeeData.designation || '—'}</div>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:4px;">
              <div style="font-size:11px;color:#6b7280;margin-bottom:2px;">Email Address</div>
              <div style="font-size:13px;color:#374151;">${employeeData.email_address || '—'}</div>
            </td>
            <td>
              <div style="font-size:11px;color:#6b7280;margin-bottom:2px;">Pay Date</div>
              <div style="font-size:13px;color:#374151;">${formatDate(payrollData.payroll_date)}</div>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding-top:8px;border-top:1px solid #f1f5f9;">
              <div style="font-size:11px;color:#6b7280;margin-bottom:2px;">Mode of Payment</div>
              <div style="font-size:13px;color:#374151;">${payrollData.mode_of_payment || '—'}</div>
            </td>
          </tr>
        </table>
      </div>
    </div>

    <!-- ── Salary Breakdown ──────────────────────────────── -->
    <div style="margin-bottom:20px;">
      <div style="font-size:11px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Salary Breakdown</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr style="vertical-align:top;">

          <!-- Earnings -->
          <td width="50%" style="padding-right:10px;">
            <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
              <div style="background:#f0fdf4;padding:8px 12px;border-bottom:1px solid #bbf7d0;">
                <span style="font-size:11px;font-weight:700;color:#166534;text-transform:uppercase;letter-spacing:0.5px;">Earnings</span>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
                <thead>
                  <tr style="background:#f8fafc;">
                    <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;border-bottom:1px solid #e2e8f0;font-size:11px;">Component</th>
                    <th style="padding:8px 12px;text-align:right;color:#6b7280;font-weight:600;border-bottom:1px solid #e2e8f0;font-size:11px;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${earningRows}
                </tbody>
                <tfoot>
                  <tr style="background:#f0fdf4;">
                    <td style="padding:10px 12px;font-weight:700;color:#166534;font-size:13px;">Total Earnings</td>
                    <td style="padding:10px 12px;text-align:right;font-weight:700;color:#166534;font-size:13px;">${fmt(totalEarnings)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </td>

          <!-- Deductions -->
          <td width="50%" style="padding-left:10px;">
            <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
              <div style="background:#fff7f7;padding:8px 12px;border-bottom:1px solid #fecaca;">
                <span style="font-size:11px;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:0.5px;">Deductions</span>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">
                <thead>
                  <tr style="background:#f8fafc;">
                    <th style="padding:8px 12px;text-align:left;color:#6b7280;font-weight:600;border-bottom:1px solid #e2e8f0;font-size:11px;">Component</th>
                    <th style="padding:8px 12px;text-align:right;color:#6b7280;font-weight:600;border-bottom:1px solid #e2e8f0;font-size:11px;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${deductionRows}
                </tbody>
                <tfoot>
                  <tr style="background:#fff7f7;">
                    <td style="padding:10px 12px;font-weight:700;color:#991b1b;font-size:13px;">Total Deductions</td>
                    <td style="padding:10px 12px;text-align:right;font-weight:700;color:#991b1b;font-size:13px;">${fmt(totalDeductions)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- ── Net Payable ───────────────────────────────────── -->
    <div style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);color:#fff;padding:20px 24px;border-radius:10px;margin-bottom:20px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="font-size:13px;opacity:0.8;margin-bottom:4px;">Net Payable Amount</div>
            <div style="font-size:12px;opacity:0.65;">After all deductions</div>
          </td>
          <td style="text-align:right;">
            <div style="font-size:28px;font-weight:800;">${fmt(netPayable)}</div>
            <div style="font-size:11px;opacity:0.75;margin-top:3px;font-style:italic;">${numberToWords(netPayable)}</div>
          </td>
        </tr>
      </table>
    </div>
  </div>

  <!-- ── Footer ───────────────────────────────────────────── -->
  <div style="margin:0 32px 28px;border-top:2px solid #e2e8f0;padding-top:20px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr style="vertical-align:bottom;">
        <td width="40%">
          <div style="border-top:1.5px solid #374151;padding-top:6px;margin-top:40px;width:180px;">
            <div style="font-size:12px;font-weight:600;color:#374151;">Authorized Signatory</div>
            <div style="font-size:11px;color:#6b7280;margin-top:2px;">${companyName}</div>
          </div>
        </td>
        <td style="text-align:center;">
          <div style="display:inline-block;background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:8px 14px;">
            <div style="font-size:11px;color:#1d4ed8;font-weight:600;">&#9432; System Generated Report</div>
            <div style="font-size:10px;color:#6b7280;margin-top:2px;">This is a system-generated payslip and does not require a physical signature.</div>
          </div>
        </td>
        <td width="30%" style="text-align:right;">
          <div style="font-size:10px;color:#9ca3af;">
            Generated on<br/>
            ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </td>
      </tr>
    </table>
  </div>

</div>`;

      document.body.appendChild(element);

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData  = canvas.toDataURL('image/png');
      const pdf      = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      const safeName  = (employeeData.name || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
      const safeMonth = payrollData.pay_month ? payrollData.pay_month.replace(/\s+/g, '_') : 'Payroll';
      pdf.save(`Payslip_${safeName}_${safeMonth}.pdf`);

      document.body.removeChild(element);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <button
      onClick={generatePDF}
      className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors font-medium ${className}`}
    >
      <FaDownload size={13} />
      Download Payslip
    </button>
  );
};

export default DownloadPayrollPDF;
