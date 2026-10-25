-- Wompi payments.
-- external_ref holds the reference we send to Wompi; the transaction only exists once the user pays.
-- amount is in cents of currency (Wompi's amount_in_cents).

ALTER TABLE purchases ADD COLUMN transaction_id TEXT;   -- Wompi transaction id, from the first event
ALTER TABLE purchases ADD COLUMN provider_status TEXT;  -- raw status: PENDING, APPROVED, DECLINED, VOIDED, ERROR
ALTER TABLE purchases ADD COLUMN payment_method TEXT;   -- CARD, PSE, NEQUI, BANCOLOMBIA_TRANSFER...
CREATE UNIQUE INDEX purchases_transaction ON purchases(provider, transaction_id);
