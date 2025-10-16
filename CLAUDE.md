# The Naked Pantry - Design System Rules for Figma Integration

This document provides comprehensive guidelines for integrating Figma designs into The Naked Pantry codebase using the Model Context Protocol (MCP).

## Project Overview

**The Naked Pantry** is a React Native mobile app (Expo) that helps users discover healthy, non-ultra processed foods. The app allows users to scan ingredients, browse food items, and contribute to a community-driven database of food products.

## 1. Design System Structure

### 1.1 Token Definitions

Design tokens are centrally defined in **`src/theme/index.ts`**.

#### Color Tokens

```typescript
// Primary brand color
primary: '#02621C'      // Brand green (deprecated, use Green-950)

// System colors
success: '#22c55e'      // Clean green for success states
error: '#ef4444'        // Clean red for error states
warning: '#f59e0b'      // Clean orange for warning states

// Neutral colors
background: '#F7F6F0'   // Warm background (Neutral-BG)
surface: '#FFFFFF'      // Clean white for cards (Neutral-white)
border: '#e5e5e5'       // Subtle borders (Neutral-200)
divider: '#f3f4f6'      // Very light dividers

// Text hierarchy
text.primary: '#1f2937'    // Dark gray for primary text
text.secondary: '#6b7280'  // Medium gray for secondary text
text.tertiary: '#9ca3af'   // Light gray for tertiary text
text.inverse: '#ffffff'    // White text on dark backgrounds

// Neutral palette (comprehensive)
neutral.white: '#FFFFFF'
neutral.50: '#FAFAFA'
neutral.100: '#F5F5F5'
neutral.200: '#E5E5E5'
neutral.300: '#D4D4D4'
neutral.400: '#A3A3A3'
neutral.500: '#737373'
neutral.600: '#525252'
neutral.700: '#404040'
neutral.800: '#262626'
neutral.900: '#171717'
neutral.950: '#0A0A0A'
neutral.BG: '#F7F6F0'      // Main background
neutral.BG2: '#EBEAE4'     // Alternative background

// Green palette (brand colors)
green.25: '#F9FFFA'
green.50: '#E0FFE7'
green.100: '#C1FFD0'
green.200: '#A3F6B8'
green.300: '#84EDA0'
green.400: '#65E488'
green.500: '#44DB6D'       // Primary button
green.600: '#3CC161'       // Primary button border
green.700: '#35A756'
green.800: '#2D8D4A'
green.900: '#26733E'       // Input focus border
green.950: '#1F5932'       // Secondary button, text

// NOVA classification colors
nova.group1: '#22c55e'     // Unprocessed - Success green
nova.group2: '#84cc16'     // Processed culinary - Light green
nova.group3: '#f59e0b'     // Processed foods - Warning orange
nova.group4: '#ef4444'     // Ultra-processed - Error red
```

#### Spacing Tokens

```typescript
spacing: {
  xs: 4,    // var(--Spacing-4)
  sm: 8,    // var(--Spacing-8)
  md: 16,   // var(--Spacing-16)
  lg: 24,   // var(--Spacing-24)
  xl: 32,   // var(--Spacing-32)
  xxl: 48,  // var(--Spacing-48)
}
```

#### Border Radius Tokens

```typescript
borderRadius: {
  sm: 8,    // var(--Spacing-8, 8px) - cards and inputs use 8px
  md: 8,
  lg: 8,
  full: 9999,  // For circular elements and buttons
}
```

**Note**: The design system uses a consistent 8px border radius for cards and inputs. Buttons use `borderRadius: 9999` for fully rounded (pill-shaped) design.

#### Typography Tokens

Typography follows a clear hierarchy with specific weights and families. **System fonts** are used by default (no custom fonts loaded currently).

