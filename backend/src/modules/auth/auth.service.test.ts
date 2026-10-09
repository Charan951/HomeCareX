import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import jwt from 'jsonwebtoken';
import { authRepository } from './auth.repository';
import { authService } from './auth.service';
import { authController } from './auth.controller';
import { parseBody, registerSchema, type RegisterInput } from './auth.validation';
import { mailService } from '../../services/mail.service';
import { UserModel } from '../../models/User';
import { authRateLimit } from '../../middleware/rateLimit.middleware';

const originalExists = Object.getOwnPropertyDescriptor(authRepository, 'existsByEmailOrPhone');
const originalCreate = Object.getOwnPropertyDescriptor(authRepository, 'create');
const originalFindById = Object.getOwnPropertyDescriptor(authRepository, 'findById');
const originalFindByEmail = Object.getOwnPropertyDescriptor(authRepository, 'findByEmail');
const originalFindByResetTokenHash = Object.getOwnPropertyDescriptor(authRepository, 'findByResetTokenHash');
const originalSendAccountCreatedEmail = Object.getOwnPropertyDescriptor(mailService, 'sendAccountCreatedEmail');
const originalSendPasswordResetEmail = Object.getOwnPropertyDescriptor(mailService, 'sendPasswordResetEmail');
const originalSendPasswordResetOtpEmail = Object.getOwnPropertyDescriptor(mailService, 'sendPasswordResetOtpEmail');
const originalCreateOtp = Object.getOwnPropertyDescriptor(authRepository, 'createOtp');
const originalFindLatestOtp = Object.getOwnPropertyDescriptor(authRepository, 'findLatestOtp');
const originalInvalidateActiveOtps = Object.getOwnPropertyDescriptor(authRepository, 'invalidateActiveOtps');
const originalConsoleError = console.error;

afterEach(() => {
  if (originalExists) Object.defineProperty(authRepository, 'existsByEmailOrPhone', originalExists);
  if (originalCreate) Object.defineProperty(authRepository, 'create', originalCreate);
  if (originalFindById) Object.defineProperty(authRepository, 'findById', originalFindById);
  if (originalFindByEmail) Object.defineProperty(authRepository, 'findByEmail', originalFindByEmail);
  if (originalFindByResetTokenHash) Object.defineProperty(authRepository, 'findByResetTokenHash', originalFindByResetTokenHash);
  if (originalCreateOtp) Object.defineProperty(authRepository, 'createOtp', originalCreateOtp);
  if (originalFindLatestOtp) Object.defineProperty(authRepository, 'findLatestOtp', originalFindLatestOtp);
  if (originalInvalidateActiveOtps) Object.defineProperty(authRepository, 'invalidateActiveOtps', originalInvalidateActiveOtps);
  if (originalSendAccountCreatedEmail) Object.defineProperty(mailService, 'sendAccountCreatedEmail', originalSendAccountCreatedEmail);
  if (originalSendPasswordResetEmail) Object.defineProperty(mailService, 'sendPasswordResetEmail', originalSendPasswordResetEmail);
  if (originalSendPasswordResetOtpEmail) Object.defineProperty(mailService, 'sendPasswordResetOtpEmail', originalSendPasswordResetOtpEmail);
  console.error = originalConsoleError;
});

function mockCreate(role: 'customer' | 'partner' = 'customer') {
  const createdAt = new Date('2026-10-05T08:00:00.000Z');
  Object.defineProperty(authRepository, 'create', {
    configurable: true,
    value: async (data: Parameters<typeof authRepository.create>[0]) => UserModel.hydrate({
      _id: '507f1f77bcf86cd799439011',
      ...data,
      role,
      status: 'active',
      tokenVersion: 0,
      createdAt,
      updatedAt: createdAt,
    }),
  });
  return createdAt;
}

function mockEmail(send: (data: Parameters<typeof mailService.sendAccountCreatedEmail>[0]) => Promise<void>) {
  Object.defineProperty(mailService, 'sendAccountCreatedEmail', { configurable: true, value: send });
}

function mockNoDuplicate() {
  Object.defineProperty(authRepository, 'existsByEmailOrPhone', { configurable: true, value: async () => null });
}

const validInput: RegisterInput = {
  name: 'Test Customer',
  email: 'testcustomer@example.com',
  phone: '9876543210',
  password: 'StrongPassword123!',
  role: 'customer',
};

