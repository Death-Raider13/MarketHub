require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

async function sendMail(to, subject, html) {
  const from = process.env.EMAIL_FROM || process.env.FROM_EMAIL || 'Fero E-Library <no-reply@fero-elibrary.shop>';

  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = require('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const res = await resend.emails.send({ from, to, subject, html });
      if (res.error) throw new Error(res.error.message);
      return res;
    } catch (e) {
      console.warn('   ⚠️ Resend attempt failed, trying SMTP fallback...', e.message);
    }
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT || 587) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    return await transporter.sendMail({ from, to, subject, html });
  }

  console.log(`   📧 Simulated email sending to: ${to}`);
  return { simulated: true };
}

async function onboardWaitlistMembers() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT_JSON is missing');
    return;
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  const db = admin.firestore();
  const auth = admin.auth();

  console.log('🔍 Fetching waitlist entries from Firestore...');
  const snapshot = await db.collection('waitlist').get();

  if (snapshot.empty) {
    console.log('⚠️ No waitlist entries found.');
    return;
  }

  // Map unique emails
  const memberMap = new Map();
  snapshot.forEach(doc => {
    const data = doc.data() || {};
    const email = data.email?.toLowerCase().trim();
    if (!email) return;

    if (!memberMap.has(email)) {
      memberMap.set(email, {
        email,
        role: data.role || 'customer',
        createdAt: data.createdAt || new Date()
      });
    } else {
      const existing = memberMap.get(email);
      if (data.role === 'creator') existing.role = 'creator';
      else if ((data.role === 'affiliate' || data.role === 'promoter') && existing.role !== 'creator') existing.role = 'promoter';
    }
  });

  const uniqueMembers = Array.from(memberMap.values());
  console.log(`🚀 Found ${uniqueMembers.length} unique waitlist emails to onboard.`);

  let successCount = 0;
  let errorCount = 0;

  for (const member of uniqueMembers) {
    console.log(`\n--------------------------------------------------`);
    console.log(`Processing: ${member.email} (${member.role})`);

    try {
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(member.email);
        console.log(`   ✓ Found existing Auth user (UID: ${userRecord.uid})`);
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          const displayName = member.email.split('@')[0];
          userRecord = await auth.createUser({
            email: member.email,
            displayName,
            emailVerified: true
          });
          console.log(`   ✨ Created NEW Auth user (UID: ${userRecord.uid})`);
        } else {
          throw err;
        }
      }

      // Map waitlist role to system role
      const systemRole = member.role === 'affiliate' ? 'promoter' : member.role;

      // Upsert Firestore users document
      const userRef = db.collection('users').doc(userRecord.uid);
      const userDoc = await userRef.get();

      const userData = {
        uid: userRecord.uid,
        email: member.email,
        displayName: userRecord.displayName || member.email.split('@')[0],
        role: userDoc.exists ? (userDoc.data().role || systemRole) : systemRole,
        waitlistMember: true,
        waitlistEligible: true,
        waitlistJoinedAt: member.createdAt,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (!userDoc.exists) {
        userData.createdAt = admin.firestore.FieldValue.serverTimestamp();
        if (systemRole === 'promoter') {
          userData.affiliateStatus = 'pending_payment';
          userData.affiliateAvailableBalance = 0;
          userData.affiliatePendingBalance = 0;
          userData.affiliateTotalWithdrawn = 0;
        } else if (systemRole === 'creator') {
          userData.creatorStatus = 'approved';
        }
      }

      await userRef.set(userData, { merge: true });
      console.log(`   ✓ Updated Firestore users document with waitlistMember=true & role=${systemRole}.`);

      // Generate Password Reset / Account Activation Link
      const passwordResetLink = await auth.generatePasswordResetLink(member.email);
      console.log(`   🔑 Password setup link generated.`);

      const roleName = systemRole === 'creator' ? 'Educator / Creator' : systemRole === 'promoter' ? 'Affiliate Promoter' : 'Student & Reader';

      const emailHtml = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Fero E-Library - Activate Your Account</title>
      </head>
      <body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px;background-color:#f9fafb">
        <div style="background:white;padding:30px;border-radius:12px;border:1px solid #e5e7eb;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05)">
          
          <div style="text-align:center;margin-bottom:25px">
            <h1 style="color:#dc2626;margin:0;font-size:28px;font-weight:800">🎉 Welcome to Fero E-Library</h1>
            <p style="margin:8px 0 0 0;color:#4b5563;font-size:16px">Your Waitlist Membership is Active!</p>
          </div>

          <div style="background:#f3f4f6;padding:20px;border-radius:8px;margin-bottom:20px border-left:4px solid #dc2626">
            <p style="margin:0 0 10px 0;font-size:15px">Hello,</p>
            <p style="margin:0;font-size:15px;color:#374151">
              Great news! As a valued early subscriber on our waitlist, your <strong>Fero E-Library account</strong> has been pre-configured as an official <strong>${roleName}</strong>.
            </p>
          </div>

          <div style="background:#fef3c7;padding:15px;border-radius:8px;margin:20px 0;border:1px solid #fde68a">
            <h3 style="color:#92400e;margin:0 0 5px 0;font-size:16px">✨ Exclusive Waitlist Perk Unlocked</h3>
            <p style="margin:0;color:#b45309;font-size:14px">
              You have automatically qualified for a <strong>25% Waitlist Discount</strong> on platform fees and exclusive features!
            </p>
          </div>

          <div style="margin:30px 0;text-align:center">
            <p style="margin-bottom:15px;font-weight:600;font-size:15px">Click the button below to set up your secure password and sign in:</p>
            <a href="${passwordResetLink}" 
               style="background:#dc2626;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;display:inline-block;box-shadow:0 4px 6px -1px rgba(220,38,38,0.3)">
              Set Up Password & Activate Account ➔
            </a>
          </div>

          <p style="font-size:13px;color:#6b7280;line-height:1.4">
            If the button above does not work, copy and paste this link into your browser:<br>
            <a href="${passwordResetLink}" style="color:#dc2626;word-break:break-all">${passwordResetLink}</a>
          </p>

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:25px 0">

          <p style="text-align:center;font-size:12px;color:#9ca3af;margin:0">
            Fero E-Library — Nigeria's Premier Academic & Educational Resource Hub.<br>
            Need help? Contact support at <a href="mailto:support@fero-elibrary.shop" style="color:#6b7280">support@fero-elibrary.shop</a>
          </p>
        </div>
      </body>
      </html>`;

      await sendMail(member.email, `🚀 Activate Your Fero E-Library Account (${roleName})`, emailHtml);
      console.log(`   📧 Activation email sent successfully to ${member.email}!`);
      successCount++;
    } catch (err) {
      console.error(`   ❌ Failed to onboard ${member.email}:`, err.message);
      errorCount++;
    }
  }

  console.log(`\n==================================================`);
  console.log(`🎉 WAITLIST ONBOARDING COMPLETE!`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Failed/Errors: ${errorCount}`);
  console.log(`==================================================\n`);
}

onboardWaitlistMembers();