```typescript
// Display text (32px) - Bold
display: {
  fontSize: 32,
  fontFamily: 'System',  // bold weight
  lineHeight: 38,        // 1.19712 ratio
  letterSpacing: -0.96,
}

// Title text (22px) - Bold
title: {
  fontSize: 22,
  fontFamily: 'System',  // bold weight
  lineHeight: 26,
  letterSpacing: -0.3,
}

// Heading (26px) - Bold
heading: {
  fontSize: 26,
  fontFamily: 'System',  // bold weight
  lineHeight: 31,        // 1.19712 ratio
  letterSpacing: -0.78,
}

// Subtitle (21px) - Semibold
subtitle: {
  fontSize: 21,          // Existing size (legacy components use this)
  fontFamily: 'System',  // semibold weight (600)
  fontWeight: '600',
  lineHeight: 25,        // 1.19712 ratio
  letterSpacing: -0.63,
}

// Headline (18px) - Semibold
headline: {
  fontSize: 18,
  fontFamily: 'System',  // semibold weight
  lineHeight: 22,
  letterSpacing: -0.2,
}

// Card Title (19px) - Bold
cardTitle: {
  fontSize: 19,
  fontFamily: 'System',  // bold weight
  fontWeight: 'bold',
  lineHeight: 23,        // 1.19712 ratio
  letterSpacing: -0.57,
}

// Body (20px) - Regular
body: {
  fontSize: 20,          // Existing size (legacy components use this)
  fontFamily: 'System',
  fontWeight: '400',
  lineHeight: 28,        // 140% of font size
  letterSpacing: -0.2,
}

// Body Medium (20px) - Medium
bodyMedium: {
  fontSize: 20,          // Existing size (legacy components use this)
  fontFamily: 'System',
  fontWeight: '500',
  lineHeight: 28,
  letterSpacing: -0.2,
}

// Body Semibold (20px) - Semibold
bodySemibold: {
  fontSize: 20,          // Existing size (legacy components use this)
  fontFamily: 'System',
  fontWeight: '600',
  lineHeight: 28,
  letterSpacing: -0.2,
}

// Subtext (14px) - Regular/Medium
subtext: {
  fontSize: 14,
  fontFamily: 'System',  // regular weight
  lineHeight: 20,
  letterSpacing: 0,
}

subtextMedium: {
  fontSize: 14,
  fontFamily: 'System',  // medium weight
  lineHeight: 20,
  letterSpacing: 0,
}

// Card Meta (14px) - Medium
cardMeta: {
  fontSize: 14,
  fontFamily: 'System',
  fontWeight: '500',
  lineHeight: 16,
  letterSpacing: -0.3,
}

// Caption (12px) - Regular/Medium
caption: {
  fontSize: 12,
  fontFamily: 'System',  // regular weight
  lineHeight: 16,
  letterSpacing: 0,
}

captionMedium: {
  fontSize: 12,
  fontFamily: 'System',  // medium weight
  lineHeight: 16,
  letterSpacing: 0,
}

// Label (14px) - Semibold
label: {
  fontSize: 14,
  fontFamily: 'System',  // semibold weight
  lineHeight: 18,
  letterSpacing: 0.1,
}

// Label New (12px) - Semibold
labelNew: {
  fontSize: 12,
  fontFamily: 'System',  // semibold weight
  lineHeight: 12,        // normal line-height
  letterSpacing: 0,
}
```

**Figma Artboard Size**: Design at **390 × 844** (iPhone 14 Pro base size)

**Figma-to-React Native Mapping**: Use **1:1 mapping** (no scaling needed)
- 15px in Figma → 15pt in React Native
- 16px in Figma → 16pt in React Native
- 48px in Figma → 48pt in React Native

**Important**: When converting Figma designs at 390×844:
1. Use direct 1:1 mapping - no multiplication needed
2. Font sizes: Figma px → React Native pt (same number)
3. Spacing: Figma px → React Native pt (same number)
4. Heights/widths: Figma px → React Native pt (same number)
5. Border radius: 8px for cards/inputs, 9999 for fully rounded buttons (design system standard)

**Why 1:1 works**: React Native uses density-independent pixels (points) that match Figma pixels when designing at standard device sizes (390×844).

#### Shadow Tokens

```typescript
shadows: {
  sm: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,  // Android
  },
  md: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,  // Android
  },
}
```

**Note**: React Native doesn't support inset shadows or gradient overlays. Complex Figma shadow effects are simplified to standard shadow properties.

### 1.2 Component Architecture

Components follow an **atomic design pattern** organized by type:

```
src/
├── components/
│   ├── common/          # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── FoodCard.tsx
│   │   ├── GridFoodCard.tsx
│   │   ├── FoodImage.tsx
│   │   ├── FavoriteButton.tsx
│   │   ├── ProfilePicture.tsx
│   │   ├── NovaBadge.tsx
│   │   ├── IconBadge.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── SectionHeader.tsx
│   │   ├── SegmentedTabs.tsx
│   │   ├── BlurHeader.tsx
│   │   ├── GreenBlurHeader.tsx
│   │   └── TransparentHeader.tsx
│   ├── food/            # Food-specific components
│   │   ├── ProductInfoSection.tsx
│   │   ├── NutritionPanel.tsx
│   │   ├── MinimalNutritionPanel.tsx
│   │   ├── IngredientsList.tsx
│   │   ├── NovaRatingBanner.tsx
│   │   ├── SupermarketAvailability.tsx
│   │   ├── RelatedFoodsSection.tsx
│   │   ├── RelatedFoodCard.tsx
│   │   ├── RatingsSection.tsx
│   │   ├── ReviewSubmission.tsx
│   │   └── SubmitterInfo.tsx
│   ├── aisles/          # Aisle browsing components
│   │   ├── CategoryCard.tsx
│   │   ├── QuickActionCard.tsx
│   │   └── SectionHeader.tsx
│   └── auth/            # Authentication components
│       └── GoogleSignInButton.tsx
```