test('successful registration creates a customer and requests the welcome email with persisted account data', async () => {
  const createdAt = mockCreate();
  mockNoDuplicate();
  let email: Parameters<typeof mailService.sendAccountCreatedEmail>[0] | undefined;
  mockEmail(async (data) => { email = data; });

  const result = await authService.register(validInput);

  assert.equal(result.user.role, 'customer');
  assert.ok(email);
  assert.equal(email.email, validInput.email);
  assert.equal(email.name, validInput.name);
  assert.equal(email.role, 'customer');
  assert.equal(email.createdAt, createdAt);
  assert.deepEqual(Object.keys(email).sort(), ['createdAt', 'email', 'name', 'role']);
  assert.equal('password' in email, false);
  assert.equal('passwordHash' in email, false);
  assert.equal('accessToken' in email, false);
  assert.equal('refreshToken' in email, false);
  assert.ok(result.user.id);
});

for (const duplicate of ['email', 'phone']) {
  test(`duplicate ${duplicate} does not create a user or send a welcome email`, async () => {
    let createCalled = false;
    let emailCalled = false;
    Object.defineProperty(authRepository, 'existsByEmailOrPhone', { configurable: true, value: async () => ({ _id: 'existing' }) });
    Object.defineProperty(authRepository, 'create', {
      configurable: true,
      value: async () => { createCalled = true; throw new Error('create should not run'); },
    });
    mockEmail(async () => { emailCalled = true; });

    await assert.rejects(authService.register(validInput), { status: 409, code: 'DUPLICATE_ACCOUNT' });
    assert.equal(createCalled, false);
    assert.equal(emailCalled, false);
  });
}

test('invalid and administrator registration input is rejected before sending email', async () => {
  let emailCalled = false;
  mockEmail(async () => { emailCalled = true; });

  assert.throws(() => parseBody(registerSchema, {}), { status: 400, code: 'VALIDATION_ERROR' });
  assert.throws(() => parseBody(registerSchema, { ...validInput, role: 'admin' }), { status: 400, code: 'VALIDATION_ERROR' });
  assert.equal(emailCalled, false);
});

test('database creation failure does not send a welcome email', async () => {
  mockNoDuplicate();
  let emailCalled = false;
  Object.defineProperty(authRepository, 'create', {
    configurable: true,
    value: async () => { throw new Error('database unavailable'); },
  });
  mockEmail(async () => { emailCalled = true; });

  await assert.rejects(authService.register(validInput), /database unavailable/);
  assert.equal(emailCalled, false);
});

test('email provider failure is logged without sensitive error details and registration remains successful', async () => {
  mockCreate();
  mockNoDuplicate();
  const logs: Parameters<typeof console.error>[] = [];
  console.error = (...args) => { logs.push(args); };
  mockEmail(async () => { throw new Error('SMTP_PASSWORD=private-provider-secret'); });

  const result = await authService.register(validInput);

  assert.equal(result.user.role, 'customer');
  assert.ok(result.accessToken);
  assert.equal(logs.length, 1);
  assert.deepEqual(logs[0], ['Account-created email failed for user', result.user.id]);
  assert.equal(JSON.stringify(logs).includes('private-provider-secret'), false);
});

test('welcome email uses the persisted role rather than the submitted role', async () => {
  mockCreate('partner');
  mockNoDuplicate();
  let email: Parameters<typeof mailService.sendAccountCreatedEmail>[0] | undefined;
  mockEmail(async (data) => { email = data; });

  await authService.register(validInput);

  assert.equal(email?.role, 'partner');
});

const refreshSecret = () => process.env.JWT_REFRESH_SECRET || `${process.env.JWT_SECRET || 'dev_access_secret_change_me'}_refresh`;

// --- Rate Limiting Tests ---

