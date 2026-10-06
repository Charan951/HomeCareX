import assert from 'node:assert/strict';
import { test } from 'node:test';
import { accountCreatedEmail, accountCreatedUrls, getProfilePath, getRoleDisplayName } from './mail.templates';

const LOGIN_URL = 'https://homecarex.example/login';
const PROFILE_URL = 'https://homecarex.example/customer/profile';
const CREATED_AT = new Date('2026-10-05T08:00:00.000Z');

test('account-created email includes safe, escaped account details and both URLs', () => {
  const email = accountCreatedEmail({
    name: 'Alex <Customer>',
    email: 'alex&test@example.com',
    role: 'customer',
    createdAt: CREATED_AT,
    loginUrl: LOGIN_URL,
    profileUrl: PROFILE_URL,
  });

  assert.equal(email.subject, 'Welcome to HomeCareX — Your account has been created');
  assert.match(email.html, /Alex &lt;Customer&gt;/);
  assert.match(email.html, /alex&amp;test@example\.com/);
  assert.match(email.html, /Customer/);
  assert.match(email.html, /Oct 5, 2026/);
  assert.match(email.html, new RegExp(LOGIN_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(email.html, new RegExp(PROFILE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.ok(email.text.includes(LOGIN_URL));
  assert.ok(email.text.includes(PROFILE_URL));
  assert.ok(email.text.includes('alex&test@example.com'));
  assert.ok(email.text.includes('Customer'));
  assert.ok(email.text.includes('Oct 5, 2026'));

  for (const content of [email.html, email.text]) {
    for (const forbidden of ['password', 'passwordHash', 'accessToken', 'refreshToken', 'JWT', 'hcx_refresh', 'tokenVersion']) {
      assert.equal(content.toLowerCase().includes(forbidden.toLowerCase()), false, `Email contains ${forbidden}`);
    }
  }
});

test('account-created URLs follow configured frontend base paths and actual role routes', () => {
  assert.deepEqual(accountCreatedUrls('customer', 'https://homecarex.example'), {
    loginUrl: 'https://homecarex.example/login',
    profileUrl: 'https://homecarex.example/customer/profile',
  });
  assert.deepEqual(accountCreatedUrls('partner', 'https://homecarex.example/app/'), {
    loginUrl: 'https://homecarex.example/app/login',
    profileUrl: 'https://homecarex.example/app/partner/profile',
  });
  assert.deepEqual(accountCreatedUrls('admin', 'https://homecarex.example/'), {
    loginUrl: 'https://homecarex.example/login',
    profileUrl: 'https://homecarex.example/admin/profile',
  });
});

test('role labels are customer-friendly and profile paths use existing routes', () => {
  assert.equal(getRoleDisplayName('customer'), 'Customer');
  assert.equal(getRoleDisplayName('partner'), 'Partner');
  assert.equal(getRoleDisplayName('admin'), 'Administrator');
  assert.equal(getProfilePath('customer'), '/customer/profile');
  assert.equal(getProfilePath('partner'), '/partner/profile');
  assert.equal(getProfilePath('admin'), '/admin/profile');
});