**Component Patterns**:

1. **All components import theme**: `import { theme } from '../../theme';`
2. **Props use TypeScript interfaces**: Always define explicit interface for props
3. **StyleSheet.create at bottom**: Styles defined at bottom of file using `StyleSheet.create()`
4. **Functional components with React.FC**: Use functional components with TypeScript
5. **Ionicons for icons**: `import { Ionicons } from '@expo/vector-icons';`

**Example Component Pattern**:

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface MyComponentProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  onPress,
  variant = 'primary',
}) => {
  return (
    <TouchableOpacity style={[styles.container, styles[variant]]} onPress={onPress}>
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
  },
  primary: {
    backgroundColor: theme.colors.green[500],
  },
  secondary: {
    backgroundColor: theme.colors.green[950],
  },
  title: {
    ...theme.typography.headline,
    color: theme.colors.text.primary,
  },
});
```

## 2. Frameworks & Libraries

### UI Framework
- **React Native 0.81.4** with **React 19.1.0**
- **Expo ~54.0.7** (managed workflow)
- **TypeScript ~5.9.2**

### Navigation
- **@react-navigation/native** - Core navigation
- **@react-navigation/native-stack** - Stack navigation
- **@react-navigation/bottom-tabs** - Tab navigation (floating glassmorphism design)
- **@react-navigation/drawer** - Drawer navigation

### Styling
- **StyleSheet API** (React Native built-in) - NO styled-components, NO CSS-in-JS libraries
- **expo-blur** - Glassmorphism effects on tab bar
- All styling uses `StyleSheet.create()` objects
- No CSS modules, no SASS/LESS

### Key Libraries
- **@supabase/supabase-js** - Backend (auth, database, storage)
- **expo-camera** - Camera/barcode scanning
- **expo-image-picker** - Image selection
- **expo-image-manipulator** - Image processing
- **react-native-reanimated** - Animations
- **react-native-gesture-handler** - Gesture handling
- **react-native-svg** - SVG support

### Build System
- **Metro bundler** (default Expo bundler)
- **Babel** with `babel-preset-expo`
- No webpack, no custom bundler configuration

## 3. Asset Management

### Asset Structure

```
assets/
├── App-Icon.png        # App icon
├── icon.png            # Standard icon
├── adaptive-icon.png   # Android adaptive icon
├── splash.png          # Splash screen
├── splash-icon.png     # Splash icon
├── favicon.png         # Web favicon
├── logo.png            # App logo
├── logo-splash.svg     # Logo for splash (vector)
├── logo-splash.png     # Logo for splash (raster)
├── bg-line.svg         # Background line pattern (vector)
├── bg-line.png         # Background line pattern (raster)
├── barcode.png         # Barcode placeholder
└── fonts/
    ├── BricolageGrotesque.ttf
    ├── BricolageGrotesque-Regular.ttf
    └── BricolageGrotesque-Light.ttf
```

**Note**: Custom fonts (BricolageGrotesque) are present but **not currently loaded**. System fonts are used throughout the app.

### Asset Loading

**Images**:
```typescript
// Local assets
import logo from '../../assets/logo.png';
<Image source={logo} style={styles.image} />

// Remote images (food images, avatars)
<Image source={{ uri: imageUrl }} style={styles.image} />
```

**SVG Assets**:
- SVG support via `react-native-svg`
- SVGs are typically converted to PNG for use (e.g., `bg-line.svg` → `bg-line.png`)

### Cloud Storage (Supabase)

**Buckets**:
- `food-images` - Food product images
- `avatars` - User profile pictures

**Image URLs**:
```typescript
// Food images from Supabase Storage
const imageUrl = `https://uacihrlnwlqhpbobzajs.supabase.co/storage/v1/object/public/food-images/${food.image}`;

// Avatar images
const avatarUrl = `https://uacihrlnwlqhpbobzajs.supabase.co/storage/v1/object/public/avatars/${profile.avatar_url}`;
```

**Asset Optimization**:
- Images uploaded by users are processed via `expo-image-manipulator`
- Compression and resizing applied before upload
- No CDN configuration currently (Supabase Storage handles caching)

## 4. Icon System

### Icon Library
- **@expo/vector-icons** (Ionicons by default)
- All icons use Ionicons from the Expo icon set

### Icon Usage Pattern

```typescript
import { Ionicons } from '@expo/vector-icons';

// Outline icons (default state)
<Ionicons name="heart-outline" size={24} color={theme.colors.text.secondary} />

// Filled icons (active/focused state)
<Ionicons name="heart" size={24} color={theme.colors.primary} />