test('rate limit: first 5 requests are allowed, 6th returns 429 with RATE_LIMITED on the same route', () => {
  const ip = '198.51.100.1';
  const req = { ip, baseUrl: '/api/v1/auth', path: '/login' } as any;
  const res = {} as any;

  for (let i = 1; i <= 5; i++) {
    let nextCalled = false;
    let nextErr: any = null;
    authRateLimit(req, res, (err?: any) => {
      nextCalled = true;
      nextErr = err;
    });
    assert.equal(nextCalled, true, `Request ${i} should call next()`);
    assert.equal(nextErr, undefined, `Request ${i} should be allowed without error`);
  }

  // 6th request
  let error6th: any = null;
  authRateLimit(req, res, (err?: any) => {
    error6th = err;
  });
  assert.ok(error6th, '6th request must yield an error');
  assert.equal(error6th.status, 429);
  assert.equal(error6th.code, 'RATE_LIMITED');
  assert.equal(error6th.message, 'Too many requests. Please wait a minute and try again.');
});

test('rate limit: login and register buckets remain independent for the same IP', () => {
  const ip = '198.51.100.2';
  const loginReq = { ip, baseUrl: '/api/v1/auth', path: '/login' } as any;
  const registerReq = { ip, baseUrl: '/api/v1/auth', path: '/register' } as any;
  const res = {} as any;

  // Exhaust 5 requests on login
  for (let i = 1; i <= 5; i++) {
    let err: any = null;
    authRateLimit(loginReq, res, (e?: any) => { err = e; });
    assert.equal(err, undefined, `Login request ${i} should be allowed`);
  }

  // 6th request on login returns 429
  let loginErr: any = null;
  authRateLimit(loginReq, res, (e?: any) => { loginErr = e; });
  assert.equal(loginErr?.status, 429);
  assert.equal(loginErr?.code, 'RATE_LIMITED');

  // Register bucket should still allow 5 requests for the same IP
  for (let i = 1; i <= 5; i++) {
    let err: any = null;
    authRateLimit(registerReq, res, (e?: any) => { err = e; });
    assert.equal(err, undefined, `Register request ${i} should be allowed`);
  }

  // 6th request on register returns 429
  let regErr: any = null;
  authRateLimit(registerReq, res, (e?: any) => { regErr = e; });
  assert.equal(regErr?.status, 429);
  assert.equal(regErr?.code, 'RATE_LIMITED');
});

// --- Refresh Token Tests ---

test('refresh: missing refresh cookie returns 401 NO_REFRESH_TOKEN', async () => {
  await assert.rejects(
    authService.refresh(undefined),
    { status: 401, code: 'NO_REFRESH_TOKEN', message: 'Your session has expired. Please log in again.' }
  );
  await assert.rejects(
    authService.refresh(''),
    { status: 401, code: 'NO_REFRESH_TOKEN' }
  );
});

test('refresh: expired refresh token returns 401 INVALID_REFRESH_TOKEN', async () => {
  const expiredToken = jwt.sign({ sub: '507f1f77bcf86cd799439011', v: 1 }, refreshSecret(), { expiresIn: '-1s' });
  await assert.rejects(
    authService.refresh(expiredToken),
    { status: 401, code: 'INVALID_REFRESH_TOKEN' }
  );
});

test('refresh: malformed refresh token returns 401 INVALID_REFRESH_TOKEN', async () => {
  await assert.rejects(
    authService.refresh('not.a.valid.jwt.token'),
    { status: 401, code: 'INVALID_REFRESH_TOKEN' }
  );
});

