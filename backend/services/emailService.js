const nodemailer = require("nodemailer");

/**
 * SMTP Email Service
 *
 * Configure via .env:
 *   SMTP_HOST=smtp.gmail.com          (or your SMTP provider)
 *   SMTP_PORT=587
 *   SMTP_SECURE=false                 (true for port 465)
 *   SMTP_USER=your@email.com
 *   SMTP_PASS=your_app_password
 *   SMTP_FROM_NAME=Weisetech HR Portal
 *
 * Falls back to EMAIL_USER / EMAIL_PASS (Gmail service shorthand) if SMTP_HOST is not set.
 */

function createTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback: Gmail service shorthand
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * Builds the branded HTML email body for payroll notification.
 *
 * @param {object} p
 * @param {string} p.employeeName  - Full name of the employee
 * @param {string} p.payMonth      - e.g. "March 2025"
 * @param {number} p.amount        - Payroll amount (gross)
 * @param {string} p.payDate       - Payroll date string
 * @param {string} p.modeOfPayment - e.g. "Bank Transfer"
 * @param {string} [p.designation] - Employee designation (optional)
 */
function buildPayrollEmailHtml({ employeeName, payMonth, amount, payDate, modeOfPayment, designation }) {
  const formattedAmount = `₹${parseFloat(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const formattedDate = payDate
    ? new Date(payDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "—";

  const designationRow = designation
    ? `<tr>
        <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;color:#6b7280;font-size:13px;width:40%;">Designation</td>
        <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;color:#111827;font-size:13px;font-weight:600;">${designation}</td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Payroll Generated – ${payMonth}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- ── Header ── -->
          <tr>
            <td style="background:linear-gradient(135deg,#1d4ed8 0%,#2563eb 60%,#3b82f6 100%);padding:32px 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                      Weisetech HR Portal
                    </p>
                    <p style="margin:4px 0 0;font-size:13px;color:#bfdbfe;">
                      Payroll Notification
                    </p>
                  </td>
                  <td align="right">
                    <div style="width:48px;height:48px;background:rgba(255,255,255,0.15);border-radius:50%;display:inline-block;text-align:center;line-height:48px;font-size:22px;">
                      💼
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Success Badge ── -->
          <tr>
            <td style="background:#f0fdf4;padding:16px 40px;border-bottom:1px solid #dcfce7;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:10px;">
                    <div style="width:32px;height:32px;background:#22c55e;border-radius:50%;text-align:center;line-height:32px;font-size:16px;color:#fff;">✓</div>
                  </td>
                  <td>
                    <p style="margin:0;font-size:14px;font-weight:600;color:#166534;">
                      Payroll Generated Successfully
                    </p>
                    <p style="margin:2px 0 0;font-size:12px;color:#4ade80;">
                      Your salary for <strong>${payMonth}</strong> has been processed.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td style="padding:32px 40px 24px;">
              <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#111827;">
                Hello, ${employeeName}!
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
                We are pleased to inform you that your payroll for <strong style="color:#2563eb;">${payMonth}</strong> has been
                generated and published. Please review the details below.
              </p>

              <!-- Payroll Detail Card -->
              <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:24px;">

                <!-- Card Header -->
                <div style="background:#eff6ff;padding:12px 16px;border-bottom:1px solid #bfdbfe;">
                  <p style="margin:0;font-size:13px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.5px;">
                    Payroll Details
                  </p>
                </div>

                <!-- Card Body – Table -->
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${designationRow}
                  <tr>
                    <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;color:#6b7280;font-size:13px;width:40%;">Pay Period</td>
                    <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;color:#111827;font-size:13px;font-weight:600;">${payMonth}</td>
                  </tr>
                  <tr style="background:#fafafa;">
                    <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;color:#6b7280;font-size:13px;">Payroll Date</td>
                    <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;color:#111827;font-size:13px;font-weight:600;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;color:#6b7280;font-size:13px;">Mode of Payment</td>
                    <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;color:#111827;font-size:13px;font-weight:600;">${modeOfPayment || "—"}</td>
                  </tr>
                  <tr style="background:#eff6ff;">
                    <td style="padding:14px 16px;color:#1d4ed8;font-size:14px;font-weight:700;">Net Salary</td>
                    <td style="padding:14px 16px;color:#1d4ed8;font-size:18px;font-weight:800;">${formattedAmount}</td>
                  </tr>
                </table>
              </div>

              <!-- Info Note -->
              <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
                <p style="margin:0;font-size:12px;color:#92400e;line-height:1.6;">
                  <strong>Note:</strong> This is an auto-generated notification. For any discrepancies or queries regarding your payroll,
                  please contact the HR department.
                </p>
              </div>

              <p style="margin:0;font-size:14px;color:#374151;">
                Best regards,<br/>
                <strong style="color:#1d4ed8;">Weisetech HR Team</strong>
              </p>
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="background:#1e293b;padding:20px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:13px;color:#94a3b8;">
                © ${new Date().getFullYear()} Weisetech Developers. All rights reserved.
              </p>
              <p style="margin:0;font-size:11px;color:#64748b;">
                This email was sent from the Weisetech HR Portal. Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

/**
 * Sends a payroll-generated email notification to an employee.
 *
 * @param {object} options
 * @param {string} options.toEmail       - Recipient email address
 * @param {string} options.employeeName  - Full employee name
 * @param {string} options.payMonth      - e.g. "March 2025"
 * @param {number} options.amount        - Net payroll amount
 * @param {string} options.payDate       - Payroll date
 * @param {string} options.modeOfPayment - Payment method
 * @param {string} [options.designation] - Employee designation (optional)
 *
 * @returns {Promise<{success: boolean, info?: object, error?: Error}>}
 */
async function sendPayrollEmail({ toEmail, employeeName, payMonth, amount, payDate, modeOfPayment, designation }) {
  const transporter = createTransporter();
  const fromName = process.env.SMTP_FROM_NAME || "Weisetech HR Portal";
  const fromEmail = process.env.SMTP_USER || process.env.EMAIL_USER;

  const html = buildPayrollEmailHtml({ employeeName, payMonth, amount, payDate, modeOfPayment, designation });

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmail,
    subject: `✅ Payroll Generated – ${payMonth} | Weisetech HR Portal`,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Payroll email sent to ${toEmail}:`, info.messageId);
    return { success: true, info };
  } catch (error) {
    console.error(`[EmailService] Failed to send payroll email to ${toEmail}:`, error.message);
    return { success: false, error };
  }
}

module.exports = { sendPayrollEmail };
