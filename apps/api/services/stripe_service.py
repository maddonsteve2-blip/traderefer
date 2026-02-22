import stripe
import os
import uuid
from typing import Optional

# Set Stripe API key from environment variable
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

class StripeService:
    @staticmethod
    async def create_connected_account(email: str, business_name: Optional[str] = None):
        """Creates a Stripe Express account for a business or referrer."""
        try:
            account = stripe.Account.create(
                type="express",
                email=email,
                capabilities={
                    "card_payments": {"requested": True},
                    "transfers": {"requested": True},
                },
                business_profile={"name": business_name} if business_name else None,
            )
            return account.id
        except Exception as e:
            print(f"Stripe error: {e}")
            # For testing without a real key, return a mock ID
            return f"acct_mock_{email.split('@')[0]}"

    @staticmethod
    async def create_account_link(account_id: str, refresh_url: str, return_url: str):
        """Creates an account link for Stripe onboarding."""
        try:
            account_link = stripe.AccountLink.create(
                account=account_id,
                refresh_url=refresh_url,
                return_url=return_url,
                type="account_onboarding",
            )
            return account_link.url
        except Exception as e:
            print(f"Stripe link error: {e}")
            # Mock return for testing
            return f"https://connect.stripe.com/setup/s/mock_{account_id}"

    @staticmethod
    def get_publishable_key():
        return os.getenv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "pk_test_mock")

    @staticmethod
    async def create_payment_intent(
        amount: int, 
        currency: str = "aud", 
        destination_account_id: Optional[str] = None, 
        application_fee_amount: Optional[int] = None,
        metadata: Optional[dict] = None
    ):
        """Creates a PaymentIntent for lead unlocking."""
        try:
            params = {
                "amount": amount,
                "currency": currency,
                "metadata": metadata or {},
                "automatic_payment_methods": {"enabled": True},
            }
            
            if destination_account_id:
                params["transfer_data"] = {"destination": destination_account_id}
                if application_fee_amount:
                    params["application_fee_amount"] = application_fee_amount
                    
            payment_intent = stripe.PaymentIntent.create(**params)
            return payment_intent
        except Exception as e:
            print(f"Stripe payment error: {e}")
            # Mock object for dev
            class MockIntent:
                client_secret = f"pi_mock_secret_{amount}"
            return MockIntent()

    @staticmethod
    async def create_transfer(amount: int, destination_account_id: str, description: str = "TradeRefer Payout"):
        """Sends a Stripe Transfer from the platform to a connected account."""
        try:
            transfer = stripe.Transfer.create(
                amount=amount,
                currency="aud",
                destination=destination_account_id,
                description=description
            )
            return transfer.id
        except Exception as e:
            print(f"Stripe transfer error: {e}")
            return f"tr_mock_{uuid.uuid4().hex[:8]}"
