import { ExchangeRates } from '../types';

export const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
  baseCurrency: 'USD',
  rates: {
    USD: 1.0,
    EUR: 0.92,
    GBP: 0.78,
    SAR: 3.75,
    AED: 3.67,
    PKR: 279.5,
    INR: 86.4,
    QAR: 3.64,
    KWD: 0.31,
    OMR: 0.385,
    CAD: 1.38,
    AUD: 1.54,
    CNY: 7.24,
    JPY: 154.5,
  },
  lastUpdated: new Date().toISOString(),
};

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'SAR', symbol: 'SR', name: 'Saudi Riyal' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'QAR', symbol: 'QR', name: 'Qatari Riyal' },
  { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar' },
  { code: 'OMR', symbol: 'OMR', name: 'Omani Rial' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
];

/**
 * Converts an amount from source currency to target currency using base currency exchange rates.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRates: ExchangeRates = DEFAULT_EXCHANGE_RATES
): number {
  if (fromCurrency === toCurrency) return amount || 0;
  if (!amount || isNaN(amount)) return 0;

  const rates = exchangeRates?.rates || DEFAULT_EXCHANGE_RATES.rates;
  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;

  // Convert to USD (base) first, then to target currency
  const amountInBase = amount / fromRate;
  const converted = amountInBase * toRate;
  return Math.round(converted * 100) / 100;
}

export function formatCurrency(
  amount: number,
  currencyCode: string,
  options: { includeCode?: boolean; decimals?: number } = {}
): string {
  const decimals = options.decimals ?? 2;
  const curr = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode);
  const symbol = curr ? curr.symbol : (currencyCode || '$');
  
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount || 0);

  if (options.includeCode) {
    return currencyCode ? `${symbol} ${formattedNumber} (${currencyCode})` : `${symbol} ${formattedNumber}`;
  }
  return `${symbol} ${formattedNumber}`;
}
