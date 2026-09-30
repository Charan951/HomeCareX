import https from 'node:https';
import { HttpError } from '../auth/auth.types';

interface RecaptchaVerification {
  success: boolean;
  'error-codes'?: string[];
}

const verifyToken = (secret: string, token: string, remoteIp?: string) =>
  new Promise<RecaptchaVerification>((resolve, reject) => {
    const body = new URLSearchParams({
      secret,
      response: token,
      ...(remoteIp ? { remoteip: remoteIp } : {}),
    }).toString();
    const request = https.request(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 5000,
      },
      (response) => {
        let result = '';
        response.setEncoding('utf8');
        response.on('data', (chunk: string) => { result += chunk; });
        response.on('end', () => {
          try {
            resolve(JSON.parse(result) as RecaptchaVerification);
          } catch {
            reject(new Error('CAPTCHA verification returned an invalid response'));
          }
        });
      },
    );
    request.on('timeout', () => request.destroy(new Error('CAPTCHA verification timed out')));
    request.on('error', reject);
    request.end(body);
  });

export const verifyLeadCaptcha = async (token: string | undefined, remoteIp?: string): Promise<void> => {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    console.error('RECAPTCHA_SECRET_KEY is not configured.');
    throw new HttpError(503, 'Enquiry validation is temporarily unavailable. Please try again later.', 'CAPTCHA_UNAVAILABLE');
  }
  if (!token || token.length > 4096) {
    throw new HttpError(400, 'Please complete the CAPTCHA check and try again.', 'CAPTCHA_REQUIRED');
  }

  let result: RecaptchaVerification;
  try {
    result = await verifyToken(secret, token, remoteIp);
  } catch (error) {
    console.error('CAPTCHA verification request failed.', error);
    throw new HttpError(503, 'We could not verify the CAPTCHA right now. Please try again.', 'CAPTCHA_UNAVAILABLE');
  }

  if (!result.success) {
    throw new HttpError(400, 'CAPTCHA verification failed. Please try again.', 'CAPTCHA_FAILED');
  }
};
