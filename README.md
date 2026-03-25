# realestate-mcp

> **Disclaimer:** This tool provides estimates and suggestions for **informational purposes only**. It does not constitute professional real estate, legal, financial, tax, or architectural advice. Always consult a licensed real estate professional before making property decisions. All generated content (descriptions, floor plans, valuations, neighborhood data) must be verified independently. See [TERMS.md](./TERMS.md) and [PRIVACY.md](./PRIVACY.md).

MCP server for real estate agents — 3D virtual tours, SVG floor plans, AI-optimized property descriptions, staging suggestions, neighborhood analysis, and 3D model previews.

## Tools

| Tool | Description |
|---|---|
| `generate_floor_plan` | Generate an SVG floor plan from room dimensions and types |
| `create_virtual_tour` | Create an embeddable 3D virtual tour from room descriptions and photos |
| `property_description` | Generate optimized listings for MLS, social media, luxury, and investor audiences |
| `staging_suggestions` | Suggest virtual staging options with furniture, decor, placement, and cost estimates |
| `neighborhood_analysis` | Comprehensive neighborhood summary — walk score, schools, transit, demographics, safety, market |
| `render_property_preview` | Generate an embeddable 3D model-viewer HTML snippet with AR support |

## Quick start

### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "realestate-mcp": {
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
    "realestate-mcp": {
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
```

### Create a virtual tour

```
Create a virtual tour for "123 Main Street" with rooms:
- Living room with hardwood floors and bay window
- Modern kitchen with island and stainless appliances
- Master bedroom with walk-in closet
- Two guest bedrooms
- Updated bathroom with marble tiles
```

### Property description

```
Write a listing description for a 3BR/2BA house at 456 Oak Ave, Springfield.
1,800 sqft, built 1985, renovated condition, asking $350,000.
Features: hardwood floors, granite counters, fenced backyard.
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
npm test
npm run dev   # run with tsx (hot reload)
```

## Legal

- [LICENSE](./LICENSE) — MIT License
- [TERMS.md](./TERMS.md) — Terms of Service
- [PRIVACY.md](./PRIVACY.md) — Privacy Policy (no data collected)

## License

MIT — see [LICENSE](./LICENSE).
