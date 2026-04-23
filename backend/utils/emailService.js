const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send dispensing confirmation email after successful redemption
 */
const sendDispensingConfirmation = async ({ userEmail, userName, productName, redeemedAt }) => {
  if (!process.env.SMTP_USER) {
    console.log('📧 Email skipped — SMTP not configured');
    return false;
  }

  const transporter = createTransporter();

  const formattedDate = new Date(redeemedAt).toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f0fdf4; margin:0; padding:20px; }
        .container { max-width:520px; margin:0 auto; background:#fff; border-radius:8px; overflow:hidden; border:1px solid #d1fae5; }
        .header { background:#166534; color:#fff; padding:28px 32px; }
        .header h1 { margin:0; font-size:20px; font-weight:600; }
        .header p { margin:4px 0 0; font-size:13px; opacity:.85; }
        .body { padding:32px; }
        .badge { display:inline-block; background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; border-radius:6px; padding:12px 20px; font-size:15px; font-weight:600; margin:16px 0; }
        .detail-row { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #f1f5f9; font-size:14px; }
        .detail-row:last-child { border-bottom:none; }
        .label { color:#64748b; }
        .value { color:#0f172a; font-weight:500; }
        .footer { background:#f8fafc; padding:16px 32px; font-size:12px; color:#94a3b8; text-align:center; }
        .note { background:#fef9c3; border:1px solid #fde68a; border-radius:6px; padding:12px 16px; font-size:13px; color:#92400e; margin-top:20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 Campus Health Kiosk</h1>
          <p>Al Akhawayn University — Dispensing Confirmation</p>
        </div>
        <div class="body">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>Your health product request has been successfully dispensed. Please collect your item at the kiosk.</p>
          <div class="badge">✅ ${productName}</div>
          <div>
            <div class="detail-row">
              <span class="label">Dispensed on</span>
              <span class="value">${formattedDate}</span>
            </div>
            <div class="detail-row">
              <span class="label">Recipient</span>
              <span class="value">${userName}</span>
            </div>
          </div>
          <div class="note">
            ⚠️ This token has been marked as redeemed and cannot be used again. If you did not initiate this dispensing, please contact the Campus Health office immediately.
          </div>
        </div>
        <div class="footer">
          Campus Health Kiosk Simulator · Al Akhawayn University in Ifrane<br>
          This is an automated message — please do not reply.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"Campus Health Kiosk" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `✅ Dispensing Confirmed: ${productName}`,
      html,
    });
    console.log(`📧 Dispensing confirmation sent to ${userEmail}`);
    return true;
  } catch (err) {
    console.error(`📧 Email send failed: ${err.message}`);
    return false;
  }
};

module.exports = { sendDispensingConfirmation };
