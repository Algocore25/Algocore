import emailjs from '@emailjs/browser';
import { ref, get } from 'firebase/database';
import { database } from '../firebase';

/**
 * Enhanced Utility to send emails with fallback and retry logic.
 * It tries the primary Netlify service first, and then falls back to EmailJS if configured.
 */
export const sendEmailService = async ({ to, subject, text, html }, maxRetries = 2) => {
  let lastError = null;

  // ── Method 1: Netlify Functions (Primary) ─────────────────────────────────
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Sending email via Netlify (Attempt ${i + 1})...`);
      const response = await fetch(
        "https://algocorefunctions.netlify.app/.netlify/functions/send-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to, subject, text, html })
        }
      );

      if (response.ok) {
        const data = await response.text();
        return { success: true, method: 'netlify', data };
      }
      lastError = `Netlify status: ${response.status}`;
    } catch (err) {
      console.warn(`Netlify attempt ${i + 1} failed:`, err);
      lastError = err.message;
    }
  }

  // ── Method 2: EmailJS (Fallback) ───────────────────────────────────────────
  console.log("Falling back to EmailJS...");
  try {
    const snap = await get(ref(database, 'adminConfig/emailjs'));
    if (snap.exists()) {
      const { serviceId, templateId, publicKey } = snap.val();
      if (serviceId && templateId && publicKey) {
        const result = await emailjs.send(
          serviceId,
          templateId,
          {
            to_email: to,
            subject: subject,
            message: text,
            message_html: html
          },
          publicKey
        );
        return { success: true, method: 'emailjs', data: result };
      }
    }
  } catch (err) {
    console.error("EmailJS fallback failed:", err);
    lastError = `Fallback failed: ${err.message}`;
  }

  return { success: false, error: lastError };
};

/**
 * Robustly fetch a user's email from the database.
 * Checks root (preferred) and profile (legacy fallback).
 */
export const getUserEmail = async (uid) => {
  try {
    const [rootSnap, profileSnap] = await Promise.all([
      get(ref(database, `users/${uid}/email`)),
      get(ref(database, `users/${uid}/profile/email`))
    ]);

    if (rootSnap.exists()) return rootSnap.val();
    if (profileSnap.exists()) return profileSnap.val();
    return null;
  } catch (err) {
    console.error("Failed to fetch user email:", err);
    return null;
  }
};

/**
 * Responsive HTML Template for a Premium Welcome Email
 */
export const getWelcomeTemplate = (name) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">Welcome to AlgoCore!</h1>
      </div>
      <div style="padding: 32px 24px; background-color: #ffffff;">
        <p style="font-size: 16px; color: #1e293b; line-height: 24px; margin-bottom: 24px;">
          Hi <strong>${name}</strong>,
        </p>
        <p style="font-size: 16px; color: #475569; line-height: 24px; margin-bottom: 24px;">
          We're thrilled to have you join our community! AlgoCore is designed to help you master coding, crack technical interviews, and track your progress with precision.
        </p>
        <div style="background-color: #eff6ff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="color: #1e40af; margin-top: 0; font-size: 16px;">What's Next?</h3>
          <ul style="color: #1e40af; padding-left: 20px; font-size: 14px; line-height: 20px;">
            <li>Explore our curated coding courses</li>
            <li>Practice with real-world interview problems</li>
            <li>Compete in upcoming coding assessments</li>
          </ul>
        </div>
        <a href="https://algocore.netlify.app/" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; transition: background-color 0.2s;">Get Started Now</a>
      </div>
      <div style="padding: 24px; background-color: #f1f5f9; text-align: center;">
        <p style="font-size: 12px; color: #64748b; margin: 0;">&copy; 2026 AlgoCore. All rights reserved.</p>
        <p style="font-size: 12px; color: #64748b; margin: 4px 0 0;">Empowering the next generation of coders.</p>
      </div>
    </div>
  `;
};

/**
 * Responsive HTML Template for a Security Login Notification
 */
export const getLoginNotificationTemplate = (name) => {
  const loginTime = new Date().toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short'
  });

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #f8fafc; padding: 32px 24px; border-bottom: 1px solid #e2e8f0;">
        <div style="background-color: #3b82f6; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        </div>
        <h1 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 700;">New Login Detected</h1>
      </div>
      <div style="padding: 32px 24px;">
        <p style="font-size: 16px; color: #334155; line-height: 24px; margin-bottom: 24px;">
          Hello <strong>${name}</strong>,
        </p>
        <p style="font-size: 16px; color: #64748b; line-height: 24px; margin-bottom: 24px;">
          Your AlgoCore account was just accessed from a new device. For your security, we're letting you know.
        </p>
        <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr>
              <td style="color: #64748b; padding: 4px 0;">Time</td>
              <td style="color: #0f172a; font-weight: 500; text-align: right;">${loginTime}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding: 4px 0;">Platform</td>
              <td style="color: #0f172a; font-weight: 500; text-align: right;">Web Browser</td>
            </tr>
          </table>
        </div>
        <p style="font-size: 14px; color: #ef4444; background-color: #fef2f2; padding: 12px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #ef4444;">
          If this wasn't you, please change your password immediately and contact our support team.
        </p>
      </div>
      <div style="padding: 24px; background-color: #f8fafc; text-align: center;">
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">&copy; 2026 AlgoCore. All rights reserved.</p>
      </div>
    </div>
  `;
};
