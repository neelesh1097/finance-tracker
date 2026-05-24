import { ExpenseCategory } from '@prisma/client';

interface CategorizationResult {
  category: ExpenseCategory;
  confidence: number;
}

export class CategorizationService {
  private rules: { patterns: string[]; category: ExpenseCategory; weight: number }[] = [
    {
      patterns: ['rent', 'landlord', 'monthly rent', 'pg rent', 'lease'],
      category: ExpenseCategory.Rent,
      weight: 1.0,
    },
    {
      patterns: ['blinkit', 'groceries', 'supermarket', 'walmart', 'instamart', 'swiggy', 'grocery', 'whole foods', 'costco', 'safeway', 'kroger', 'food', 'restaurant', 'cafe', 'starbucks', 'mcdonalds'],
      category: ExpenseCategory.Groceries,
      weight: 0.9,
    },
    {
      patterns: ['electricity', 'water board', 'gas bill', 'power', 'internet', 'broadband', 'comcast', 'at&t', 'verizon', 'wifi', 'electricity board', 'bescom', 'tneb', 'mseb'],
      category: ExpenseCategory.Utilities,
      weight: 1.0,
    },
    {
      patterns: ['uber', 'lyft', 'ola', 'rapido', 'grab', 'metro', 'subway', 'train', 'bus ticket', 'taxi', 'cab', 'toll', 'fuel', 'petrol', 'diesel'],
      category: ExpenseCategory.Transport,
      weight: 1.0,
    },
    {
      patterns: ['amazon', 'flipkart', 'target', 'ebay', 'aliexpress', 'zara', 'h&m', 'nike', 'adidas', 'clothing', 'shopping mall', 'retail', 'myntra', 'decathlon'],
      category: ExpenseCategory.Shopping,
      weight: 0.8,
    },
    {
      patterns: ['netflix', 'spotify', 'prime video', 'disney', 'hulu', 'hbo', 'cinema', 'theater', 'arcade', 'steam', 'playstation', 'xbox', 'concert', 'pub', 'club', 'bar'],
      category: ExpenseCategory.Entertainment,
      weight: 0.9,
    },
    {
      patterns: ['udemy', 'coursera', 'edx', 'tuition', 'school', 'university', 'college', 'textbook', 'course', 'training', 'tutorial'],
      category: ExpenseCategory.Education,
      weight: 1.0,
    },
    {
      patterns: ['hospital', 'pharmacy', 'clinic', 'dentist', 'medical', 'doctor', 'cvs', 'walgreens', 'boots', 'health insurance', 'physio', 'laboratory'],
      category: ExpenseCategory.Medical,
      weight: 1.0,
    },
    {
      patterns: ['hotel', 'airbnb', 'flight', 'airline', 'expedia', 'booking.com', 'makemytrip', 'holiday', 'travel agency', 'passport', 'visa'],
      category: ExpenseCategory.Travel,
      weight: 1.0,
    },
    {
      patterns: ['zerodha', 'groww', 'mutual fund', 'stocks', 'sip', 'etf', 'fidelity', 'vanguard', 'coinbase', 'binance', 'crypto', 'shares', 'investment'],
      category: ExpenseCategory.Investments,
      weight: 1.0,
    },
  ];

  categorize(description: string): CategorizationResult {
    const text = description.toLowerCase().trim();
    
    if (!text) {
      return { category: ExpenseCategory.Needs_Review, confidence: 0 };
    }

    let bestMatch: { category: ExpenseCategory; score: number } | null = null;

    for (const rule of this.rules) {
      for (const pattern of rule.patterns) {
        if (text.includes(pattern)) {
          // Calculate a simple score based on match position and pattern length
          const index = text.indexOf(pattern);
          const score = (pattern.length / text.length) * rule.weight * (1 / (index + 1));
          
          if (!bestMatch || score > bestMatch.score) {
            bestMatch = { category: rule.category, score };
          }
        }
      }
    }

    if (bestMatch && bestMatch.score > 0.05) {
      // Normalise confidence between 0.5 and 1.0 for positive matches
      const confidence = Math.min(0.5 + bestMatch.score, 1.0);
      return {
        category: bestMatch.category,
        confidence: Math.round(confidence * 100) / 100,
      };
    }

    return {
      category: ExpenseCategory.Needs_Review,
      confidence: 0.0,
    };
  }
}
