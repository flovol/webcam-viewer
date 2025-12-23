# Next.js Internationalization Template

A modern Next.js template with built-in internationalization (i18n) support, TypeScript, Tailwind CSS, and custom fonts.

## Features

- ✨ **Next.js 16** - Latest version with App Router
- 🌍 **Internationalization** - Multi-language support with next-intl
- 🎨 **Tailwind CSS 4** - Utility-first CSS framework
- 📝 **TypeScript** - Type-safe development
- 🔤 **Custom Fonts** - HK Grotesk font family included
- 🎯 **ESLint** - Code linting and formatting
- 🔒 **Middleware** - Optional basic auth protection

## Supported Languages

- English (en)
- German (de)
- Italian (it)

## Getting Started

### Installation

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
```

### Production

```bash
npm run start
```

## Project Structure

```
src/
├── app/
│   ├── [locale]/          # Localized routes
│   │   ├── (auth)/        # Auth-related pages
│   │   ├── (main)/        # Main app pages
│   │   ├── layout.tsx     # Locale layout
│   │   └── page.tsx       # Homepage
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── not-found.tsx      # 404 page
├── components/            # Reusable components
├── fonts/                 # Custom font files
├── hooks/                 # Custom React hooks
├── services/              # API services
├── store/                 # State management
├── types/                 # TypeScript types
├── globals.css            # Global styles
├── i18n.ts                # i18n configuration
├── proxy.ts               # Middleware configuration
└── routing.ts             # Route definitions
```

## Configuration

### Adding New Languages

Edit [src/routing.ts](src/routing.ts):

```typescript
export const locales = ['en', 'de', 'it', 'fr'] as const; // Add 'fr'

export const localeConfig = [
  // ...existing locales
  { code: 'fr', nativeName: 'FR', imgcode: 'FR' }
];
```

### Adding New Routes

Edit [src/routing.ts](src/routing.ts):

```typescript
export const routes = {
  home: '/',
  // Add your routes here
  about: '/about',
  contact: '/contact'
} as const;
```

### Basic Auth Protection (Optional)

Uncomment the basic auth code in [src/proxy.ts](src/proxy.ts) and set environment variables:

```env
BASIC_AUTH_USER=your_username
BASIC_AUTH_PASS=your_password
```

## Customization

### Colors

Edit the color scheme in [src/globals.css](src/globals.css):

```css
:root {
  --primary: 210 72% 42%;  /* Change to your primary color */
  /* ...other colors */
}
```

### Fonts

Replace the HK Grotesk font files in `src/fonts/` with your preferred fonts, then update the font configuration in [src/app/[locale]/layout.tsx](src/app/[locale]/layout.tsx).

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## License

MIT
