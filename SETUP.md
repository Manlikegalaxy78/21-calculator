# Rangefinder — setup & test guide

This is a real Next.js app: Supabase handles accounts, Stripe handles payments.
Everything below uses **test mode** — no real card is ever charged until you
deliberately flip to live keys at the very end.

## 1. Supabase — accounts & database

1. In your Supabase project: **SQL Editor -> New query**, paste the contents
   of `supabase/schema.sql`, and run it. This creates the `entitlements`
   table (who's paid, for what plan) with row-level security so a user can
   only ever read their *own* row — never write it directly, which stops
   someone unlocking themselves for free by editing a browser request.
2. **Project Settings -> API** — copy:
   - `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key -> `SUPABASE_SERVICE_ROLE_KEY` (keep this one secret —
     it bypasses row-level security and is only ever used server-side)
3. **Authentication -> Providers -> Email** — for testing, turn OFF "Confirm
   email" so sign-up logs you straight in without needing to click a
   confirmation link. Turn it back ON before you launch for real.

## 2. Stripe — payments (test mode)

1. Make sure the toggle in the Stripe Dashboard says **Test mode**.
2. **Product catalog -> Add product**, create two:
   - "Rangefinder Monthly" — recurring price, £5.99/month
   - "Rangefinder Lifetime" — one-time price, £19.99
   Copy each Price ID (starts `price_...`) into `STRIPE_PRICE_MONTHLY` /
   `STRIPE_PRICE_LIFETIME`.
3. **Developers -> API keys** — copy the **test** Publishable and Secret
   keys into `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY`.
4. Install the [Stripe CLI](https://docs.stripe.com/stripe-cli) and run:
   ```
   stripe login
   stripe listen --forward-to localhost:3000/api/webhook
   ```
   This prints a `whsec_...` value — put that in `STRIPE_WEBHOOK_SECRET`.
   Keep this command running in its own terminal the whole time you're
   testing; it's what lets Stripe tell your local app "this person paid."

## 3. Run it

```
cp .env.local.example .env.local   # then fill in the real values above
npm install
npm run dev
```
Open http://localhost:3000 on your computer, or find your computer's local
IP (e.g. `192.168.1.23`) and open `http://192.168.1.23:3000` on your phone,
on the same wifi, to test the "on your phone" experience for real.

## 4. Test the full money flow

1. Go to `/signup`, create an account, pick **Monthly**.
2. Stripe's checkout page appears — pay with the test card `4242 4242 4242
   4242`, any future expiry date, any CVC, any postcode.
3. Watch the terminal running `stripe listen` — you should see
   `checkout.session.completed` come through.
4. You should land back on `/app` and see the actual calculator, not the
   paywall — that confirms the whole chain worked: Stripe took the "payment"
   -> webhook fired -> Supabase `entitlements` row got marked active -> the
   app checked it and let you in.
5. In Supabase, check **Table Editor -> entitlements** — you should see your
   row with `plan: monthly`, `status: active`.
6. Try a **declined** test card too (`4000 0000 0000 0002`) to confirm the
   app correctly does NOT unlock on a failed payment.
7. Try `/logout`, then `/signin` again with the same account — you should
   go straight to the calculator without paying again (this is what proves
   the "your account remembers you're paid" part actually works, not just
   the checkout flow in isolation).
8. Test **Lifetime** the same way with a second test account.

## 5. Going live (only once everything above passes)

1. Recreate the two Products/Prices in Stripe's **live mode** (test-mode
   products don't carry over) and swap in live Price IDs.
2. Swap `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` for the
   live versions.
3. Add a **live** webhook endpoint in the Stripe Dashboard (Developers ->
   Webhooks -> Add endpoint) pointing at
   `https://yourdomain.com/api/webhook`, subscribed to at least:
   `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted`. Copy its signing secret into
   `STRIPE_WEBHOOK_SECRET` on your production host.
4. Turn Supabase email confirmation back on.
5. Deploy (Vercel is the natural fit for a Next.js app like this — connect
   your GitHub repo, paste in the same env vars via its dashboard).
6. Do ONE real test purchase yourself with a real card before telling
   anyone else it's live, and refund it afterwards from the Stripe
   Dashboard.
