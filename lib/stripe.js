import Stripe from 'stripe';

let stripe;

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!stripe) stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripe;
}

export function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export function appHost() {
  return process.env.NEXT_PUBLIC_APP_HOST || 'link.oryondigital.com';
}
