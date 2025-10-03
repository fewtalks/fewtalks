import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured." }, { status: 500 });
  }

  const body = await request.text();
  const signature = headers().get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    const object = event.data.object as StripeEventObject;

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionUpdated(object);
        break;
      default:
        console.log("Unhandled webhook event", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook verification failed", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }
}

type StripeEventObject = {
  [key: string]: any;
};

async function handleCheckoutCompleted(session: StripeEventObject) {
  const subscriptionId = session.subscription as string | undefined;
  const customerId = session.customer as string | undefined;
  const clientReferenceId = session.client_reference_id as string | undefined;

  if (!clientReferenceId) {
    return;
  }

  await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        id: clientReferenceId,
        stripe_customer_id: customerId,
        plan: "paid",
        stripe_subscription_status: "active",
        remaining_free_runs: 999,
      },
      { onConflict: "id" }
    );

  if (subscriptionId) {
    await supabaseAdmin
      .from("profiles")
      .update({ stripe_subscription_id: subscriptionId })
      .eq("id", clientReferenceId);
  }
}

async function handleSubscriptionUpdated(subscription: StripeEventObject) {
  const customerId = subscription.customer as string | undefined;
  if (!customerId) {
    return;
  }

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (!data) {
    return;
  }

  const status = subscription.status as string | undefined;

  await supabaseAdmin
    .from("profiles")
    .update({
      stripe_subscription_status: status,
      plan: status === "active" || status === "trialing" ? "paid" : "free",
      remaining_free_runs: status === "active" || status === "trialing" ? 999 : 3,
    })
    .eq("id", data.id);
}