// Common icon names
heart / heart-outline           // Favorite
nutrition / nutrition-outline   // Food
scan / scan-outline            // Scanner
add-circle / add-circle-outline // Add/Submit
person / person-outline        // Profile
storefront / storefront-outline // Supermarket
list / list-outline            // Ingredients
star / star-outline            // Rating
checkmark-circle               // Success
close-circle                   // Error
```

### Icon Sizing Convention

```typescript
// Standard sizes
xs: 12   // Tiny badges
sm: 14   // Metadata icons
md: 18   // Default inline icons
lg: 24   // Primary actions
xl: 28   // Tab bar icons
xxl: 32+ // Hero icons
```

### Icon Color Patterns

```typescript
// Icons inherit theme colors
color={theme.colors.text.primary}    // Primary text icons
color={theme.colors.text.secondary}  // Secondary/metadata icons
color={theme.colors.text.tertiary}   // Disabled icons
color={theme.colors.green[950]}      // Brand icons
color={theme.colors.primary}         // Active state icons
```

### Tab Bar Icons (Animated)

The app uses **animated tab bar icons** with scale and bounce effects:

```typescript
// Tab icons animate on focus
<AnimatedTabIcon
  name="nutrition-outline"     // Outline variant
  focusedName="nutrition"      // Filled variant
  focused={focused}
  color={color}
  size={28}
/>
```

**Tab Icon States**:
- **Unfocused**: Outline icon, scale 0.85, green opacity 50%
- **Focused**: Filled icon, scale 1.15, full green color, bounce animation

## 5. Styling Approach

### CSS Methodology
**StyleSheet API** (React Native standard) - NO external CSS libraries

### Global Styles
- No global CSS files
- Theme tokens in `src/theme/index.ts` provide global values
- StatusBar configured in App.tsx: `<StatusBar style="dark" backgroundColor="#FFFFFF" />`

### Style Patterns

#### 1. Component Styles with StyleSheet.create()

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  card: {
    padding: 16,  // Figma 16px → 16pt RN (1:1 mapping)
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000000',
    backgroundColor: theme.colors.surface,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,  // Android shadow
  },
  title: {
    ...theme.typography.headline,  // Spread typography tokens
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
});
```

#### 2. Conditional Styles

```typescript
// Array syntax for conditional styles
<View style={[
  styles.button,
  variant === 'primary' && styles.primaryButton,
  variant === 'secondary' && styles.secondaryButton,
  disabled && styles.disabled,
]} />

// Style variants in StyleSheet
const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 9999,  // Fully rounded (pill-shaped)
  },
  primaryButton: {
    backgroundColor: theme.colors.green[500],
  },
  secondaryButton: {
    backgroundColor: theme.colors.green[950],
  },
  disabled: {
    opacity: 0.4,
  },
});
```

#### 3. Dynamic Styles (Inline)

```typescript
// Use inline styles sparingly for truly dynamic values
<View style={[
  styles.container,
  { opacity: isVisible ? 1 : 0 }  // Dynamic value
]} />
```

### Responsive Design

React Native uses **density-independent pixels (dp)** - no media queries needed for basic responsiveness.

**Dimensions API** for screen-specific logic:

```typescript
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Conditional rendering based on screen size
const isSmallScreen = width < 375;
```

**Layout patterns**:
- Use `flex` properties for responsive layouts
- `flexWrap: 'wrap'` for grid-like layouts
- `ScrollView` for scrollable content
- `FlatList` for performant lists

### Platform-Specific Styles

```typescript
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: {
        paddingTop: 44,  // iOS safe area
      },
      android: {
        paddingTop: 24,  // Android status bar
      },
    }),
  },
});
```

### Shadow Styles (iOS vs Android)

```typescript
const styles = StyleSheet.create({
  card: {
    // iOS shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Android shadow
    elevation: 4,
  },
});
```

**Important**: Android uses `elevation`, iOS uses `shadow*` properties. Always provide both.

### Tab Bar Glassmorphism

The tab bar uses a **glassmorphism effect** with blur:

```typescript
import { BlurView } from 'expo-blur';

// Floating tab bar with glass effect
<BlurView
  intensity={80}
  tint="light"
  style={styles.blurContainer}
>
  <View style={styles.glassOverlay} />
</BlurView>

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
    borderRadius: 34,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 34,
  },
});
```

**Tab Bar Specs**:
- Position: `absolute` at bottom with 30px offset
- Height: 68px
- Border radius: 34px
- Background: Blur + white overlay (85% opacity)
- Shadow: Large drop shadow for floating effect

## 6. Project Structure

