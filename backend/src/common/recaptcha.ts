/**
 * Verifies a Google reCAPTCHA v3 token against Google's siteverify endpoint.
 *
 * Gracefully degrades: if RECAPTCHA_SECRET_KEY isn't configured (e.g. local
 * Docker development, or before the site owner has set up a reCAPTCHA site),
 * verification is skipped entirely and registration proceeds normally —
 * exactly like the Cloudinary/Resend fallback pattern used elsewhere.
 */
export async function verifyCaptcha(token: string | undefined): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) return true; // not configured — allow through

  if (!token) return false;

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secretKey}&response=${token}`,
    });
    const data = await response.json();
    // reCAPTCHA v3 returns a 0.0-1.0 score; 0.5 is Google's recommended default threshold.
    return data.success === true && (data.score === undefined || data.score >= 0.5);
  } catch {
    return false;
  }
}