test('refresh: valid refresh succeeds, returns new access token, increments token version, and replaces cookie', async () => {
  const mockUser = {
    id: '507f1f77bcf86cd799439011',
    name: 'Test Customer',
    email: 'testcustomer@example.com',
    role: 'customer',
    status: 'active',
    tokenVersion: 1,
    save: async function () { return this; },
  };

  Object.defineProperty(authRepository, 'findById', {
    configurable: true,
    value: async () => mockUser,
  });

  const tokenV1 = jwt.sign({ sub: mockUser.id, v: 1 }, refreshSecret(), { expiresIn: '7d' });

  // Test service level
  const result = await authService.refresh(tokenV1);
  assert.ok(result.accessToken, 'Must return a new access token');
  assert.ok(result.refreshToken, 'Must return a new refresh token');
  assert.equal(mockUser.tokenVersion, 2, 'User token version must increment to 2');

  const decodedNewRefresh = jwt.verify(result.refreshToken, refreshSecret()) as { sub: string; v: number };
  assert.equal(decodedNewRefresh.v, 2, 'New refresh token must encode version 2');

  // Test controller level for cookie replacement
  mockUser.tokenVersion = 1;
  const cookieCalls: { name: string; val: string; opts: any }[] = [];
  let responseData: any = null;

  const req = {
    headers: { cookie: `hcx_refresh=${tokenV1}` },
  } as any;

  await new Promise<void>((resolve, reject) => {
    const next = (err?: any) => {
      if (err) reject(err);
      else resolve();
    };
    const res = {
      cookie: (name: string, val: string, opts: any) => {
        cookieCalls.push({ name, val, opts });
      },
      json: (body: any) => {
        responseData = body;
        resolve();
      },
    } as any;
    authController.refresh(req, res, next);
  });

  assert.equal(cookieCalls.length, 1, 'res.cookie must be called once');
  assert.equal(cookieCalls[0].name, 'hcx_refresh');
  assert.ok(cookieCalls[0].val);
  assert.notEqual(cookieCalls[0].val, tokenV1, 'Cookie must be replaced with the new token');
  assert.equal(cookieCalls[0].opts.httpOnly, true);
  assert.equal(cookieCalls[0].opts.sameSite, process.env.NODE_ENV === 'production' ? 'strict' : 'lax');
  assert.equal(cookieCalls[0].opts.path, '/api/v1/auth');
  assert.ok(responseData?.success);
  assert.ok(responseData?.data?.accessToken);
  assert.equal(responseData?.data?.user?.id, mockUser.id);
});

test('refresh: old refresh token is rejected after rotation, and reused token causes session/token-family invalidation', async () => {
  const mockUser = {
    id: '507f1f77bcf86cd799439011',
    name: 'Test Customer',
    email: 'testcustomer@example.com',
    role: 'customer',
    status: 'active',
    tokenVersion: 1,
    save: async function () { return this; },
  };

  Object.defineProperty(authRepository, 'findById', {
    configurable: true,
    value: async () => mockUser,
  });

  const tokenA = jwt.sign({ sub: mockUser.id, v: 1 }, refreshSecret(), { expiresIn: '7d' });

  // 1. Initial valid refresh (v: 1 -> v: 2)
  const refreshRes = await authService.refresh(tokenA);
  const tokenB = refreshRes.refreshToken;
  assert.equal(mockUser.tokenVersion, 2, 'Token version should now be 2');

  // 2. Old token A presented again -> rejected with 401 REVOKED_REFRESH_TOKEN
  await assert.rejects(
    authService.refresh(tokenA),
    { status: 401, code: 'REVOKED_REFRESH_TOKEN' },
    'Old token A must be rejected after rotation'
  );

  // 3. Reuse detection: user.tokenVersion was bumped from 2 to 3 to invalidate the entire family
  assert.equal(mockUser.tokenVersion, 3, 'Reuse detection must bump user.tokenVersion to invalidate token family');

  // 4. Token B (v: 2) is now also rejected because the family was revoked
  await assert.rejects(
    authService.refresh(tokenB),
    { status: 401, code: 'REVOKED_REFRESH_TOKEN' },
    'Active token B from the compromised family must now also be rejected'
  );
});

// --- Forgot, Verify OTP, Resend & Reset Password Tests ---

