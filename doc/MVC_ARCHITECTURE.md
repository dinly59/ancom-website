# MVC Architecture Documentation

## Overview

This project has been refactored to follow the **Model-View-Controller (MVC)** architectural pattern for better code organization, maintainability, and scalability.

## Architecture

### Directory Structure

```
js/
├── models/
│   └── ProductModel.js          # Data layer
├── views/
│   ├── NavigationView.js        # Navigation UI
│   ├── TableView.js             # Table rendering
│   └── CompareView.js           # Comparison view
└── controllers/
    ├── AppController.js         # Main app controller
    ├── TableController.js       # Table logic
    └── CompareController.js     # Comparison logic
```

## Components

### Model Layer (`models/`)

**ProductModel.js**
- Manages all data operations
- Fetches product list and individual products
- Handles data caching
- Provides utility methods for data formatting and filtering
- Methods:
  - `initialize()` - Load product list
  - `loadProduct(filename)` - Load single product with caching
  - `loadProducts(filenames)` - Load multiple products
  - `filterProductData(data, filterTerm)` - Filter products
  - `getField(obj, candidates)` - Smart field extraction
  - `formatNumber(value)` - Format numbers for display

### View Layer (`views/`)

**NavigationView.js**
- Handles view switching and navigation
- Updates active navigation links
- Methods:
  - `showView(viewName)` - Show specific view
  - `getCurrentView()` - Get current view from URL hash

**TableView.js**
- Renders product data tables
- Handles sorting and pagination UI
- Methods:
  - `render(data, filter)` - Render table with data
  - `showLoading()` - Display loading state
  - `showError(message)` - Display error state
  - `buildRows(data, filter)` - Build table rows
  - `sortRows(rows)` - Sort table data
  - `renderPagination(totalPages)` - Create pagination UI

**CompareView.js**
- Renders product comparison views
- Creates comparison charts using Chart.js
- Methods:
  - `render(productsData)` - Render comparison
  - `renderOverview(productsData)` - Overview table
  - `renderCharts(productsData)` - Strength charts
  - `prepareChartData(productsData)` - Process chart data

### Controller Layer (`controllers/`)

**AppController.js**
- Main application controller
- Initializes all models, views, and controllers
- Sets up routing
- Methods:
  - `initialize()` - Bootstrap application
  - `setupRouting()` - Configure hash-based routing
  - `handleRoute()` - Process route changes

**TableController.js**
- Controls table view interactions
- Handles filtering, sorting, pagination
- Methods:
  - `handleProductChange()` - Product selection
  - `handleFilterChange()` - Filter updates
  - `handleSort(columnIndex)` - Column sorting
  - `handlePrevPage()` / `handleNextPage()` - Pagination

**CompareController.js**
- Controls product comparison
- Manages comparison product selection
- Methods:
  - `handleCompare()` - Trigger comparison
  - `populateCompareSelects(products)` - Fill dropdowns

## Data Flow

```
User Action
    ↓
Controller (handles event)
    ↓
Model (fetches/processes data)
    ↓
Controller (receives data)
    ↓
View (renders UI)
    ↓
User sees result
```

## Benefits of MVC Architecture

1. **Separation of Concerns**: Each component has a single responsibility
2. **Maintainability**: Easier to find and fix bugs
3. **Testability**: Components can be tested independently
4. **Reusability**: Views and models can be reused
5. **Scalability**: Easy to add new features
6. **Team Collaboration**: Multiple developers can work on different layers

## How to Extend

### Adding a New View

1. Create a new view class in `js/views/`
2. Add rendering methods
3. Create a corresponding controller in `js/controllers/`
4. Register in AppController
5. Add HTML section in `index.html`

### Adding New Data Operations

1. Add methods to `ProductModel.js`
2. Use in controllers as needed
3. Views consume processed data

### Adding New Features

1. Identify which layer needs changes
2. Update Model if data operations needed
3. Update View if UI changes needed
4. Update Controller for new interactions
5. Wire everything in AppController

## Loading Order

Scripts must be loaded in this order (see `index.html`):

1. **Model** - ProductModel.js
2. **Views** - NavigationView.js, TableView.js, CompareView.js
3. **Controllers** - TableController.js, CompareController.js
4. **App** - AppController.js (initializes everything)

## Migration from Old Code

The old monolithic `main.js` has been split into focused modules:

- **Global state** → ProductModel (encapsulated)
- **Rendering functions** → View classes (TableView, CompareView)
- **Event handlers** → Controller classes (TableController, CompareController)
- **Initialization** → AppController

Original file backed up as `main.js.old`.