```
TNP/
├── App.tsx                    # Root component (AuthProvider, NavigationContainer)
├── index.js                   # Entry point (registerRootComponent)
├── app.json                   # Expo configuration
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── babel.config.js            # Babel config
├── metro.config.js            # Metro bundler config
├── assets/                    # Static assets
│   ├── fonts/
│   └── images/
└── src/
    ├── components/            # UI components
    │   ├── common/           # Shared components
    │   ├── food/             # Food-specific components
    │   ├── aisles/           # Aisle browsing components
    │   └── auth/             # Auth components
    ├── screens/              # Screen components
    │   ├── auth/
    │   ├── home/
    │   ├── food/
    │   ├── aisles/
    │   ├── scanner/
    │   ├── favorites/
    │   └── profile/
    ├── navigation/           # Navigation configuration
    │   ├── RootNavigator.tsx  # Main nav stack
    │   └── AppNavigator.tsx   # Secondary nav
    ├── contexts/             # React contexts
    │   └── AuthContext.tsx   # Authentication state
    ├── hooks/                # Custom hooks
    │   ├── useUser.ts
    │   ├── useFavorites.ts
    │   └── index.ts
    ├── services/             # Business logic & API calls
    │   ├── api/
    │   ├── supabase/
    │   ├── aisleService.ts
    │   ├── relatedFoodsService.ts
    │   └── GoogleSignInService.ts
    ├── utils/                # Helper functions
    │   ├── fonts.ts
    │   ├── foodUtils.ts
    │   └── enhancedNovaClassifier.ts
    ├── types/                # TypeScript types
    │   └── index.ts
    ├── theme/                # Design tokens
    │   └── index.ts
    └── constants/            # App constants
        └── index.ts
```

### Key Files

**App.tsx**: Root component that wraps app with AuthProvider and NavigationContainer. Handles splash screen and font loading.

**src/theme/index.ts**: Central design token definitions (colors, typography, spacing, shadows).

**src/constants/index.ts**: App constants (API config, table names, validation rules, error messages).

**src/types/index.ts**: TypeScript type definitions for Food, User, Rating, etc.

**src/navigation/RootNavigator.tsx**: Main navigation structure (tab navigator + stack navigator).

### Feature Organization Pattern

Each feature is organized by screen in `src/screens/`:

```
screens/
├── auth/
│   └── AuthScreen.tsx         # Login/signup
├── home/
│   └── HomeScreen.tsx         # Main feed
├── food/
│   └── FoodDetailScreen.tsx   # Food detail view
├── aisles/
│   ├── AisleMenuScreen.tsx    # Aisle categories
│   └── AisleDetailScreen.tsx  # Foods in aisle
├── scanner/
│   ├── IngredientScannerScreen.tsx  # Camera scanner
│   └── SubmissionScreen.tsx         # Submit food
├── favorites/
│   └── FavoritesScreen.tsx    # User favorites
└── profile/
    ├── ProfileScreen.tsx            # User profile
    ├── UserReviewsScreen.tsx        # User's reviews
    └── UserContributionsScreen.tsx  # User's submissions
```

## 7. Integration Guidelines for Figma → React Native

### Step 1: Analyze Figma Design

When you receive a Figma design URL (designed at 390×844):

1. **Extract design tokens**:
   - Colors (check if they match existing green palette or neutral palette)
   - Font sizes (use 1:1 mapping from Figma px to React Native pt)
   - Spacing (use multiples of 8: xs=4, sm=8, md=16, lg=24, xl=32, xxl=48)
   - Border radius (default 8px unless specified)

2. **Identify component type**:
   - Button → Use existing Button component or extend variants
   - Input → Use Input component
   - Card → Use FoodCard/GridFoodCard or create new card component
   - List → Use FlatList with custom renderItem
   - Icon → Use Ionicons

3. **Check for existing components**:
   - Browse `src/components/common/` for reusable components
   - Check `src/components/food/` for food-specific components
   - Reuse before creating new components

### Step 2: Create Component Structure

**File location**: Place in appropriate directory:
- `src/components/common/` for reusable components
- `src/components/food/` for food-specific components
- `src/components/aisles/` for aisle-specific components

**Component template**:

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

interface MyComponentProps {
  // Define props based on Figma design
  title: string;
  subtitle?: string;
  onPress?: () => void;
  variant?: 'default' | 'highlighted';
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  subtitle,
  onPress,
  variant = 'default',
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, styles[variant]]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    // Shadow from Figma
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  default: {
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  highlighted: {
    borderWidth: 2,
    borderColor: theme.colors.green[500],
  },
  title: {
    ...theme.typography.headline,
    color: theme.colors.text.primary,
  },
  subtitle: {
    ...theme.typography.subtext,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
});
```

### Step 3: Convert Figma Styles to React Native

#### Colors
- Use theme colors when possible
- Add new colors to theme if needed (don't hardcode)

```typescript
// ✅ Good
backgroundColor: theme.colors.green[500]

