import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { authRepository } from './auth.repository';
import { authService } from './auth.service';
import { parseBody, registerSchema, type RegisterInput } from './auth.validation';
import { mailService } from '../../services/mail.service';
import { UserModel } from '../../models/User';

const originalExists = Object.getOwnPropertyDescriptor(authRepository, 'existsByEmailOrPhone');
const originalCreate = Object.getOwnPropertyDescriptor(authRepository, 'create');
const originalSendAccountCreatedEmail = Object.getOwnPropertyDescriptor(mailService, 'sendAccountCreatedEmail');
const originalConsoleError = console.error;

afterEach(() => {
  if (originalExists) Object.defineProperty(authRepository, 'existsByEmailOrPhone', originalExists);
  if (originalCreate) Object.defineProperty(authRepository, 'create', originalCreate);
  if (originalSendAccountCreatedEmail) Object.defineProperty(mailService, 'sendAccountCreatedEmail', originalSendAccountCreatedEmail);
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
  password: 'StrongPassword123',
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
