import urllib.request
import json
from decimal import Decimal
from django.core.cache import cache

FALLBACK_RATES = {
    'USD': 1.0, 'EUR': 0.92, 'GBP': 0.78, 'NGN': 1500.0,
    'CAD': 1.37, 'AUD': 1.50, 'JPY': 158.0, 'INR': 83.5,
    'GHS': 15.0, 'ZAR': 18.0, 'KES': 129.0, 'EGP': 47.8,
    'MAD': 10.0, 'AED': 3.67, 'CHF': 0.90, 'CNY': 7.25,
    'SGD': 1.35, 'BRL': 5.40, 'MXN': 18.40,
}

def get_exchange_rates():
    """Fetch current exchange rates from the API or return cached/fallback rates."""
    rates = cache.get('exchange_rates')
    if not rates:
        rates = FALLBACK_RATES.copy()
        try:
            with urllib.request.urlopen("https://open.er-api.com/v6/latest/USD", timeout=2) as response:
                api_data = json.loads(response.read().decode())
                api_rates = api_data.get("rates", {})
                for code in rates.keys():
                    if code in api_rates:
                        rates[code] = float(api_rates[code])
            # Cache for 12 hours
            cache.set('exchange_rates', rates, 3600 * 12)
        except Exception:
            # Fallback if connection fails
            pass
    return rates

def convert_currency(amount, from_curr, to_curr):
    """Convert an amount from one currency to another dynamically."""
    if amount is None:
        return Decimal('0.00')
    
    # Standardize inputs to string for safe Decimal conversion
    dec_amount = Decimal(str(amount))
    
    if from_curr == to_curr or dec_amount == Decimal('0.00'):
        return dec_amount
    
    rates = get_exchange_rates()
    from_rate = rates.get(from_curr, 1.0)
    to_rate = rates.get(to_curr, 1.0)
    
    # Calculate conversion factor: (USD to to_curr) / (USD to from_curr)
    factor = to_rate / from_rate
    
    return Decimal(str(round(float(dec_amount) * factor, 2)))
