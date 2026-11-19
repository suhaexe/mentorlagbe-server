import { stripe } from "../config/stripe.js";
import User from "../models/User.js";
import Payment from "../models/Payment.js";

// 1. Create Checkout Session
export const createCheckoutSession = async (req, res) => {
  try {
    const { planType } = req.body; // "tutor" or "student"
    const { email, role, userId } = req.user;

    if (role !== planType) {
      return res
        .status(400)
        .json({ message: `You are logged in as a ${role}, not a ${planType}` });
    }

    const price = planType === "tutor" ? 15 : 10;

    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Pro Plan - ${planType.charAt(0).toUpperCase() + planType.slice(1)}`,
              description:
                planType === "tutor"
                  ? "Unlimited tuition posts & verified badge"
                  : "Priority booking & premium support",
            },
            unit_amount: price * 100, // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      branding_settings: {
        display_name: "MentorLagbe",
      },
      metadata: {
        userId,
        userEmail: email,
        userRole: role,
        planName: `${planType}-pro`,
        amount: price.toString(),
      },
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Webhook Handler
export const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    await fulfillPayment(session);
  }

  res.json({ received: true });
};

// 3. Verification Endpoint (for Success Page fallback)
export const verifySession = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id)
      return res.status(400).json({ message: "Session ID required" });

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
      await fulfillPayment(session);
      res.json({ message: "Payment verified and account upgraded" });
    } else {
      res.status(400).json({ message: "Payment not completed" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to prevent duplicate logic
const fulfillPayment = async (session) => {
  const { userId, userEmail, userRole, planName, amount } = session.metadata;

  // Check if payment already recorded (idempotency)
  const existingPayment = await Payment.findOne({
    stripeSessionId: session.id,
  });
  if (existingPayment) return;

  // 1. Record Payment
  await Payment.create({
    userEmail,
    userName: session.customer_details?.name || "User",
    userRole,
    planName,
    amount: Number(amount),
    currency: "USD",
    transactionId: session.payment_intent,
    stripeSessionId: session.id,
    paymentStatus: "paid",
  });

  // 2. Upgrade User Plan
  await User.findByIdAndUpdate(userId, { plan: "pro" });
};

// Add this at the bottom of payments.controller.js
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ paidAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
