# Tailwind CSS v4 Documentation

## Installation

Tailwind CSS v4 uses a new import-based approach:

```css
@import "tailwindcss";
```

## Dark Mode

### Class-Based Dark Mode

Override dark variant to use a `.dark` class:

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));
```

```html
<html class="dark">
  <body>
    <div class="bg-white dark:bg-black">
      <!-- ... -->
    </div>
  </body>
</html>
```

### Data Attribute Dark Mode

Use `data-theme` attribute:

```css
@import "tailwindcss";

@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
```

```html
<html data-theme="dark">
  <body>
    <div class="bg-white dark:bg-black">
      <!-- ... -->
    </div>
  </body>
</html>
```

### Media Query Dark Mode (Default)

Dark mode based on system preference:

```html
<div class="bg-white dark:bg-gray-800">
  <h1 class="text-gray-900 dark:text-white">Dark mode</h1>
  <p class="text-gray-500 dark:text-gray-300">Content</p>
</div>
```

Generated CSS:

```css
.dark\:bg-gray-800 {
  @media (prefers-color-scheme: dark) {
    background-color: var(--color-gray-800);
  }
}
```

## Utility Classes

### Basic Usage

```html
<div class="bg-white dark:bg-gray-800 rounded-lg px-6 py-8 shadow-xl">
  <h3 class="text-gray-900 dark:text-white mt-5 text-base font-medium">
    Title
  </h3>
  <p class="text-gray-500 dark:text-gray-400 mt-2 text-sm">
    Description
  </p>
</div>
```

### State Variants

```html
<button class="bg-sky-500 hover:bg-sky-700 active:bg-sky-900 disabled:opacity-50">
  Save changes
</button>
```

Generated CSS:

```css
.hover\:bg-sky-700 {
  &:hover {
    background-color: var(--color-sky-700);
  }
}
```

### Complex Variants

Combine multiple variants:

```html
<button class="dark:lg:data-current:hover:bg-indigo-600">
  <!-- ... -->
</button>
```

## Custom Utilities

### Define Custom Utility (v4)

Use `@utility` directive:

```css
@import "tailwindcss";

@utility tab-4 {
  tab-size: 4;
}
```

### Customize Container

```css
@utility container {
  margin-inline: auto;
  padding-inline: 2rem;
}
```

## Custom Variants

### Apply Custom Variants

```html
<html data-theme="midnight">
  <button class="theme-midnight:bg-black"></button>
</html>
```

## Typography

### Dark Mode Typography

With typography plugin:

```html
<body class="bg-white dark:bg-gray-900">
  <article class="prose dark:prose-invert">
    {{ markdown }}
  </article>
</body>
```

## Form Elements

### Custom Select

```jsx
<div className="grid">
  <svg
    className="pointer-events-none relative right-1 z-10 col-start-1 row-start-1 h-4 w-4 self-center justify-self-end"
    viewBox="0 0 16 16"
    fill="currentColor"
  >
    <path d="..." />
  </svg>
  <select className="col-start-1 row-start-1 w-20 appearance-none rounded-lg border border-gray-300 bg-gray-50 px-2 text-gray-700 hover:border-cyan-500 hover:bg-white dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-cyan-700 dark:hover:bg-gray-700">
    <option>Yes</option>
    <option>No</option>
    <option>Maybe</option>
  </select>
</div>
```

## Gradients

### Gradient Variants

In v4, variant overrides preserve gradient values:

```html
<div class="bg-gradient-to-r from-red-500 to-yellow-400 dark:from-blue-500">
  <!-- ... -->
</div>
```

## Composing Variants

### Group and Has Variants

```html
<div class="group">
  <div class="group-has-focus:opacity-100">
    <!-- ... -->
  </div>
</div>
```

## Important Flag

Mark all utilities as important:

```css
@import "tailwindcss" important;
```

## JavaScript Toggle Dark Mode

```js
// On page load or when changing themes
document.documentElement.classList.toggle(
  "dark",
  localStorage.theme === "dark" ||
    (!("theme" in localStorage) && 
     window.matchMedia("(prefers-color-scheme: dark)").matches)
);

// Set theme
localStorage.theme = "dark";  // Dark mode
localStorage.theme = "light"; // Light mode
localStorage.removeItem("theme"); // Use system preference
```

## Key Features

1. **Import-based** - Use `@import "tailwindcss"` instead of config file
2. **Custom variants** - Use `@custom-variant` directive
3. **Custom utilities** - Use `@utility` directive (replaces `@layer utilities`)
4. **Dark mode** - Multiple strategies: class, data attribute, or media query
5. **Variant composition** - Combine variants like `dark:lg:hover:bg-blue-500`
6. **CSS variables** - Utilities use CSS variables for theming

## Common Patterns

### Card Component

```html
<div class="bg-white dark:bg-gray-800 rounded-lg px-6 py-8 ring shadow-xl ring-gray-900/5">
  <h3 class="text-gray-900 dark:text-white mt-5 text-base font-medium">
    Title
  </h3>
  <p class="text-gray-500 dark:text-gray-400 mt-2 text-sm">
    Description
  </p>
</div>
```

### Button with States

```html
<button class="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 active:bg-sky-900 disabled:opacity-50 disabled:cursor-not-allowed">
  Save changes
</button>
```

### Responsive Grid

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- Items -->
</div>
```

