const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const cors = require('cors');
const admin = require('firebase-admin');
admin.initializeApp();

const corsHandler = cors({ origin: true });
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().gmail.email,
    pass: functions.config().gmail.password
  }
});

exports.sendConfirmationEmail = functions.firestore
  .document('bookings/{bookingId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    if (before.status === 'confirmed' && after.status === 'confirmed') return null;
    if (after.status !== 'confirmed') return null;
    if (!after.emailAddress) return null;
    
    try {
      const termsDoc = await admin.firestore().collection('termsConditions').doc('latest').get();
      const terms = termsDoc.exists ? termsDoc.data().content : 'Standard terms and conditions apply.';
      
      const customerEmail = after.emailAddress;
      const bookingNumber = after.bookingNumber || context.params.bookingId;
      const customerName = after.customerName || 'Valued Customer';
      const celebrant = after.celebrant || '';
      const partyDate = after.date || '';
      const partyTime = after.time || '';
      const branch = after.branch || '';
      const theme = after.theme || '';
      const mealBundle = after.mealBundle || '';
      const guests = after.guests || '';
      
      const accessToken = await admin.auth().createCustomToken(context.params.bookingId);
      const bookingUrl = `https://jkp-monitoring.web.app/view-booking.html?id=${context.params.bookingId}&token=${accessToken}`;
      
      const mailOptions = {
        from: '"Jollibee Kids Party" <' + functions.config().gmail.email + '>',
        to: customerEmail,
        subject: '🎉 Your Jollibee Kids Party Booking is Confirmed!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #E31837 0%, #B3122B 100%); padding: 32px; text-align: center;">
              <h1 style="color: #FFC72C; margin: 0; font-size: 28px;">🎉 Party Confirmed!</h1>
              <p style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 15px;">Jollibee Kids Party</p>
            </div>
            <div style="padding: 32px;">
              <h2 style="color: #E31837; margin-top: 0;">Hello, ${customerName}!</h2>
              <p style="color: #333; line-height: 1.6;">We're excited to confirm your booking at <strong>${branch}</strong>. Get ready for an unforgettable party!</p>
              
              <div style="background: #FFF8E1; border-left: 4px solid #FFC72C; padding: 16px; margin: 20px 0; border-radius: 8px;">
                <h3 style="color: #B3122B; margin: 0 0 12px; font-size: 18px;">Booking Details</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr><td style="padding: 6px 0; color: #666; font-weight: 600; width: 40%;">Booking Number</td><td style="padding: 6px 0; color: #333; font-weight: bold;">${bookingNumber}</td></tr>
                  ${celebrant ? `<tr><td style="padding: 6px 0; color: #666; font-weight: 600;">Celebrant</td><td style="padding: 6px 0; color: #333;">${celebrant}</td></tr>` : ''}
                  <tr><td style="padding: 6px 0; color: #666; font-weight: 600;">Party Date</td><td style="padding: 6px 0; color: #333;">${partyDate}</td></tr>
                  <tr><td style="padding: 6px 0; color: #666; font-weight: 600;">Party Time</td><td style="padding: 6px 0; color: #333;">${partyTime}</td></tr>
                  <tr><td style="padding: 6px 0; color: #666; font-weight: 600;">Branch</td><td style="padding: 6px 0; color: #333;">${branch}</td></tr>
                  <tr><td style="padding: 6px 0; color: #666; font-weight: 600;">Theme</td><td style="padding: 6px 0; color: #333;">${theme}</td></tr>
                  <tr><td style="padding: 6px 0; color: #666; font-weight: 600;">Meal Bundle</td><td style="padding: 6px 0; color: #333;">${mealBundle}</td></tr>
                  <tr><td style="padding: 6px 0; color: #666; font-weight: 600;">Guests</td><td style="padding: 6px 0; color: #333;">${guests}</td></tr>
                  <tr><td style="padding: 6px 0; color: #666; font-weight: 600;">Status</td><td style="padding: 6px 0;"><span style="background: #22C55E; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700;">CONFIRMED</span></td></tr>
                  </table>
              </div>
              
              <div style="background: #FEE2E2; border-left: 4px solid #E31837; padding: 16px; margin: 20px 0; border-radius: 8px;">
                <h3 style="color: #B3122B; margin: 0 0 8px; font-size: 16px;">Party Package Inclusions</h3>
                <ul style="margin: 0; padding-left: 20px; color: #333; line-height: 1.8; font-size: 14px;">
                  <li>15 Party Invitations</li><li>15 Party Hats</li><li>15 Nametags</li><li>15 Balloons</li><li>15 Activity Traymats</li><li>10 Loot Bags</li><li>Game Prizes</li><li>Gift for the Celebrant</li><li>Jollibee Mascot Appearance</li>
                </ul>
              </div>
              
              <div style="background: #F8F9FA; border: 1px solid #E9ECEF; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <h3 style="color: #E31837; margin: 0 0 8px; font-size: 16px;">Terms and Conditions</h3>
                <p style="color: #555; font-size: 13px; line-height: 1.6; white-space: pre-wrap;">${terms}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0 20px;">
                <a href="${bookingUrl}" style="background: linear-gradient(135deg, #E31837, #B3122B); color: white; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 15px rgba(227,24,55,0.35);">View Booking Details</a>
                <p style="color: #999; font-size: 12px; margin-top: 12px;">Click above to view your booking details and acknowledge terms.</p>
              </div>
              
              <div style="background: linear-gradient(135deg, #FFF8E1, #FFE08A); padding: 16px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #B3122B; margin: 0 0 8px; font-size: 16px;">Party Reminders</h3>
                <ul style="margin: 0; padding-left: 20px; color: #333; line-height: 1.8; font-size: 14px;">
                  <li>Please arrive 30 minutes before your party time.</li>
                  <li>Bring a copy of your booking confirmation.</li>
                  <li>Cake must be ordered at least 3 days in advance.</li>
                  <li>Additional guests may incur extra charges.</li>
                </ul>
              </div>
              
              <div style="background: #E8F5E9; border-left: 4px solid #22C55E; padding: 12px; border-radius: 8px; margin-top: 20px;">
                <p style="margin: 0; color: #166534; font-size: 14px;">Need assistance? Contact us at your branch or email support@jollibee.com.ph</p>
              </div>
            </div>
            <div style="background: #1E1E2E; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #888; font-size: 12px;">© 2026 Jollibee Kids Party. All rights reserved. | JKP Monitoring System</p>
            </div>
          </div>
        `,
        text: `Booking Confirmed! Booking Number: ${bookingNumber}, Customer: ${customerName}, Celebrant: ${celebrant}, Date: ${partyDate}, Time: ${partyTime}, Branch: ${branch}, Theme: ${theme}, Meal Bundle: ${mealBundle}, Guests: ${guests}. View details: ${bookingUrl}`
      };
      
      await transporter.sendMail(mailOptions);
      
      await admin.firestore().collection('activityLogs').add({
        bookingId: context.params.bookingId,
        action: 'confirmation_email_sent',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        details: { email: customerEmail, bookingNumber }
      });
      
      await admin.firestore().collection('bookings').doc(context.params.bookingId).update({
        confirmationEmailSent: true,
        confirmationEmailSentAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      return { success: false, error: error.message };
    }
  });

exports.onCreateBooking = functions.firestore
  .document('bookings/{bookingId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const bookingRef = admin.firestore().collection('bookings').doc(context.params.bookingId);
    
    await bookingRef.update({ createdAt: admin.firestore.FieldValue.serverTimestamp() });
    
    if (data.status === 'confirmed') {
      const mailOptions = {
        from: '"Jollibee Kids Party" <' + functions.config().gmail.email + '>',
        to: data.emailAddress,
        subject: '🎉 Your Jollibee Kids Party Booking is Confirmed!',
        html: `<h1>Booking Confirmed!</h1><p>Booking #${data.bookingNumber} for ${data.customerName} is confirmed.</p>`,
        text: 'Your booking is confirmed.'
      };
      await transporter.sendMail(mailOptions);
    }
    
    await admin.firestore().collection('activityLogs').add({
      bookingId: context.params.bookingId,
      action: 'booking_created',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      details: { customerName: data.customerName, bookingNumber: data.bookingNumber }
    });
  });

exports.api = functions.https.onRequest((req, res) => {
  corsHandler(req, res, () => {
    res.status(200).json({ message: 'JKP Monitoring API', status: 'active' });
  });
});
