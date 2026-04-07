import crypto from 'node:crypto';
import { chromium } from 'playwright';
import { expect } from '@playwright/test';

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const API_KEY = getRequiredEnv('MAILCHIMP_API_KEY');
const SERVER_PREFIX = getRequiredEnv('MAILCHIMP_SERVER_PREFIX');
const AUDIENCE_ID = getRequiredEnv('MAILCHIMP_AUDIENCE_ID');
const PROD_SIGNUP_URL = getRequiredEnv('PROD_SIGNUP_URL');
const TEST_EMAIL_DOMAIN = getRequiredEnv('MAILCHIMP_HEALTHCHECK_EMAIL_DOMAIN');

const BASE_URL = `https://${SERVER_PREFIX}.api.mailchimp.com/3.0`;
const testEmail = `healthcheck+${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)}@${TEST_EMAIL_DOMAIN}`.toLowerCase();
const subscriberHash = crypto.createHash('md5').update(testEmail).digest('hex');

async function mailchimpRequest(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `apikey ${API_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  let body = null;
  const text = await response.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }

  if (!response.ok) {
    const detail = body?.detail || body?.title || JSON.stringify(body);
    throw new Error(`Mailchimp API ${response.status} for ${path}: ${detail}`);
  }

  return body;
}

async function archiveMember() {
  await mailchimpRequest(`/lists/${AUDIENCE_ID}/members/${subscriberHash}`, {
    method: 'DELETE',
  });
}

async function submitViaBrowser() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto(PROD_SIGNUP_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    const form = page.locator('form#mc-embedded-subscribe-form, form#myForm, form.email-form').first();
    await form.waitFor({ timeout: 15000 });

    const emailInput = page.locator('input[type="email"], input[name="EMAIL"], #mce-EMAIL').first();
    await emailInput.fill(testEmail);

    const submitButton = page.locator('button[type="submit"], input[type="submit" ], #mc-embedded-subscribe').first();
    await submitButton.click();
    
    await expect(page).toHaveURL(/https:\/\/gmail.us22.list-manage.com\/subscribe\/post/)
    await expect(page.getByText('Your subscription to our list has been confirmed.')).toBeVisible();

    console.log('Submitted signup form via production website.');
  } catch (e) {
    console.error(e.message);
  } finally {
    await browser.close();
  }
}

async function verifyMemberExists() {
  const timeoutMs = 120000;
  const intervalMs = 5000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      const member = await mailchimpRequest(`/lists/${AUDIENCE_ID}/members/${subscriberHash}`);
      if (member?.email_address?.toLowerCase() === testEmail) {
        console.log(`Verified member exists with status: ${member.status}`);
        return;
      }
    } catch (error) {
      if (!String(error.message).includes('Mailchimp API 404')) {
        throw error;
      }
    }

    await sleep(intervalMs);
  }

  throw new Error(`Member did not appear in audience within ${timeoutMs / 1000} seconds.`);
}

async function verifyMemberArchived() {
  try {
    await mailchimpRequest(`/lists/${AUDIENCE_ID}/members/${subscriberHash}`);
    throw new Error('Cleanup verification failed: test member still present after archive.');
  } catch (error) {
    if (String(error.message).includes('Mailchimp API 404')) {
      console.log('Verified member cleanup (member is no longer retrievable).');
      return;
    }
    throw error;
  }
}

async function run() {
  console.log(`Starting browser-based Mailchimp health check for ${testEmail}`);
  await submitViaBrowser();
  await verifyMemberExists();
  await archiveMember();
  console.log('Archived test member.');
  await verifyMemberArchived();
  console.log('Health check completed successfully.');
}

run().catch(async (error) => {
  console.error(`Health check failed: ${error.message}`);

  try {
    await archiveMember();
    console.error('Cleanup attempt after failure succeeded.');
  } catch {
    console.error('Cleanup attempt after failure was not successful.');
  }

  process.exit(1);
});