// ❌ Avoid
backgroundColor: '#44DB6D'  // Use theme instead
```

#### Typography
- Use theme typography tokens
- Use 1:1 mapping from Figma (no scaling needed)

```typescript
// ✅ Good - Use existing typography token
...theme.typography.headline

// ✅ Also good - Create custom with direct Figma values
fontSize: 16,  // Figma 16px → 16pt RN (1:1 mapping)
fontFamily: 'System',
fontWeight: '600',
lineHeight: 19,  // Figma 19px → 19pt RN
letterSpacing: -0.48,  // Figma -0.48px → -0.48 RN
```

#### Spacing
- Use theme.spacing tokens
- Figma spacing should align with 8px grid
- Use 1:1 mapping from Figma

```typescript
// ✅ Good - Use theme token
marginBottom: theme.spacing.md  // 16px

// ✅ Also good - Direct from Figma
marginBottom: 16  // Figma 16px → 16pt RN (1:1 mapping)

// ✅ For exact Figma specs
paddingTop: 24  // Figma 24px → 24pt RN (no scaling)
```

#### Shadows
- Always provide both iOS and Android shadow properties
- Simplify complex Figma shadows to standard shadow properties

```typescript
// ✅ Good - Cross-platform shadow
shadowColor: '#000000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.08,
shadowRadius: 4,
elevation: 4,  // Android
```

**Note**: React Native cannot render:
- Inset shadows
- Gradient overlays as backgrounds
- Multiple box-shadows
- Linear gradients (requires `react-native-linear-gradient` library)

#### Border Radius
- Cards and inputs use 8px
- Buttons use `theme.borderRadius.full` (9999) for fully rounded (pill-shaped) design
- Use `theme.borderRadius.full` (9999) for circles

```typescript
// For cards and inputs
borderRadius: theme.borderRadius.md  // 8px

// For buttons
borderRadius: theme.borderRadius.full  // 9999 (fully rounded)
```

### Step 4: Handle Images and Assets

#### Static Images
```typescript
// Place in assets/ directory
import myImage from '../../assets/myImage.png';
<Image source={myImage} style={styles.image} />
```

#### Remote Images (from Supabase)
```typescript
// Food images
const imageUrl = food.image
  ? `https://uacihrlnwlqhpbobzajs.supabase.co/storage/v1/object/public/food-images/${food.image}`
  : null;

<Image source={{ uri: imageUrl }} style={styles.image} />
```

#### Icons
```typescript
// Use Ionicons - find closest match to Figma icon
<Ionicons name="heart-outline" size={24} color={theme.colors.text.secondary} />
```

### Step 5: Implement Interactivity

#### Touchable Components
```typescript
import { TouchableOpacity } from 'react-native';

<TouchableOpacity
  onPress={handlePress}
  activeOpacity={0.8}  // Standard opacity for press
  style={styles.button}
>
  {/* Button content */}
</TouchableOpacity>
```

#### State Management
```typescript
const [isActive, setIsActive] = useState(false);

// Conditional styles based on state
<View style={[
  styles.container,
  isActive && styles.activeContainer
]} />
```

#### Animations (if needed)
```typescript
import { Animated } from 'react-native';

const scaleAnim = useRef(new Animated.Value(1)).current;

useEffect(() => {
  Animated.spring(scaleAnim, {
    toValue: isActive ? 1.1 : 1,
    useNativeDriver: true,
  }).start();
}, [isActive]);

<Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
  {/* Animated content */}
</Animated.View>
```

### Step 6: Testing and Refinement

1. **Check on iOS and Android**: Styles may render differently
2. **Test touch targets**: Minimum 44×44 points (iOS) / 48×48 dp (Android)
3. **Verify shadows**: Android elevation may need adjustment
4. **Check safe areas**: Use `SafeAreaView` for screens with tab bar
5. **Test with real data**: Use actual food items, not placeholder data

## 8. Common Patterns and Examples

### Pattern 1: Card Component

```typescript
// FoodCard pattern with image, title, metadata, and favorite button
<View style={styles.card}>
  {/* Header */}
  <View style={styles.cardHeader}>
    <FoodImage imageUrl={food.image} size="medium" novaGroup={food.nova_group} />
    <FavoriteButton foodId={food.id} isFavorite={isFavorite} />
  </View>

  {/* Content */}
  <View style={styles.cardContent}>
    <Text style={styles.cardTitle}>{food.name}</Text>
    <View style={styles.metaRow}>
      <Ionicons name="list-outline" size={14} color={theme.colors.text.secondary} />
      <Text style={styles.metaText}>5 ingredients</Text>
    </View>
  </View>
