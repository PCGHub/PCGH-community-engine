# Payment Domain — Models

Owns: `economy.credit_wallets`, `economy.credit_transactions` (the wallet/ledger subset of the Economy schema — see `docs/domain-architecture.md` for the full Economy split with Campaign Domain).

Uses: `api.wallet_summary_view`, `api.calculate_wallet_balance()`, `api.create_performance_bonus()` (shared with Intelligence Domain).

Source: `docs/economy-schema.md`, `docs/domain-architecture.md` ("Payment Domain").

Wallet crediting for performance bonuses is conditional on a recipient already having a wallet — member wallets are not part of the approved Economy Schema. This is already-implemented behavior in `api.create_performance_bonus()`, not a rule this domain introduces.

No logic here — type definitions only. See `app/services/payment/` for the Payment Application Service.
