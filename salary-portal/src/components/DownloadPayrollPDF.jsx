import React from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const DownloadPayrollPDF = ({
  payrollData,
  employeeData,
  companyName = "Weisetech Developers",
  location = "Ganesh Glory 11, E-620, Gota, Ahmedabad, Gujarat 382470",
  className = ""
}) => {
  
  // Function to convert number to words (Indian numbering system)
  const numberToWords = (num) => {
    if (num === 0) return 'Zero Only';
    
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const convertLessThanOneThousand = (n) => {
      if (n === 0) return '';
      let result = '';

      if (n >= 100) {
        result += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }

      if (n >= 20) {
        result += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      }

      if (n >= 10) {
        result += teens[n - 10] + ' ';
        return result;
      }

      if (n > 0) {
        result += ones[n] + ' ';
      }

      return result;
    };

    const convertIndian = (n) => {
      let result = '';
      let crore = Math.floor(n / 10000000);
      let lakh = Math.floor((n % 10000000) / 100000);
      let thousand = Math.floor((n % 100000) / 1000);
      let remainder = n % 1000;

      if (crore > 0) {
        result += convertLessThanOneThousand(crore) + 'Crore ';
      }

      if (lakh > 0) {
        result += convertLessThanOneThousand(lakh) + 'Lakh ';
      }

      if (thousand > 0) {
        result += convertLessThanOneThousand(thousand) + 'Thousand ';
      }

      if (remainder > 0) {
        result += convertLessThanOneThousand(remainder);
      }

      return result.trim() + ' Only';
    };

    return convertIndian(Math.floor(num));
  };

  // Helper function to safely parse amounts
  const parseAmount = (amount) => {
    if (amount === null || amount === undefined || amount === '') return 0;
    const num = parseFloat(amount);
    return isNaN(num) ? 0 : num;
  };

  const generatePDF = async () => {
    try {
      console.log('=== PDF GENERATION STARTED ===');
      console.log('Payroll data received:', payrollData);
      console.log('Employee data received:', employeeData);
      
      // Create a temporary div to hold the payslip content
      const element = document.createElement('div');
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      element.style.width = '210mm'; // A4 width
      element.style.padding = '20px';
      element.style.fontFamily = 'Arial, sans-serif';
      element.style.color = '#000';
      element.style.backgroundColor = 'white';

      // Format date
      const formatDate = (dateString) => {
        try {
          const date = new Date(dateString);
          return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        } catch {
          return dateString || '01/01/2024';
        }
      };

      let totalEarnings = 0;
      let totalDeductions = 0;
      
      const earnings = [];
      const deductions = [];
      
      console.log('Breakdown data:', payrollData.breakdown);
      console.log('Is array?', Array.isArray(payrollData.breakdown));
      
      if (payrollData.breakdown && Array.isArray(payrollData.breakdown)) {
        console.log(`Processing ${payrollData.breakdown.length} breakdown items`);
        
        payrollData.breakdown.forEach((item, index) => {
          console.log(`Item ${index}:`, JSON.stringify(item));
          
          // Safely get amount
          let amount = 0;
          if (typeof item.amount === 'number') {
            amount = item.amount;
          } else if (typeof item.amount === 'string') {
            // Remove any currency symbols and convert to number
            amount = parseFloat(item.amount.replace(/[^\d.-]/g, '')) || 0;
          } else {
            amount = parseAmount(item.amount);
          }
          
          let isEarning = false;
          if (item.category === 1 || item.category === '1') {
            isEarning = true;
          } else if (item.category === 2 || item.category === '2') {
            isEarning = false;
          } else if (item.is_earning === 1 || item.is_earning === true || item.is_earning === '1') {
            isEarning = true;
          } else if (item.is_earning === 0 || item.is_earning === false || item.is_earning === '0') {
            isEarning = false;
          } else {
            isEarning = true;
          }
          
          // Get type
          const type = item.type || (isEarning ? 'Earning' : 'Deduction');
          
          console.log(`Item ${index} processed:`, { amount, isEarning, type });
          
          if (isEarning) {
            totalEarnings += amount;
            earnings.push({
              type: type,
              amount: amount
            });
          } else {
            totalDeductions += amount;
            deductions.push({
              type: type,
              amount: amount
            });
          }
        });
      }

      const baseAmount = parseAmount(payrollData.payroll_amount || 0);
      if (baseAmount > 0) {
        earnings.unshift({ type: 'Base Salary', amount: baseAmount });
        totalEarnings += baseAmount;
      }
      
      console.log('Earnings calculated:', earnings);
      console.log('Deductions calculated:', deductions);
      console.log('Total Earnings:', totalEarnings);
      console.log('Total Deductions:', totalDeductions);
      
      const netPayable = totalEarnings - totalDeductions;
      console.log('Net Payable:', netPayable);

      element.innerHTML = `
        <div style="margin-bottom: 30px; text-align: center;">
          <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 5px; color: #2c3e50;">${companyName}</h1>
          <p style="margin: 0; color: #666; font-size: 16px;">${location}</p>
        </div>

        <h2 style="font-size: 22px; font-weight: bold; margin-bottom: 30px; text-align: center; color: #2c3e50;">
          Payslip For : ${payrollData.pay_month || 'DECEMBER 2023'}
        </h2>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #dee2e6;">
          <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 20px; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
            EMPLOYEE INFORMATION
          </h3>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <p style="margin: 8px 0;"><strong>Full Name:</strong> ${employeeData.name || 'N/A'}</p>
              <p style="margin: 8px 0;"><strong>Email Address:</strong> ${employeeData.email_address || 'N/A'}</p>
              <p style="margin: 8px 0;"><strong>Designation:</strong> ${employeeData.designation || 'N/A'}</p>
            </div>
            <div>
              <p style="margin: 8px 0;"><strong>Pay Month:</strong> ${payrollData.pay_month || 'N/A'}</p>
              <p style="margin: 8px 0;"><strong>Pay Date:</strong> ${formatDate(payrollData.payroll_date)}</p>
              <p style="margin: 8px 0;"><strong>Payment Mode:</strong> ${payrollData.mode_of_payment || 'N/A'}</p>
            </div>
          </div>
        </div>

        <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 20px; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
          SALARY BREAKDOWN
        </h3>

        <div style="display: flex; gap: 30px; margin-bottom: 30px;">
          <!-- Earnings Section -->
          <div style="flex: 1;">
            <h4 style="font-size: 16px; font-weight: bold; color: #27ae60; margin-bottom: 15px;">EARNINGS</h4>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #ecf0f1;">
                  <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Type</th>
                  <th style="padding: 12px; text-align: right; border: 1px solid #dee2e6;">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${earnings.map(earning => {
                  // Ensure amount is a number before calling toFixed
                  const amount = typeof earning.amount === 'number' ? earning.amount : parseFloat(earning.amount) || 0;
                  return `
                    <tr>
                      <td style="padding: 12px; border: 1px solid #dee2e6;">${earning.type}</td>
                      <td style="padding: 12px; text-align: right; border: 1px solid #dee2e6;">₹${amount.toFixed(2)}</td>
                    </tr>
                  `;
                }).join('')}
                <tr style="font-weight: bold; background: #f8f9fa;">
                  <td style="padding: 12px; border: 1px solid #dee2e6;">Total Earnings</td>
                  <td style="padding: 12px; text-align: right; border: 1px solid #dee2e6;">₹${totalEarnings.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Deductions Section -->
          <div style="flex: 1;">
            <h4 style="font-size: 16px; font-weight: bold; color: #c0392b; margin-bottom: 15px;">DEDUCTIONS</h4>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #ecf0f1;">
                  <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">Type</th>
                  <th style="padding: 12px; text-align: right; border: 1px solid #dee2e6;">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${deductions.map(d => {
                  const amount = typeof d.amount === 'number' ? d.amount : parseFloat(d.amount) || 0;
                  return `
                    <tr>
                      <td style="padding: 12px; border: 1px solid #dee2e6;">${d.type}</td>
                      <td style="padding: 12px; text-align: right; border: 1px solid #dee2e6;">₹${amount.toFixed(2)}</td>
                    </tr>
                  `;
                }).join('')}
                <tr style="font-weight: bold; background: #f8f9fa;">
                  <td style="padding: 12px; border: 1px solid #dee2e6;">Total Deductions</td>
                  <td style="padding: 12px; text-align: right; border: 1px solid #dee2e6;">₹${totalDeductions.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Net Pay Section -->
        <div style="background: #2c3e50; color: white; padding: 25px; border-radius: 8px; margin-bottom: 30px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h4 style="font-size: 20px; font-weight: bold; margin: 0;">NET PAYABLE AMOUNT</h4>
              <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">After all deductions</p>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 32px; font-weight: bold;">₹${netPayable.toFixed(2)}</div>
              <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">${numberToWords(netPayable)}</p>
            </div>
          </div>
        </div>

        <!-- Summary Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; background: #f8f9fa; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #3498db; color: white;">
              <th style="padding: 15px; text-align: left;">Description</th>
              <th style="padding: 15px; text-align: right;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 15px; border-bottom: 1px solid #dee2e6;">Total Earnings</td>
              <td style="padding: 15px; text-align: right; border-bottom: 1px solid #dee2e6;">₹${totalEarnings.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 15px; border-bottom: 1px solid #dee2e6;">Total Deductions</td>
              <td style="padding: 15px; text-align: right; border-bottom: 1px solid #dee2e6;">₹${totalDeductions.toFixed(2)}</td>
            </tr>
            <tr style="font-weight: bold; background: #ecf0f1;">
              <td style="padding: 15px;">Net Payable</td>
              <td style="padding: 15px; text-align: right;">₹${netPayable.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div style="border-top: 2px solid #3498db; padding-top: 20px; text-align: center; color: #666;">
          <p style="margin-bottom: 10px; font-size: 14px;">
            <strong>Note:</strong> This is a computer-generated payslip and does not require a signature.
          </p>
          <p style="margin: 0; font-size: 12px;">
            Generated on ${new Date().toLocaleDateString('en-IN', { 
              day: '2-digit', 
              month: 'long', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      `;

      document.body.appendChild(element);

      // Convert to canvas then to PDF
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Generate filename
      const safeName = (employeeData.name || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
      const safeMonth = payrollData.pay_month ? payrollData.pay_month.replace(/\s+/g, '_') : 'Payroll';
      const fileName = `Payslip_${safeName}_${safeMonth}.pdf`;
      
      // Save PDF
      pdf.save(fileName);

      // Clean up
      document.body.removeChild(element);
      
      console.log('=== PDF GENERATION COMPLETED ===');

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <button
      onClick={generatePDF}
      className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 transition-colors ${className}`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>
      Download PDF
    </button>
  );
};

export default DownloadPayrollPDF;
