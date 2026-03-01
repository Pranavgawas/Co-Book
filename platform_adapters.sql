CREATE TABLE IF NOT EXISTS platform_adapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain TEXT UNIQUE NOT NULL,
  version TEXT NOT NULL,
  selectors JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Airbnb rules
INSERT INTO platform_adapters (domain, version, selectors)
VALUES (
  'airbnb',
  '1.0.0',
  '{
    "title": {
      "strategy": "meta",
      "path": "meta[property=''og:title'']",
      "attribute": "content"
    },
    "total_price": {
      "strategy": "dom",
      "path": "div[data-section-id=''BOOK_IT_SIDEBAR''] span._1y74zjx",
      "fallback": "span._1y74zjx, span[data-testid=''price-and-discounted-price''] span, span.u174bpcy, span.a8jt5op", 
      "regexMatch": "[0-9.,]+",
      "removeChars": [",", "₹", "$", " ", "for", "nights", "night", "total", "\n"]
    }
  }'::jsonb
)
ON CONFLICT (domain) DO UPDATE 
SET selectors = EXCLUDED.selectors, version = EXCLUDED.version;

-- MakeMyTrip rules
INSERT INTO platform_adapters (domain, version, selectors)
VALUES (
  'makemytrip',
  '1.0.0',
  '{
    "title": {
      "strategy": "dom",
      "path": "h1#det_hotel_name",
      "fallback": "h1.hotelName, .hp-hotel-name"
    },
    "total_price": {
      "strategy": "dom",
      "path": "#revpg_total_payable_amt",
      "fallback": ".totalPayableAmt, #total_price_id, .price_breakup_total_amount",
      "regexMatch": "[0-9.,]+",
      "removeChars": [",", "₹", "$", " ", "total", "payable", "\n"]
    }
  }'::jsonb
)
ON CONFLICT (domain) DO UPDATE 
SET selectors = EXCLUDED.selectors, version = EXCLUDED.version;