test('forgotPassword: sends 6-digit OTP email, stores hashed OTP with 10m expiry, and returns generic message', async () => {
  const mockUser = {
    id: '507f1f77bcf86cd799439011',
    name: 'Reset Test User',
    email: 'resetuser@example.com',
    status: 'active',
  };

  Object.defineProperty(authRepository, 'findByEmail', {
    configurable: true,
    value: async (email: string) => (email === mockUser.email ? mockUser : null),
  });

  let createdOtpData: any = null;
  Object.defineProperty(authRepository, 'createOtp', {
    configurable: true,
    value: async (data: any) => { createdOtpData = data; return data; },
  });

  let invalidatedPurpose: string | undefined;
  Object.defineProperty(authRepository, 'invalidateActiveOtps', {
    configurable: true,
    value: async (_id: string, purpose: string) => { invalidatedPurpose = purpose; },
  });

  let sentMail: any = null;
  Object.defineProperty(mailService, 'sendPasswordResetOtpEmail', {
    configurable: true,
    value: async (data: any) => { sentMail = data; },
  });

  const res = await authService.forgotPassword({ email: 'resetuser@example.com' });
  assert.equal(res.success, true);
  assert.equal(res.message, 'If an account exists, a verification code has been sent.');

  // Previous OTPs were invalidated
  assert.equal(invalidatedPurpose, 'PASSWORD_RESET');

  // OTP was stored hashed
  assert.ok(createdOtpData);
  assert.equal(createdOtpData.identifier, 'resetuser@example.com');
  assert.equal(createdOtpData.hashedCode.length, 64, 'Hashed OTP must be SHA-256 (64 hex chars)');
  assert.equal(createdOtpData.purpose, 'PASSWORD_RESET');
  assert.ok(createdOtpData.expiresAt.getTime() > Date.now());

  // Email was sent with 6-digit plaintext OTP
  assert.ok(sentMail);
  assert.equal(sentMail.email, mockUser.email);
  assert.equal(sentMail.name, mockUser.name);
  assert.equal(typeof sentMail.otp, 'string');
  assert.equal(sentMail.otp.length, 6);
  assert.match(sentMail.otp, /^\d{6}$/);

  // Plaintext OTP is NOT what is stored in the database
  assert.notEqual(sentMail.otp, createdOtpData.hashedCode);
});

test('forgotPassword: returns identical generic message and does not send email for unknown user (anti-enumeration)', async () => {
  Object.defineProperty(authRepository, 'findByEmail', {
    configurable: true,
    value: async () => null,
  });

  let mailSent = false;
  Object.defineProperty(mailService, 'sendPasswordResetOtpEmail', {
    configurable: true,
    value: async () => { mailSent = true; },
  });

  const res = await authService.forgotPassword({ email: 'unknown@example.com' });
  assert.equal(res.success, true);
  assert.equal(res.message, 'If an account exists, a verification code has been sent.');
  assert.equal(mailSent, false, 'No email should be sent for unknown address');
});

test('verifyOtp: valid 6-digit OTP marks OTP as used, generates single-use reset token and returns it', async () => {
  const crypto = await import('crypto');
  const otpCode = '654321';
  const hashedCode = crypto.createHash('sha256').update(otpCode).digest('hex');

  const mockOtpDoc = {
    _id: 'otp_123',
    identifier: 'resetuser@example.com',
    hashedCode,
    purpose: 'PASSWORD_RESET',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    attempts: 0,
    usedAt: undefined as Date | undefined,
    save: async function () { return this; },
  };

  const mockUser = {
    id: '507f1f77bcf86cd799439011',
    email: 'resetuser@example.com',
    status: 'active',
    passwordResetTokenHash: undefined as string | undefined,
    passwordResetExpiresAt: undefined as Date | undefined,
    save: async function () { return this; },
  };

  Object.defineProperty(authRepository, 'findLatestOtp', {
    configurable: true,
    value: async () => mockOtpDoc,
  });

  Object.defineProperty(authRepository, 'findByEmail', {
    configurable: true,
    value: async () => mockUser,
  });

  const res = await authService.verifyOtp({ email: 'resetuser@example.com', otp: '654321' });
  assert.equal(res.success, true);
  assert.ok(res.resetToken);
  assert.equal(typeof res.resetToken, 'string');
  assert.equal(res.resetToken.length, 64, 'Raw reset token must be 32 bytes hex (64 chars)');

  // OTP was marked as used
  assert.ok(mockOtpDoc.usedAt instanceof Date);

  // User has stored hash of the reset token
  assert.ok(mockUser.passwordResetTokenHash);
  assert.equal(mockUser.passwordResetTokenHash.length, 64);
  assert.ok(mockUser.passwordResetExpiresAt);
  assert.ok(mockUser.passwordResetExpiresAt.getTime() > Date.now());
});

test('verifyOtp: invalid format rejects non-numeric or short codes with 400', async () => {
  await assert.rejects(
    authService.verifyOtp({ email: 'user@example.com', otp: '12345' }),
    { status: 400, code: 'INVALID_OTP_FORMAT' }
  );
  await assert.rejects(
    authService.verifyOtp({ email: 'user@example.com', otp: '12a456' }),
    { status: 400, code: 'INVALID_OTP_FORMAT' }
  );
});

