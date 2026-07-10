export interface FormatterOptions {
  locale?: string;
  useSymbol?: boolean;
}

export class CurrencyFormatter {
  private locale: string;

  constructor(locale: string = "en-US") {
    this.locale = locale;
  }

  /**
   * Formats a numeric value as currency.
   * Default: "1,234.56 USD"
   * With symbol: "$1,234.56"
   */
  public format(
    value: number,
    currencyCode: string,
    options: FormatterOptions = {},
  ): string {
    const { useSymbol = false } = options;

    const formatter = new Intl.NumberFormat(this.locale, {
      style: useSymbol ? "currency" : "decimal",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const formattedNumber = formatter.format(value);

    // If the user wants the 3-letter code appended specifically
    return useSymbol ? formattedNumber : `${formattedNumber} ${currencyCode}`;
  }

  // Static helper for quick access without instantiation
  static quickFormat(value: number, currencyCode: string): string {
    return new CurrencyFormatter().format(value, currencyCode);
  }
}
