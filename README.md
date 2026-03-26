# realestate-mcp v2.0.0

> **Disclaimer:** This tool provides estimates and suggestions for **informational purposes only**. It does not constitute professional real estate, legal, financial, tax, or architectural advice. Always consult a licensed real estate professional before making property decisions. All generated content (descriptions, floor plans, valuations, neighborhood data) must be verified independently. See [TERMS.md](./TERMS.md) and [PRIVACY.md](./PRIVACY.md).

MCP server for real estate agents — 8 tools covering floor plans, virtual tours, property descriptions (EN/FR), price estimation, property comparison, staging suggestions, neighborhood analysis, and 3D previews.

## What's new in v2.0.0

- **`estimate_price`** — rough property price estimation with comparables, price factors, and confidence scoring
- **`compare_properties`** — side-by-side comparison of 2-5 properties with weighted scores and recommendations
- **Multi-language** — `property_description` now supports English and French
- **SEO output** — property descriptions include SEO title, meta description, JSON-LD structured data, and character counts
- **Improved floor plans** — scale bar, room type legend, dimension arrows, imperial/metric toggle, new room types (storage, laundry, balcony)
- **Improved virtual tours** — smooth transitions, fullscreen mode, touch/swipe navigation, progress bar, photo gallery
- **91 tests** covering all tools

## Tools

| Tool | Description |
|---|---|
| `generate_floor_plan` | SVG floor plan with room labels, dimensions, area (m2/sqft), legend, scale bar, compass |
| `create_virtual_tour` | Embeddable HTML virtual tour with transitions, fullscreen, keyboard/touch navigation |
| `property_description` | Listing descriptions in EN or FR — MLS, social, luxury, investor + SEO + JSON-LD |
| `estimate_price` | Property price estimation with price range, confidence, factors, and comparable sales |
| `compare_properties` | Side-by-side comparison table with scores, pros/cons, and recommendation |
| `staging_suggestions` | Virtual staging recommendations — furniture, decor, placement, cost estimates |
| `neighborhood_analysis` | Walk score, schools, transit, amenities, demographics, safety, market context |
| `render_property_preview` | 3D model-viewer HTML with AR support and annotation hotspots |

## Quick start

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "realestate": {
      "command": "npx",
      "args": ["realestate-mcp"]
    }
  }
}
```

### With an API key (optional)

```json
{
  "mcpServers": {
    "realestate": {
      "command": "npx",
      "args": ["realestate-mcp"],
      "env": {
        "REALESTATE_MCP_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Examples

### Generate a floor plan

```
Generate a floor plan for a 2-bedroom apartment:
- Living room: 5m x 4m
- Kitchen: 3m x 3m
- Bedroom 1: 4m x 3.5m
- Bedroom 2: 3.5m x 3m
- Bathroom: 2.5m x 2m
- Balcony: 3m x 1.5m
Use modern style with metric units.
```

### Estimate a property's price

```
Estimate the price for a 3BR/2BA house at 456 Oak Ave, San Francisco, CA.
2,000 sqft, built 2015, good condition, with hardwood floors and a pool.
```

### Compare properties

```
Compare these 3 properties for me:
1. "Oak House" — 123 Oak St, $400,000, 3BR/2BA, 2,000 sqft, 2015, good condition
2. "Elm Condo" — 456 Elm Ave, $300,000, 2BR/1BA, 1,200 sqft, 2020, new construction
3. "Maple Town" — 789 Maple Dr, $350,000, 3BR/2BA, 1,800 sqft, 2018, renovated
Priority: value and size.
```

### Create a virtual tour

```
Create a virtual tour for "123 Main Street, Springfield" with rooms:
- Living room with hardwood floors and bay window
- Modern kitchen with island and stainless appliances
- Master bedroom with walk-in closet
- Updated bathroom with marble tiles
Agent: Jane Smith, 555-1234.
```

### Property description (French)

```
Write a French listing description for a 4-bedroom house at
15 Rue de la Paix, Lyon. 180 m2, renovated, asking 650,000 EUR.
Features: parquet, chemin\u00E9e, jardin.
```

### Property description (English with SEO)

```
Write a listing description for a 3BR/2BA house at 456 Oak Ave, Springfield.
1,800 sqft, built 1985, renovated condition, asking $350,000.
Features: hardwood floors, granite counters, fenced backyard.
Include SEO keywords and JSON-LD structured data.
```

### Staging suggestions

```
What staging would you suggest for an empty living room?
Modern style, medium budget, targeting young professionals.
```

### Neighborhood analysis

```
What's the neighborhood like around 789 Elm Drive, Portland, OR?
Focus on schools, transit, and safety.
```

### 3D property preview

```
Create a 3D preview for "Luxury Villa" using the model at
https://example.com/villa.glb with AR enabled.
```

## Pricing

| Tier | Requests | Price |
|---|---|---|
| Free | 50/month | $0 |
| Pro | Unlimited | $19/month |

## Development

```bash
npm install
npm run build
npm test        # 91 tests across 9 test files
npm run dev     # run with tsx (hot reload)
```

## Legal

- [LICENSE](./LICENSE) -- MIT License
- [TERMS.md](./TERMS.md) -- Terms of Service
- [PRIVACY.md](./PRIVACY.md) -- Privacy Policy (no data collected)

## License

MIT -- see [LICENSE](./LICENSE).