</View>
```

### Pattern 2: Button Variants

```typescript
// Primary button (green, most common action)
<Button
  title="Submit"
  onPress={handleSubmit}
  variant="primary"
/>

// Secondary button (dark green, secondary action)
<Button
  title="Cancel"
  onPress={handleCancel}
  variant="secondary"
/>

// Tertiary button (light neutral, less important action)
<Button
  title="Skip"
  onPress={handleSkip}
  variant="tertiary"
/>

// Text button (transparent, minimal action)
<Button
  title="Learn More"
  onPress={handleLearnMore}
  variant="text"
/>
```

### Pattern 3: List with FlatList

```typescript
<FlatList
  data={foods}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <FoodCard
      food={item}
      onPress={() => navigation.navigate('FoodDetail', { foodId: item.id })}
      isFavorite={favorites.has(item.id)}
      onToggleFavorite={handleToggleFavorite}
    />
  )}
  contentContainerStyle={styles.listContainer}
  showsVerticalScrollIndicator={false}
/>

const styles = StyleSheet.create({
  listContainer: {
    padding: theme.spacing.md,
    paddingBottom: 100,  // Account for floating tab bar
  },
});
```

### Pattern 4: Header with Back Button

```typescript
import { useNavigation } from '@react-navigation/native';

const navigation = useNavigation();

<View style={styles.header}>
  <TouchableOpacity onPress={() => navigation.goBack()}>
    <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
  </TouchableOpacity>
  <Text style={styles.headerTitle}>Food Details</Text>
  <View style={{ width: 24 }} /> {/* Spacer for centering */}
</View>

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  headerTitle: {
    ...theme.typography.title,
    color: theme.colors.text.primary,
  },
});
```

### Pattern 5: Loading State

```typescript
import { ActivityIndicator } from 'react-native';

{loading ? (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={theme.colors.green[500]} />
  </View>
) : (
  <View style={styles.content}>
    {/* Main content */}
  </View>
)}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
});
```

### Pattern 6: Empty State

```typescript
{foods.length === 0 ? (
  <View style={styles.emptyState}>
    <Ionicons name="nutrition-outline" size={64} color={theme.colors.text.tertiary} />
    <Text style={styles.emptyTitle}>No foods found</Text>
    <Text style={styles.emptySubtitle}>Try adjusting your filters or search</Text>
  </View>
) : (
  <FlatList data={foods} ... />
)}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    ...theme.typography.title,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...theme.typography.subtext,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});
```

## 9. Processing Level System

The app uses a **user-friendly processing level scale** that translates NOVA classification into familiar language:

### Processing Levels

**The app doesn't show ultra-processed foods (NOVA 4)**, so we focus on three main levels:

1. **Whole Food** (NOVA 1)
   - Label: "Whole Food"
   - Short: "W"
   - Color: `#22c55e` (vibrant green)
   - Description: "Natural and unprocessed"
   - Examples: Fresh fruits, vegetables, eggs, milk

2. **Extracted Foods** (NOVA 2)
   - Label: "Extracted Foods"
   - Short: "E"
   - Color: `#84cc16` (light green)
   - Description: "Single ingredient"
   - Examples: Oils, butter, salt, honey

3. **Lightly Processed** (NOVA 3)
   - Label: "Lightly Processed"
   - Short: "L"
   - Color: `#f59e0b` (warm amber)
   - Description: "Few added ingredients"
   - Examples: Canned vegetables, cheese, fresh bread

4. **Processed** (NOVA 4) - *Rarely shown*
   - Label: "Processed"
   - Short: "P"
   - Color: `#ff6b35` (warm orange)
   - Description: "Multiple added ingredients"

### Components

#### ProcessingLevelBadge
Simple badge with color and label:
```typescript
<ProcessingLevelBadge
  novaGroup={food.nova_group}
  size="medium"
  showLabel={false}
/>
```

#### ProcessingLevelScale
Visual progress bar showing position on scale:
```typescript
<ProcessingLevelScale
  novaGroup={food.nova_group}
  variant="compact" // or "detailed"
/>
```

#### ProcessingLevelBanner
Full banner for detail screens:
```typescript
<ProcessingLevelBanner novaGroup={food.nova_group} />
```

**Visual Design Philosophy**:
- **No technical jargon**: "Whole Food" not "Unprocessed"
- **Progress scale metaphor**: Users see where food sits on a spectrum
- **Letter badges on cards**: "W", "W+", "L", "P" for quick scanning
- **Color gradient**: Green (good) → Yellow/Orange (more processed)

### Migration from NOVA

The `nova` colors in theme are **legacy** and maintained for backwards compatibility. New components should use:

```typescript
theme.colors.processing.wholeFood.color
theme.colors.processing.extractedFoods.color
theme.colors.processing.lightlyProcessed.color
theme.colors.processing.processed.color
```

