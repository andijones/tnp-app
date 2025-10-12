# Filter System - Visual Guide

## Overview

The filter system allows users to narrow down foods by **processing level** and **supermarket** with intuitive, tappable chips.

---

## Home Screen Layout

```
┌─────────────────────────────────────────────┐
│  [menu]         [LOGO]          [search]    │ ← Header
├─────────────────────────────────────────────┤
│                                             │
│  [🍃 Whole Food] [🍽️ Whole Food+]          │
│  [⚠️ Lightly Processed] [🏪 Supermarket]    │ ← Filter Bar
│  [Clear All]                                │   (horizontal scroll)
│                                             │
│  Showing 45 of 120 foods                    │ ← Results count
├─────────────────────────────────────────────┤
│                                             │
│  [Scanner Feature Card]                     │
│                                             │
│  120 foods available                        │
│                                             │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐              │
│  │ W  │ │ L  │ │ W  │ │ W+ │              │ ← Food Grid
│  │food│ │food│ │food│ │food│              │
│  └────┘ └────┘ └────┘ └────┘              │
│                                             │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐              │
│  │ L  │ │ W  │ │ W  │ │ L  │              │
│  │food│ │food│ │food│ │food│              │
│  └────┘ └────┘ └────┘ └────┘              │
│                                             │
└─────────────────────────────────────────────┘
│         ◯  🔍  ➕  ❤️  👤                   │ ← Tab Bar
└─────────────────────────────────────────────┘
```

---

## Filter Chips

### Inactive State
```
┌──────────────────┐
│ 🍃  Whole Food   │  ← Gray text, white bg, gray border
└──────────────────┘
```

### Active State
```
┌──────────────────┐
│ 🍃  Whole Food   │  ← Bold green text, green tint bg, green border
└──────────────────┘
     (glowing)
```

### With Count Badge
```
┌────────────────────────┐
│ 🏪  Supermarket  [ 2 ] │  ← Count badge shows selections
└────────────────────────┘
```

---

## Interaction Flow

### 1. Default State (No Filters)
```
All Foods Screen
├─ Filter Bar
│  └─ [Whole Food] [Whole Food+] [Lightly Processed] [Supermarket]
│     (all inactive)
│
├─ No "Clear All" button
├─ No results count
└─ Shows all 120 foods
```

### 2. Single Filter Applied
```
User taps: [Whole Food]

Result:
├─ Filter Bar
│  └─ [Whole Food✓] [Whole Food+] [Lightly Processed] [Supermarket] [Clear All]
│     (green)
│
├─ "Showing 45 of 120 foods"
└─ Grid shows only whole foods
```

### 3. Multiple Filters
```
User taps: [Whole Food] + [Lightly Processed]

Result:
├─ Filter Bar
│  └─ [Whole Food✓] [Whole Food+] [Lightly Processed✓] [Supermarket] [Clear All]
│     (green)         (gray)        (green)
│
├─ "Showing 78 of 120 foods"
└─ Grid shows whole OR lightly processed
```

### 4. Supermarket Filter
```
User taps: [Supermarket]

Modal Opens:
┌─────────────────────────────────────┐
│  Filter by Supermarket          [X] │
├─────────────────────────────────────┤
│  🏪  Tesco                          │
│  🏪  Sainsbury's                    │
│  🏪  Asda                           │
│  🏪  Waitrose                       │
│  🏪  Morrisons                      │
├─────────────────────────────────────┤
│  [Clear]              [Done (0)]    │
└─────────────────────────────────────┘

User selects: Tesco ✓, Sainsbury's ✓

Modal Updates:
┌─────────────────────────────────────┐
│  Filter by Supermarket          [X] │
├─────────────────────────────────────┤
│  🏪  Tesco                      ✓   │ ← Checkmark
│  🏪  Sainsbury's                ✓   │ ← Checkmark
│  🏪  Asda                           │
│  🏪  Waitrose                       │
│  🏪  Morrisons                      │
├─────────────────────────────────────┤
│  [Clear]              [Done (2)]    │ ← Count updates
└─────────────────────────────────────┘

User taps: [Done (2)]

Result:
├─ Filter Bar
│  └─ [Whole Food✓] [Whole Food+] [Lightly Processed✓] [Supermarket (2)] [Clear All]
│                                                          ^count badge
│
├─ "Showing 32 of 120 foods"
└─ Grid shows: (Whole OR Lightly) AND (Tesco OR Sainsbury's)
```

### 5. Clear All
```
User taps: [Clear All]

Result:
├─ Filter Bar
│  └─ [Whole Food] [Whole Food+] [Lightly Processed] [Supermarket]
│     (all gray - inactive)
│
├─ No results count
└─ Shows all 120 foods again
```

---

## Aisle Detail Screen

Same filter behavior, contextual to aisle:

```
┌─────────────────────────────────────────────┐
│  [←]           Beverages        [search]    │ ← Header
├─────────────────────────────────────────────┤
│                                             │
│  [🍃 Whole Food] [🍽️ Whole Food+]          │
│  [⚠️ Lightly Processed] [🏪 Supermarket]    │ ← Filter Bar
│                                             │
│  Showing 12 of 45 foods                     │
├─────────────────────────────────────────────┤
│  Shop by Category                           │
│  [Soft Drinks] [Juices] [Coffee]           │ ← Child aisles
│                                             │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐              │
│  │ W  │ │ W  │ │ W+ │ │ L  │              │
│  │food│ │food│ │food│ │food│              │
│  └────┘ └────┘ └────┘ └────┘              │
└─────────────────────────────────────────────┘
```

