import { stripe } from "../config/stripe.js";
import User from "../models/User.js";
import Payment from "../models/Payment.js";

const PLAN_CONFIG = {
  tutor: {
    price: 15,
    label: "Tutor",
    description: "Unlimited tuition posts & verified badge",
  },
  student: {
    price: 10,
    label: "Student",
    description: "Priority booking & premium support",
  },
};

const fulfillPayment = async (session) => {
  const { userId, userEmail, userRole, planName, amount } = session.metadata || {};
  if (!userId) return;

  const existingPayment = await Payment.findOne({ stripeSessionId: session.id });

  if (!existingPayment) {
    try {
      await Payment.create({
        userEmail: userEmail || session.customer_details?.email || "",
        userName: session.customer_details?.name || "User",
        userRole,
        planName,
        amount:
          Number(amount) || (session.amount_total ? session.amount_total / 100 : 0),
        currency: (session.currency || "usd").toUpperCase(),
        transactionId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id || session.id,
        stripeSessionId: session.id,
        paymentStatus: "paid",
      });
    } catch (error) {
      if (error?.code !== 11000) throw error;
    }
  }

  await User.findByIdAndUpdate(userId, { plan: "pro" });
};

// 1. Create Checkout Session
export const createCheckoutSession = async (req, res) => {
  try {
    const { planType } = req.body; // "tutor" or "student"
    const { email, role, userId } = req.user;

    if (!planType || !PLAN_CONFIG[planType]) {
      return res.status(400).json({ message: "Invalid plan type" });
    }

    if (role !== planType) {
      return res
        .status(400)
        .json({ message: `You are logged in as a ${role}, not a ${planType}` });
    }

    const clientUrl = (process.env.CLIENT_URL || "").replace(/\/+$/, "");
    if (!clientUrl) {
      return res.status(500).json({ message: "CLIENT_URL is not configured" });
    }

    const { price, label, description } = PLAN_CONFIG[planType];

    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Pro Plan - ${label}`,
              description,
            },
            unit_amount: price * 100, 
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        userId: String(userId),
        userEmail: email,
        userRole: role,
        planName: `${planType}-pro`,
        amount: price.toString(),
      },
      success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/payment/cancel`,
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
    if (!session_id) {
      return res.status(400).json({ message: "Session ID required" });
    }

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

// 4. Admin Payments List
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};