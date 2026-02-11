import { loadStripe } from '@stripe/stripe-js';

let stripePromise: ReturnType<typeof loadStripe> | null = null;

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '');
  }
  return stripePromise;
}

/**
 * Redirect to Stripe Checkout for Pro subscription.
 *
 * NOTE: In production, you'd create a Checkout Session on your backend and
 * redirect using the session URL. For the MVP without a backend, configure a
 * Stripe Payment Link in the dashboard and set VITE_STRIPE_PAYMENT_LINK to
 * its URL. The client_reference_id query param links the payment to the user.
 */
export function redirectToCheckout(userId: string) {
  const paymentLink = import.meta.env.VITE_STRIPE_PAYMENT_LINK;
  if (!paymentLink) {
    throw new Error('VITE_STRIPE_PAYMENT_LINK is not configured');
  }

  const url = new URL(paymentLink);
  url.searchParams.set('client_reference_id', userId);
  window.location.href = url.toString();
}