test('verifyOtp: incorrect OTP increments attempts and returns 400 INVALID_OTP', async () => {
  const crypto = await import('crypto');
  const mockOtpDoc = {
    _id: 'otp_123',
    identifier: 'resetuser@example.com',
    hashedCode: crypto.createHash('sha256').update('123456').digest('hex'),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    attempts: 0,
    usedAt: undefined as Date | undefined,
    save: async function () { return this; },
  };

  Object.defineProperty(authRepository, 'findLatestOtp', {
    configurable: true,
    value: async () => mockOtpDoc,
  });

  await assert.rejects(
    authService.verifyOtp({ email: 'resetuser@example.com', otp: '999999' }),
    { status: 400, code: 'INVALID_OTP', message: 'The verification code is invalid. Please try again.' }
  );
  assert.equal(mockOtpDoc.attempts, 1);
});

test('verifyOtp: 5 failed attempts rejects with 400 TOO_MANY_ATTEMPTS', async () => {
  const crypto = await import('crypto');
  const mockOtpDoc = {
    _id: 'otp_123',
    identifier: 'resetuser@example.com',
    hashedCode: crypto.createHash('sha256').update('123456').digest('hex'),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    attempts: 4,
    usedAt: undefined as Date | undefined,
    save: async function () { return this; },
  };

  Object.defineProperty(authRepository, 'findLatestOtp', {
    configurable: true,
    value: async () => mockOtpDoc,
  });

  await assert.rejects(
    authService.verifyOtp({ email: 'resetuser@example.com', otp: '999999' }),
    { status: 400, code: 'TOO_MANY_ATTEMPTS', message: 'Too many attempts. Please request a new code.' }
  );
  assert.equal(mockOtpDoc.attempts, 5);

  // Subsequent call immediately returns TOO_MANY_ATTEMPTS even before hashing
  await assert.rejects(
    authService.verifyOtp({ email: 'resetuser@example.com', otp: '123456' }),
    { status: 400, code: 'TOO_MANY_ATTEMPTS' }
  );
});

test('verifyOtp: expired OTP rejects with 400 OTP_EXPIRED', async () => {
  const mockOtpDoc = {
    _id: 'otp_123',
    identifier: 'resetuser@example.com',
    hashedCode: 'some_hash',
    expiresAt: new Date(Date.now() - 1000), // expired
    attempts: 0,
    usedAt: undefined as Date | undefined,
  };

  Object.defineProperty(authRepository, 'findLatestOtp', {
    configurable: true,
    value: async () => mockOtpDoc,
  });

  await assert.rejects(
    authService.verifyOtp({ email: 'resetuser@example.com', otp: '123456' }),
    { status: 400, code: 'OTP_EXPIRED', message: 'This verification code has expired. Please request a new code.' }
  );
});

test('verifyOtp: already used OTP rejects with 400 OTP_ALREADY_USED', async () => {
  const mockOtpDoc = {
    _id: 'otp_123',
    identifier: 'resetuser@example.com',
    hashedCode: 'some_hash',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    attempts: 0,
    usedAt: new Date(Date.now() - 5000), // already used
  };

  Object.defineProperty(authRepository, 'findLatestOtp', {
    configurable: true,
    value: async () => mockOtpDoc,
  });

  await assert.rejects(
    authService.verifyOtp({ email: 'resetuser@example.com', otp: '123456' }),
    { status: 400, code: 'OTP_ALREADY_USED', message: 'This verification code has already been used. Please request a new code.' }
  );
});

test('resendOtp: enforces 30s cooldown per identifier returning 429 RATE_LIMITED', async () => {
  const recentOtpDoc = {
    createdAt: new Date(Date.now() - 10_000), // created 10s ago
  };

  Object.defineProperty(authRepository, 'findLatestOtp', {
    configurable: true,
    value: async () => recentOtpDoc,
  });

  await assert.rejects(
    authService.resendOtp({ email: 'user@example.com' }),
    { status: 429, code: 'RATE_LIMITED', message: 'Please wait 30 seconds before requesting another code.' }
  );
});

