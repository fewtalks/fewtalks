import Stripe from "stripe";

let stripe: any;

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("Stripe secret key is not configured. Please add STRIPE_SECRET_KEY to .env.local");
  // Return a mock client for development
  stripe = {
    checkout: {
      sessions: {
        create: () => Promise.resolve({ url: "https://checkout.stripe.com/mock" }),
      },
    },
    billingPortal: {
      sessions: {
        create: () => Promise.resolve({ url: "https://billing.stripe.com/mock" }),
      },
    },
    webhooks: {
      constructEvent: () => ({ type: "mock.event", data: { object: {} } }),
    },
  };
} else {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-12-18.acacia",
  });
}

export { stripe };