Utility function to convert NOVA → Processing Level:
```typescript
import { getProcessingLevel } from '../../utils/processingLevel';

const level = getProcessingLevel(food.nova_group);
// Returns: { type, label, shortLabel, description, position }
```

## 10. Authentication and User Management

### Supabase Authentication
- Email/password auth
- Google Sign-In (`expo-auth-session` + `expo-web-browser`)
- Session management via `AuthContext`

### User Profile
- Avatar stored in Supabase Storage (`avatars` bucket)
- Profile data in `profiles` table
- User contributions tracked in `foods` table
- User reviews tracked in `ratings` table

### Protected Routes
- All screens require authentication
- Unauthenticated users see `AuthScreen`
- Session checked in `AuthContext.tsx`

## 11. Key TypeScript Types

```typescript
interface Food {
  id: string;
  name: string;
  description?: string;
  image?: string;
  category?: string;
  aisle_id?: string;
  status: 'pending' | 'approved' | 'rejected';
  nova_group?: 1 | 2 | 3 | 4;
  user_id: string;
  ingredients?: string;
  nutrition_data?: NutritionInfo;
  supermarket?: string;
  supermarkets?: FoodSupermarket[];
  ratings?: Rating[];
  average_rating?: number;
  ratings_count?: number;
  url?: string;
  created_at: string;
}

interface NutritionInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  servingSize?: string;
}

interface Rating {
  id: string;
  user_id: string;
  food_id: string;
  rating: string;
  review?: string;
  created_at: string;
  profiles?: UserProfile;
}

interface UserProfile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  username?: string;
  instagram?: string;
}
```

## 12. Figma Integration Checklist

When converting a Figma design (at 390×844) to React Native:

- [ ] **Verify Figma artboard size**: Must be 390×844 for 1:1 mapping
- [ ] **Analyze design tokens**: Colors, fonts, spacing, shadows
- [ ] **Check for existing components**: Reuse before creating new
- [ ] **Use 1:1 mapping**: Figma px = React Native pt (no multiplication)
- [ ] **Use theme colors**: Reference `theme.colors.*` not hardcoded hex
- [ ] **Use theme spacing**: Reference `theme.spacing.*` not raw numbers
- [ ] **Use theme typography**: Spread `...theme.typography.*` tokens or use direct values
- [ ] **Apply shadows for both platforms**: iOS `shadow*` + Android `elevation`
- [ ] **Simplify complex effects**: Gradients, inset shadows not supported
- [ ] **Use Ionicons**: Find closest match to Figma icon
- [ ] **Set border radius**: 8px for cards/inputs, 9999 for buttons (fully rounded)
- [ ] **Add TypeScript types**: Define interface for component props
- [ ] **Handle touch states**: Use `TouchableOpacity` with `activeOpacity={0.8}`
- [ ] **Account for safe areas**: Use `SafeAreaView` or padding for tab bar
- [ ] **Test on both platforms**: iOS and Android may render differently
- [ ] **Export component**: `export const MyComponent: React.FC<Props>`
- [ ] **Place in correct directory**: `common/`, `food/`, `aisles/`, etc.

---

## Summary

**The Naked Pantry** is a React Native + Expo app with:
- **Clean, minimal design system** (green palette, fully rounded buttons, 8px radius for cards/inputs, System fonts)
- **StyleSheet API styling** (no styled-components)
- **Component-based architecture** (atomic design, reusable components)
- **Supabase backend** (auth, database, storage)
- **Bottom tab navigation** with floating glassmorphism design
- **NOVA food classification** for processing level indicators
- **1:1 Figma-to-React Native mapping** (design at 390×844, no scaling)

**Key principles for Figma integration**:
1. Design Figma artboards at **390 × 844** (iPhone 14 Pro base size)
2. Use **1:1 mapping** - Figma px = React Native pt (no multiplication)
3. Reuse existing components and theme tokens
4. Follow React Native StyleSheet patterns
5. Account for platform differences (iOS vs Android)
6. Simplify complex CSS effects not supported in React Native
7. Use TypeScript for type safety
8. Test on both iOS and Android

**When generating code from Figma (at 390×844)**:
- Design at 390×844 artboard size
- Extract colors → map to theme
- Extract typography → use 1:1 mapping (16px Figma = 16pt RN)
- Extract spacing → use 1:1 mapping (16px Figma = 16pt RN)
- Extract dimensions → use 1:1 mapping (48px Figma = 48pt RN)
- Extract shadows → convert to iOS + Android shadow props
- Identify icons → use Ionicons
- Create TypeScript component with props interface
- Use StyleSheet.create() for styles
- Place in appropriate directory

This rules document should provide all context needed for MCP-based Figma-to-code generation. 🎨→⚛️