---

## Search + Filter Combination

```
┌─────────────────────────────────────────────┐
│  [←]  [Search: "pasta"...]         [x]      │ ← Search active
│     (Filter bar hidden during search)        │
├─────────────────────────────────────────────┤
│  8 results for "pasta"                      │
│                                             │
│  ┌────┐ ┌────┐ ┌────┐                      │
│  │ W  │ │ L  │ │ W  │                      │
│  │pasta│pasta│ │pasta│                      │
│  └────┘ └────┘ └────┘                      │
└─────────────────────────────────────────────┘

User exits search → Filters reappear
```

---

## Empty States

### No Results from Filters
```
┌─────────────────────────────────────────────┐
│  [Whole Food✓] [Supermarket (Waitrose)]    │ ← Active filters
│  [Clear All]                                │
│                                             │
│  Showing 0 of 120 foods                     │
├─────────────────────────────────────────────┤
│                                             │
│               🔍                            │
│         No foods found                      │
│                                             │
│  Try adjusting your filters or search       │
│                                             │
│         [Clear All Filters]                 │
│                                             │
└─────────────────────────────────────────────┘
```

### No Supermarkets Available
```
Supermarket Modal:
┌─────────────────────────────────────┐
│  Filter by Supermarket          [X] │
├─────────────────────────────────────┤
│                                     │
│         No supermarkets             │
│         available                   │
│                                     │
├─────────────────────────────────────┤
│              [Done]                 │
└─────────────────────────────────────┘
```

---

## Visual Design Details

### Color Palette

**Inactive Chip**:
- Background: `#FFFFFF` (white)
- Border: `#E5E5E5` (light gray)
- Text: `#6b7280` (medium gray)
- Icon: `#6b7280`

**Active Chip**:
- Background: `#E0FFE7` (light green tint)
- Border: `#3CC161` (green)
- Text: `#1F5932` (dark green, bold)
- Icon: `#1F5932`

**Count Badge (Active)**:
- Background: `#3CC161` (green)
- Text: `#FFFFFF` (white)
- Border: None

**Clear All Button**:
- Background: `#F5F5F5` (light gray)
- Border: `#E5E5E5`
- Icon: `#6b7280` (close-circle)
- Text: `#6b7280`

### Sizing

**Chip**:
- Height: 36px
- Padding: 8px vertical, 12px horizontal
- Border radius: 20px (pill)
- Gap between chips: 8px

**Icon**:
- Size: 14px
- Margin right: 4px

**Count Badge**:
- Height: 18px
- Min width: 18px
- Border radius: 9px
- Padding: 0-5px horizontal
- Font: 11px bold

**Modal**:
- Max height: 70% of screen
- Border radius top: 20px
- Padding: 16px

---

## Animations

### Chip Toggle
```
Tap → Scale down (0.95) → Snap to active state → Scale up (1.05) → Settle (1.0)
Duration: 200ms
Easing: Spring (friction: 4)
```

### Modal
```
Open: Slide up from bottom (300ms, ease-out)
Close: Slide down (250ms, ease-in)
Backdrop: Fade in/out (200ms)
```

### Filter Bar Results
```
Count change: Fade out old → Fade in new (150ms)
"Clear All" appear: Fade + slide in from right (200ms)
```

---

## Responsive Behavior

### Portrait (Default)
```
┌──────────────────────────────┐
│  [Chip] [Chip] [Chip] [Chip] │ ← Scrolls horizontally
│  ▶                            │
└──────────────────────────────┘
```

### Landscape
```
┌─────────────────────────────────────────────────────────┐
│  [Chip] [Chip] [Chip] [Chip] [Chip] [Clear All]        │ ← More visible
└─────────────────────────────────────────────────────────┘
```

### Small Screen (iPhone SE)
```
┌─────────────────────┐
│  [Chip] [Chip]      │ ← Fewer visible
│  ▶                  │   (scroll to see more)
└─────────────────────┘
```

---

## Accessibility

### Screen Reader Experience

**Inactive Chip**:
> "Whole Food. Filter. Not selected. Double tap to filter by whole food."

**Active Chip**:
> "Whole Food. Filter. Selected. Double tap to remove filter."

**Supermarket Chip**:
> "Supermarket. Filter. 2 selected. Double tap to open supermarket filter options."

**Clear All Button**:
> "Clear all filters. Button. Double tap to clear all active filters."

### Focus Order
```
1. Whole Food chip
2. Whole Food+ chip
3. Lightly Processed chip
4. Supermarket chip
5. Clear All button (if visible)
```

### Keyboard Navigation
- Tab: Move between chips
- Space/Enter: Toggle chip
- Escape: Clear all (if active)

---

## Summary

**Key UX Wins**:
✅ Visible by default (not hidden)
✅ One-tap to filter
✅ Multi-select capability
✅ Instant feedback (count + results)
✅ Easy reset (Clear All)
✅ Familiar pattern (horizontal chips)
✅ Scalable (modal for long lists)
✅ Accessible (keyboard, screen reader)

**User Mental Model**:
"I see chips → I tap chips → I see fewer foods → I can tap again to remove"

Simple. Fast. Clear. 🎯
