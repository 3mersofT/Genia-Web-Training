# GENIA Web Training - Brand Guidelines

## Brand Name

| Variant | Usage |
|---------|-------|
| **GENIA** | Short name, assistant name, method acronym |
| **GENIA Web Training** | Full official name |
| **GENIA Training** | PWA short name, SEO application name |

## Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#667eea` | Main brand color, email headers, gradients |
| Secondary | `#764ba2` | Gradient end, accents |

### Brand Gradient

```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Theme Colors

| Name | Hex | Usage |
|------|-----|-------|
| Light theme | `#3B82F6` | PWA theme color, light mode accent |
| Dark theme | `#1E40AF` | Dark mode accent |

### Semantic Colors (Email)

| Name | Hex | Usage |
|------|-----|-------|
| Success | `#10b981` | Positive actions, confirmations |
| Warning | `#ffc107` | Warnings, attention needed |
| Danger | `#ff6b6b` | Errors, destructive actions |
| Info | `#3b82f6` | Informational elements |

## Logo

- **Path**: `/logo/GENIA Logo.png`
- **Usage**: Header, hero sections, footer, watermarks, certificates
- **Favicon**: `/favicon.ico`
- **OG Image**: `/og-image.png`

## AI Assistant Persona

- **Name**: GENIA
- **Personality (FR)**: Assistant pedagogique expert en Prompt Engineering
- **Personality (EN)**: Expert Prompt Engineering teaching assistant
- **Greeting (FR)**: "Bonjour ! Je suis GENIA, ton assistant pour le Prompt Engineering."
- **Greeting (EN)**: "Hello! I am GENIA, your Prompt Engineering assistant."

## Pedagogical Method - GENIA

The method name is an acronym of the brand:

| Letter | Name (FR) | Name (EN) |
|--------|-----------|-----------|
| **G** | Guide | Guide |
| **E** | Exemples | Examples |
| **N** | Niveau adaptatif | Adaptive Level |
| **I** | Interaction | Interaction |
| **A** | Assessment | Assessment |

## Email Addresses

| Purpose | Address |
|---------|---------|
| No-reply | `noreply@geniawebtraining.com` |
| Support | `support@geniawebtraining.com` |
| From display | `GENIA <noreply@geniawebtraining.com>` |
| Domain | `geniawebtraining.com` |

## How to Rebrand

To rebrand the application, follow these steps:

### 1. Update `src/config/branding.ts`

This is the **single source of truth** for all brand values. Modify the `BRAND` object with your new values:
- Name, tagline, description
- Colors (primary, secondary, gradient, theme, email)
- Email addresses and domain
- AI assistant name and personality
- URLs, SEO metadata, PWA config

### 2. Update `public/manifest.json`

This static file cannot import TypeScript. Manually update:
- `name` (match `BRAND.pwa.name`)
- `short_name` (match `BRAND.pwa.shortName`)
- `description` (match `BRAND.description`)
- `theme_color` (match `BRAND.pwa.themeColor`)
- `background_color` (match `BRAND.pwa.backgroundColor`)

### 3. Update translation files

Run search/replace in:
- `messages/fr.json`
- `messages/en.json`

Replace all occurrences of the old brand name with the new one.

### 4. Update static assets

- Replace `/logo/GENIA Logo.png` with new logo
- Replace `/favicon.ico`
- Replace `/og-image.png`
- Replace PWA icons in `/icons/`

### 5. Verify

```bash
npx tsc --noEmit     # TypeScript check
npm run build        # Build check
npm test             # Test suite
```
