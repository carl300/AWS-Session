const express = require("express");
const app = express();
const { resolve } = require("path");
const port = process.env.PORT || 3000;

// Load environment variables
require("dotenv").config();

const api_key = process.env.SECRET_KEY;
const stripe = require("stripe")(api_key);

// ---------------- Prometheus Metrics ----------------
const client = require("prom-client");
const register = new client.Registry();

// Collect default Node.js + process metrics
client.collectDefaultMetrics({ register });
// ----------------------------------------------------

// ---------------- Prometheus Metrics Endpoint ----------------
// IMPORTANT: This MUST come BEFORE static middleware
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});
// --------------------------------------------------------------

// Parse JSON + URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setting up the static folder (AFTER /metrics)
app.use(express.static(resolve(__dirname, process.env.STATIC_DIR)));

// Home page
app.get("/", (req, res) => {
  const path = resolve(process.env.STATIC_DIR + "/index.html");
  res.sendFile(path);
});

// Success page
app.get("/success", (req, res) => {
  const path = resolve(process.env.STATIC_DIR + "/success.html");
  res.sendFile(path);
});

// Cancel page
app.get("/cancel", (req, res) => {
  const path = resolve(process.env.STATIC_DIR + "/cancel.html");
  res.sendFile(path);
});

// Workshop pages
app.get("/workshop1", (req, res) => {
  const path = resolve(process.env.STATIC_DIR + "/workshops/workshop1.html");
  res.sendFile(path);
});

app.get("/workshop2", (req, res) => {
  const path = resolve(process.env.STATIC_DIR + "/workshops/workshop2.html");
  res.sendFile(path);
});

app.get("/workshop3", (req, res) => {
  const path = resolve(process.env.STATIC_DIR + "/workshops/workshop3.html");
  res.sendFile(path);
});

// Stripe checkout session
const domainURL = process.env.DOMAIN;

app.post("/create-checkout-session/:pid", async (req, res) => {
  const priceId = req.params.pid;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${domainURL}/success?id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${domainURL}/cancel`,
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    allow_promotion_codes: true,
  });

  res.json({
    id: session.id,
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server listening on port: ${port}`);
  console.log(`You may access your app at: ${domainURL}`);
});