test('resendOtp: invalidates previous OTP, issues new OTP and returns generic message after cooldown', async () => {
  const oldOtpDoc = {
    createdAt: new Date(Date.now() - 35_000), // created 35s ago (> 30s cooldown)
  };

  Object.defineProperty(authRepository, 'findLatestOtp', {
    configurable: true,
    value: async () => oldOtpDoc,
  });

  const mockUser = {
    id: '507f1f77bcf86cd799439011',
    name: 'Reset Test User',
    email: 'resetuser@example.com',
    status: 'active',
  };

  Object.defineProperty(authRepository, 'findByEmail', {
    configurable: true,
    value: async () => mockUser,
  });

  let createdOtp: any = null;
  Object.defineProperty(authRepository, 'createOtp', {
    configurable: true,
    value: async (d: any) => { createdOtp = d; return d; },
  });

  let invalidated = false;
  Object.defineProperty(authRepository, 'invalidateActiveOtps', {
    configurable: true,
    value: async () => { invalidated = true; },
  });

  let mailSent: any = null;
  Object.defineProperty(mailService, 'sendPasswordResetOtpEmail', {
    configurable: true,
    value: async (d: any) => { mailSent = d; },
  });

  const res = await authService.resendOtp({ email: 'resetuser@example.com' });
  assert.equal(res.success, true);
  assert.equal(res.message, 'If an account exists, a verification code has been sent.');
  assert.equal(invalidated, true);
  assert.ok(createdOtp);
  assert.ok(mailSent);
});

test('resetPassword: valid reset token updates password, revokes all sessions, and prevents token reuse', async () => {
  const rawToken = 'test-secure-raw-token-12345678901234567890';
  const crypto = await import('crypto');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const mockUser = {
    id: '507f1f77bcf86cd799439011',
    name: 'Reset Test User',
    email: 'resetuser@example.com',
    status: 'active',
    passwordHash: 'old_hashed_password',
    tokenVersion: 1,
    passwordResetTokenHash: tokenHash as string | undefined,
    passwordResetExpiresAt: new Date(Date.now() + 15 * 60 * 1000) as Date | undefined,
    save: async function () { return this; },
  };

  let tokenStoredInDb: string | undefined = tokenHash;
  Object.defineProperty(authRepository, 'findByResetTokenHash', {
    configurable: true,
    value: async (hash: string) => (hash === tokenStoredInDb ? mockUser : null),
  });

  // 1. Successful reset using resetToken field
  const res = await authService.resetPassword({ resetToken: rawToken, newPassword: 'NewPassword123' });
  assert.equal(res.success, true);
  assert.equal(res.message, 'Your password has been reset successfully. Please log in with your new password.');

  // Password updated and hashed
  assert.notEqual(mockUser.passwordHash, 'old_hashed_password');
  // Reset fields cleared
  assert.equal(mockUser.passwordResetTokenHash, undefined);
  assert.equal(mockUser.passwordResetExpiresAt, undefined);
  // Session version bumped (all previous sessions revoked)
  assert.equal(mockUser.tokenVersion, 2);

  // 2. Token reuse rejected
  tokenStoredInDb = undefined;
  await assert.rejects(
    authService.resetPassword({ resetToken: rawToken, newPassword: 'AnotherPassword123' }),
    { status: 400, code: 'INVALID_RESET_TOKEN' },
    'Reusing the reset token must be rejected'
  );
});

test('resetPassword: works with legacy token parameter for backwards compatibility', async () => {
  const rawToken = 'legacy-token-parameter-test-1234567890';
  const crypto = await import('crypto');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const mockUser = {
    id: '507f1f77bcf86cd799439011',
    name: 'Reset Test User',
    email: 'resetuser@example.com',
    status: 'active',
    passwordHash: 'old_hashed_password',
    tokenVersion: 1,
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    save: async function () { return this; },
  };

  Object.defineProperty(authRepository, 'findByResetTokenHash', {
    configurable: true,
    value: async () => mockUser,
  });

  const res = await authService.resetPassword({ token: rawToken, newPassword: 'NewPassword123' });
  assert.equal(res.success, true);
  assert.equal(mockUser.tokenVersion, 2);
});

test('resetPassword: expired token or invalid token is rejected with 400', async () => {
  Object.defineProperty(authRepository, 'findByResetTokenHash', {
    configurable: true,
    value: async () => null,
  });

  await assert.rejects(
    authService.resetPassword({ resetToken: 'expired-or-invalid-token', newPassword: 'NewPassword123' }),
    { status: 400, code: 'INVALID_RESET_TOKEN', message: 'This password reset link is invalid or has expired.' }
  );
});


