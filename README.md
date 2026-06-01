# Anchor Product Table Viewer

A lightweight, zero-dependency web application for viewing anchor product specifications from JSON files in an interactive table format.

## Features

✅ **Interactive Data Table**

- Display anchor specifications with 16 columns
- Column sorting (click headers)
- Real-time filtering across all columns
- Row count display
- Responsive mobile layout

✅ **Performance**

- Client-side caching (no re-fetching)
- Fast sorting and filtering
- Lightweight (~5KB total)

✅ **UX Enhancements**

- Loading indicators
- Error handling with retry
- Clear filter button
- Auto-loads first product
- Keyboard accessible

## Quick Start

### Local Development

Start a local server from the project root:

**Python:**

```powershell
python -m http.server 5173
```

**Node.js:**

```powershell
npx http-server -p 5173
```

Then open http://localhost:5173

### Project Structure

```
compare-demo/
├── index.html          # Main HTML structure
├── style.css           # Responsive styling
├── main.js             # Application logic
├── data/               # JSON product files
│   ├── SST-Bolt-2-(Carbon-Steel).json
│   ├── SST-STB2.json
│   └── README.md
└── README.md           # This file
```

## Usage

1. **Select Product**: Choose a product from the dropdown
2. **Load**: Click "Load" to view the data table
3. **Filter**: Type in the filter box to search across all columns
4. **Sort**: Click any column header to sort (click again to reverse)
5. **Clear**: Click "✕" to reset filter and sorting

## Adding New Products

1. Add your JSON file to the `data/` folder
2. Update `PRODUCTS` array in `main.js`:
   ```javascript
   const PRODUCTS = [
     "SST-Bolt-2-(Carbon-Steel).json",
     "SST-STB2.json",
     "Your-New-Product.json", // Add here
   ];
   ```

## JSON Format

The viewer supports nested anchor specification data:

```json
{
  "name": "Product Name",
  "company": "Company Name",
  "diameters": [
    {
      "Anchor Size": {
        "value": "1/4\"",
        "Drill Bit Diameter": "1/4\"",
        "Effective Embedment Depth (hef)": [
          {
            "value": 1.5,
            "Nominal Embedment Depth (hnom)": 1.75,
            "Tension Steel Strength (fNsa)": 1669,
            ...
          }
        ]
      }
    }
  ]
}
```

## Architecture

**Plain Static Web** (HTML/CSS/JS)

- No build tools required
- No dependencies
- Vanilla JavaScript ES6 modules
- Deploy anywhere (Netlify, Vercel, GitHub Pages, etc.)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Deployment

### Netlify

```powershell
# Drag & drop the folder to Netlify
```

### GitHub Pages

```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
# Enable Pages in repo settings
```

### Vercel

```powershell
vercel deploy
```

## Performance Notes

- Renders 100+ rows instantly
- Sorting and filtering are client-side (no network delay)
- Data cached after first load
- Mobile-optimized with responsive table layout

## License

MIT
# ancom-website
