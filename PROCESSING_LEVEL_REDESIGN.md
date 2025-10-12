# Processing Level System Redesign

## The Problem

The original NOVA classification system (NOVA 1, 2, 3, 4) used technical terminology that confused users:
- ❌ "NOVA 1" - What does this mean?
- ❌ "Unprocessed or minimally processed" - Too wordy
- ❌ "Processed culinary ingredients" - Confusing jargon
- ❌ Number-based system - Requires learning what each number means

**Users just want to know**: *How processed is this food?*

## The Solution

A **user-friendly processing scale** with familiar language:

### New Terminology

| NOVA | Old Label | New Label | Short Badge |
|------|-----------|-----------|-------------|
| 1 | Unprocessed | **Whole Food** | W |
| 2 | Culinary Ingredients | **Whole Food+** | W+ |
| 3 | Processed Foods | **Lightly Processed** | L |
| 4 | Ultra-Processed* | **Processed** | P |

*Ultra-processed foods are rarely shown in the app

### Visual Design

#### 1. **Letter Badges on Food Cards**
Instead of colored circles with numbers, use letters:
- **W** = Whole Food (green)
- **W+** = Whole Food+ (light green)
- **L** = Lightly Processed (amber)
- **P** = Processed (orange)

Benefits:
- Quicker to scan
- More memorable (W = Whole)
- Still color-coded for visual hierarchy

#### 2. **Progress Scale Banner**
On food detail screens, show a visual scale:

```
WHOLE FOOD ●━━━━━━━○━━━━━━━○ PROCESSED
            ↑ This food is here
```

Benefits:
- Shows spectrum from whole → processed
- Users understand "where" food sits
- No need to remember number meanings

#### 3. **Human-Friendly Descriptions**
- "Natural and unprocessed" vs "Unprocessed or minimally processed"
- "Few added ingredients" vs "Products made by adding Group 2 substances to Group 1 foods"
- Simple, direct language

## Design Philosophy

### Product Design Principles Applied:

1. **Speak the user's language**
   - "Whole Food" is familiar, "NOVA 1" is not
   - People understand "lightly processed" intuitively

2. **Show, don't tell**
   - Visual scale shows position on spectrum
   - Color gradient (green → orange) shows "better → worse"
   - No need to read/remember definitions

3. **Progressive disclosure**
   - Cards: Quick scan with letter badge
   - Detail view: Full scale with description
   - Only show complexity when needed

4. **Reduce cognitive load**
   - 4 numbered groups → 3 labeled levels (app doesn't show ultra-processed)
   - Letters easier to remember than numbers
   - Visual scale eliminates need to memorize

## Implementation

### Components Created

1. **ProcessingLevelBadge** (`src/components/common/ProcessingLevelBadge.tsx`)
   - Simple badge with color and label
   - Replaces old NovaBadge

2. **ProcessingLevelScale** (`src/components/common/ProcessingLevelScale.tsx`)
   - Visual progress bar showing position
   - Use for detailed views

3. **ProcessingLevelBanner** (`src/components/food/ProcessingLevelBanner.tsx`)
   - Full banner with icon, label, description, and mini scale
   - Primary display on food detail screens

4. **Utility Functions** (`src/utils/processingLevel.ts`)
   - `getProcessingLevel(novaGroup)` - Converts NOVA → Processing Level
   - Returns: type, label, shortLabel, description, position

### Theme Updates

New color tokens added to `src/theme/index.ts`:

```typescript
theme.colors.processing = {
  wholeFood: {
    color: '#22c55e',
    light: '#E8F5E8',
    label: 'Whole Food',
    description: 'Natural and unprocessed'
  },
  // ... etc
}
```

### Updated Components

- **FoodImage**: Now shows letter badges (W, W+, L, P) instead of numbers
- **FoodDetailScreen**: Uses ProcessingLevelBanner instead of NovaRatingBanner
- **CLAUDE.md**: Documentation updated with new system

## User Benefits

### Before:
- User sees "NOVA 3" badge
- Thinks: "What's NOVA 3? Is that good or bad?"
- Has to read explanation
- May not remember for next food

### After:
- User sees "L" badge with orange color
- Thinks: "Lightly processed, probably okay"
- Sees scale showing position closer to "Processed"
- Makes informed decision immediately

## Migration Strategy

### Backwards Compatibility

- NOVA values in database stay unchanged (still 1-4)
- Old `theme.colors.nova` colors remain for legacy components
- New components use `theme.colors.processing`
- `getProcessingLevel()` utility handles conversion

### Gradual Rollout

1. ✅ Create new components
2. ✅ Update FoodDetailScreen (high visibility)
3. ✅ Update FoodImage badges (visible everywhere)
4. 🔄 Can update other screens incrementally
5. 🔄 Old NovaBadge/NovaRatingBanner can be deprecated over time

## A/B Testing Recommendations

Consider testing:
1. **Letter badges vs full labels** on food cards
2. **Scale position** (horizontal vs vertical)
3. **Color gradient** (green→orange vs green→red)
4. **Terminology** ("Whole Food+" vs "Minimally Processed")

Track:
- User comprehension (survey/interviews)
- Time to decision on food detail screen
- Engagement with processing level information

## Accessibility Considerations

- ✅ Color is not the only indicator (text labels provided)
- ✅ High contrast text on badges (white text on colored background)
- ✅ Clear, readable fonts (System font, bold weights)
- ✅ Descriptive text available for screen readers
- ⚠️ Consider adding ARIA labels for screen reader users

## Future Enhancements

### Phase 2 Ideas:
1. **Interactive scale** - Tap to see definition of each level
2. **Filter by processing level** - "Show me only Whole Foods"
3. **Processing level trends** - "You're choosing less processed foods!"
4. **Comparison view** - Compare processing level of similar foods
5. **Educational tooltips** - First-time user sees explanation

### Advanced Features:
- Ingredient analysis explaining why food is at that level
- Personalized recommendations based on processing preferences
- Visual "food journey" showing processing steps

## Summary

This redesign transforms a technical classification system into an intuitive, user-friendly scale that:
- Uses familiar language ("Whole Food" not "NOVA 1")
- Shows visual position on spectrum
- Reduces cognitive load
- Empowers users to make informed choices quickly

The key insight: **Users don't need to understand NOVA classification - they just need to understand how processed their food is.**
