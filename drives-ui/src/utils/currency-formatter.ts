export interface FormatterOptions {
  locale?: string;
  withSymbol?: boolean;
}

export class CurrencyFormatter {
  private readonly locale: string;

  constructor(locale: string = "en-US") {
    this.locale = locale;
  }

  /**
   * Formats a numeric value as currency.
   * Default: "1,234.56 USD"
   * With symbol: "$1,234.56"
   * Without a currency code: "1,234.56"
   */
  public format(
    value: number,
    currencyCode?: string,
    options: FormatterOptions = {},
  ): string {
    const { withSymbol = false } = options;

    if (!currencyCode) {
      return new Intl.NumberFormat(this.locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    }

    const formatter = new Intl.NumberFormat(this.locale, {
      style: withSymbol ? "currency" : "decimal",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const formattedNumber = formatter.format(value);

    // If the user wants the 3-letter code appended specifically
    return withSymbol ? formattedNumber : `${formattedNumber} ${currencyCode}`;
  }

  // Static helper for quick access without instantiation
  static quickFormat(value: number, currencyCode?: string): string {
    return new CurrencyFormatter().format(value, currencyCode);
  }
}
