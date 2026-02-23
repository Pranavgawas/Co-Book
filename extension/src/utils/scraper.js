// Remote Adapter Pattern - DOM Scraper Utility

export async function extractPropertyData(adapterRules) {
  const extractedData = {};

  for (const [key, rule] of Object.entries(adapterRules.selectors)) {
    let rawValue = null;

    if (rule.strategy === 'meta') {
      const el = document.querySelector(rule.path);
      if (el) rawValue = el.getAttribute(rule.attribute);
    } 
    else if (rule.strategy === 'dom') {
      let el = document.querySelector(rule.path);
      if (!el && rule.fallback) {
        el = document.querySelector(rule.fallback);
      }
      if (el) rawValue = el.innerText || el.textContent;
    }

    if (rawValue && rule.regexMatch) {
      let cleanedValue = rawValue;
      if (rule.removeChars) {
        rule.removeChars.forEach(char => {
          cleanedValue = cleanedValue.split(char).join('');
        });
      }
      
      const match = cleanedValue.match(new RegExp(rule.regexMatch));
      if (match) {
        extractedData[key] = parseInt(match[0], 10);
      }
    } else {
      extractedData[key] = rawValue;
    }
  }

  return extractedData;
}

// Temporary hardcoded ruleset for dev without backend fetch
export const airbnbRules = {
  "domain": "airbnb",
  "version": "1.0.0",
  "selectors": {
    "title": {
      "strategy": "meta",
      "path": "meta[property='og:title']",
      "attribute": "content"
    },
    "total_price": {
      "strategy": "dom",
      "path": "div[data-section-id='BOOK_IT_SIDEBAR'] span[data-testid='price-and-discounted-price']",
      "fallback": "span._1y74zjx", 
      "regexMatch": "[0-9]+",
      "removeChars": [",", "₹", "$"]
    }
  }
};
