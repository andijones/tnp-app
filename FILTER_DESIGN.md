# Filter System Design

## UX Design Philosophy

### Core Principles

1. **Always Visible** - Filters are front and center, not hidden in menus
2. **Multi-Select** - Users can combine multiple filters
3. **Clear Feedback** - Active state is obvious, counts show impact
4. **Easy Reset** - One-tap "Clear All" button
5. **Non-Blocking** - Search and filters work together
6. **Responsive** - Adapts to content (shows relevant supermarkets only)

### Design Decisions

#### Why Horizontal Chips?
- **Scanning**: Users can see all options at a glance
- **Touch-Friendly**: Large tap targets (44pt minimum)
- **Familiar Pattern**: Used by Amazon, Airbnb, Booking.com
- **Space-Efficient**: Scrolls horizontally without taking vertical space

#### Why Modal for Supermarkets?
- **Scalable**: List can grow without cluttering UI
- **Search-Friendly**: Can add search in future
- **Multi-Select**: Easier to select multiple in modal than chips
- **Clear Actions**: Explicit "Done" and "Clear" buttons

## Components

### 1. FilterChip

**Purpose**: Individual filter option as a tappable chip

**States**:
- **Inactive**: White background, gray border, gray text
- **Active**: Green tinted background, green border, bold green text
- **With Count**: Shows number badge (e.g., "Tesco (5)")

**Props**:
```typescript
interface FilterChipProps {
  label: string;          // Display text
  active: boolean;        // Active state
  onPress: () => void;    // Toggle handler
  icon?: string;          // Optional Ionicon name
  count?: number;         // Optional count badge
}
```

**Usage**:
```tsx
<FilterChip
  label="Whole Food"
  icon="leaf"
  active={filters.includes('wholeFood')}
  onPress={() => toggleFilter('wholeFood')}
/>
```

**Visual Design**:
- Border radius: 20px (pill shape)
- Padding: 8px vertical, 12px horizontal
- Font: 14px, semibold (600)
- Active: Green (#22c55e) tint
- Shadow: Subtle (1px) for depth

---

### 2. FilterBar

**Purpose**: Container for all filters with horizontal scroll

**Features**:
- Horizontal scroll for many options
- Processing level chips (3 options)
- Supermarket chip (opens modal)
- "Clear All" button (when filters active)
- Results count (shows "X of Y foods")

**Props**:
```typescript
interface FilterBarProps {
  activeFilters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableSupermarkets: string[];
  totalCount: number;
  filteredCount: number;
}
```

**Layout**:
```
┌─────────────────────────────────────┐
│ [Whole Food] [Whole Food+] [Light] │
│ [Supermarket (2)] [Clear All]      │ ← Horizontal scroll
│                                     │
│ Showing 45 of 120 foods             │ ← Results (when filtered)
└─────────────────────────────────────┘
```

**Sticky Behavior**:
- Positioned below header
- Scrolls with content (not fixed)
- Background: White
- Border bottom: Light gray

---

### 3. Supermarket Modal

**Purpose**: Multi-select modal for choosing supermarkets

**Features**:
- List of all available supermarkets
- Checkmarks for selected items
- "Clear" button - Removes all supermarket filters
- "Done" button - Closes modal, shows count

**Layout**:
```
┌─────────────────────────────────────┐
│  Filter by Supermarket          [X] │ ← Header
├─────────────────────────────────────┤
│  [store] Tesco              ✓       │
│  [store] Sainsbury's        ✓       │
│  [store] Asda                       │
│  [store] Waitrose                   │
│  ...                                │ ← Scrollable list
├─────────────────────────────────────┤
│  [Clear]        [Done (2)]          │ ← Footer
└─────────────────────────────────────┘
```

**Interaction**:
1. Tap "Supermarket" chip → Modal opens
2. Tap supermarkets to select/deselect
3. See checkmarks for selected
4. Tap "Done" → Modal closes, chip shows count
5. Tap "Clear" → All deselected, modal closes

---

## Filter Logic

### FilterState Type

```typescript
interface FilterState {
  processingLevels: ProcessingLevelType[];  // ['wholeFood', 'lightlyProcessed']
  supermarkets: string[];                   // ['Tesco', 'Sainsbury\'s']
}
```

### How Filters Work

**Empty State** (No filters):
- Show all foods
- No "Clear All" button
- No results count

**Filters Applied**:
1. Processing levels are **OR** logic
   - "Whole Food" OR "Lightly Processed"
   - Shows foods matching ANY selected level

2. Supermarkets are **OR** logic
   - "Tesco" OR "Sainsbury's"
   - Shows foods from ANY selected supermarket

3. Processing + Supermarket are **AND** logic
   - (Whole Food OR Lightly) AND (Tesco OR Sainsbury's)
   - Food must match at least one from each category

**Example**:
```
Filters active:
- Processing: Whole Food, Lightly Processed
- Supermarket: Tesco

Result: Shows foods that are:
  (Whole Food OR Lightly Processed) AND from Tesco
```

### Filter Utilities

**`applyFilters()`** - Main filter function:
```typescript
const filtered = applyFilters(
  foods,           // All foods
  filters,         // Active filters
  searchQuery      // Optional search
);
```

**`getUniqueSupermarkets()`** - Extract supermarket list:
```typescript
const supermarkets = getUniqueSupermarkets(foods);
// Returns: ['Tesco', 'Sainsbury\'s', 'Asda'] (sorted)
```

---

## Integration

### HomeScreen & AisleDetailScreen

Both screens use identical filter pattern:

**State**:
```typescript
const [filters, setFilters] = useState<FilterState>({
  processingLevels: [],
  supermarkets: [],
});
const [availableSupermarkets, setAvailableSupermarkets] = useState<string[]>([]);
```

**Filter Application**:
```typescript
useEffect(() => {
  const filtered = applyFilters(foods, filters, searchQuery);
  setFilteredFoods(filtered);
}, [searchQuery, foods, filters]);
```

**Supermarket Extraction**:
```typescript
useEffect(() => {
  if (foods.length > 0) {
    const supermarkets = getUniqueSupermarkets(foods);
    setAvailableSupermarkets(supermarkets);
  }
}, [foods]);
```

**UI Placement**:
```tsx
{/* Header with search */}
<View style={styles.header}>...</View>

{/* Filter Bar (hidden when searching) */}
{!isSearchActive && (
  <FilterBar
    activeFilters={filters}
    onFiltersChange={setFilters}
    availableSupermarkets={availableSupermarkets}
    totalCount={foods.length}
    filteredCount={filteredFoods.length}
  />
)}

{/* Food Grid */}
<FoodGrid foods={filteredFoods} ... />
```

---

## UX Patterns & Best Practices

### 1. Progressive Disclosure
- Start simple: Show 3 processing chips + 1 supermarket chip
- Expand complexity: Modal for long supermarket list
- Don't overwhelm: Hide filters during search

### 2. Clear Feedback
- **Visual**: Active chips have green tint + bold text
- **Numerical**: Count badges show number selected
- **Results**: "Showing X of Y" tells impact immediately

### 3. Easy Recovery
- **"Clear All"**: One tap removes all filters
- **Individual**: Tap active chip to deselect
- **No Dead Ends**: Always show clear path back

### 4. Performance
- **Memoization**: Filters only recalculate on change
- **Efficient Logic**: Simple includes() checks
- **No Lag**: Instant feedback on toggle

### 5. Accessibility
- **Touch Targets**: 44pt minimum (iOS HIG)
- **Color**: Not sole indicator (icons + text)
- **Contrast**: WCAG AA compliant
- **Screen Readers**: Proper labels and states

---

## Visual Design Specs

### Colors

**Inactive Chip**:
- Background: `#FFFFFF` (white)
- Border: `#E5E5E5` (neutral-200)
- Text: `#6b7280` (text-secondary)

**Active Chip**:
- Background: `#E0FFE7` (green-50)
- Border: `#3CC161` (green-600)
- Text: `#1F5932` (green-950)

**Count Badge (Active)**:
- Background: `#3CC161` (green-600)
- Text: `#FFFFFF` (white)

### Typography

**Chip Label**:
- Font: System
- Size: 14px
- Weight: 600 (semibold), 700 when active

**Results Text**:
- Font: System
- Size: 12px
- Weight: 600
- Color: `#6b7280` (text-secondary)

**Modal Title**:
- Font: System
- Size: 20px
- Weight: 700
- Color: `#1f2937` (text-primary)

### Spacing

- Chip padding: 8px vertical, 12px horizontal
- Chip gap: 8px (between chips)
- Bar padding: 16px all sides
- Icon margin: 4px right
- Count badge margin: 6px left

### Shadows

**Chip (Inactive)**:
```
shadowColor: #000000
shadowOffset: { width: 0, height: 1 }
shadowOpacity: 0.05
shadowRadius: 2
elevation: 1
```

**Chip (Active)**:
```
shadowOpacity: 0.1
shadowRadius: 3
elevation: 2
```

**Modal**:
```
shadowColor: #000000
shadowOffset: { width: 0, height: -4 }
shadowOpacity: 0.1
shadowRadius: 8
elevation: 10
```

---

## Future Enhancements

### Phase 2 Ideas

1. **Saved Filters**
   - "Save this filter" → Quick access later
   - Presets: "My usual stores", "Whole foods only"

2. **Smart Suggestions**
   - "Based on your favorites, you might like..."
   - "Most popular: Tesco + Whole Food"

3. **Filter Combinations**
   - Show count BEFORE applying
   - "Tesco (45 foods)" preview

4. **Advanced Filters**
   - Price range slider
   - Nutrition filters (high protein, low sugar)
   - Dietary tags (vegan, gluten-free)

5. **Filter Analytics**
   - Track most-used combinations
   - Show "Trending filters"

### Technical Improvements

1. **Performance**
   - Debounce filter changes
   - Virtual scrolling for large lists
   - IndexedDB caching

2. **Persistence**
   - Save filters in AsyncStorage
   - Restore on app launch
   - Sync across devices

3. **Search Integration**
   - Search within filtered results
   - "Search + Filter" combined mode

---

## Accessibility Checklist

- ✅ **Touch targets**: 44×44pt minimum
- ✅ **Color contrast**: WCAG AA (4.5:1)
- ✅ **Not color-only**: Icons + text labels
- ✅ **Screen reader labels**: "Filter by whole food, inactive"
- ✅ **Keyboard navigation**: Can tab through chips
- ✅ **Focus indicators**: Visible focus state
- ✅ **Semantic HTML**: Proper role attributes
- ⚠️ **Reduced motion**: Consider animations for vestibular disorders

---

## Testing Scenarios

### Functional Tests

1. **Single Filter**
   - Apply "Whole Food" → Shows only whole foods
   - Apply "Tesco" → Shows only Tesco foods

2. **Multiple Filters (Same Category)**
   - "Whole Food" + "Lightly Processed" → Shows both

3. **Multiple Filters (Different Categories)**
   - "Whole Food" + "Tesco" → Shows Tesco whole foods only

4. **Clear All**
   - Active filters → Tap "Clear All" → All foods shown

5. **Search + Filter**
   - Filter by "Tesco" → Search "pasta" → Shows Tesco pasta

6. **Empty Results**
   - Apply impossible combination → Shows "No foods found"

### Edge Cases

- **No Supermarkets**: Food has no supermarket field
- **Unknown Processing**: Food has no nova_group
- **All Filtered Out**: No foods match → Show empty state
- **Modal Dismiss**: Tap outside → Modal closes, filters preserved

### User Flows

**New User**:
1. Opens app → Sees all foods
2. Notices filter bar
3. Taps "Whole Food" → List updates instantly
4. Sees "Showing X of Y foods"
5. Understands concept immediately

**Power User**:
1. Opens app
2. Quickly taps "Whole Food" + "Lightly Processed"
3. Taps "Supermarket" → Selects Tesco + Sainsbury's
4. Gets personalized feed in 3 seconds

---

## Summary

The filter system provides:

✅ **Instant Gratification** - See results immediately
✅ **Clear State** - Always know what's active
✅ **Easy Exploration** - Try combinations freely
✅ **Quick Reset** - One tap back to all
✅ **Scalable** - Works with 3 or 300 supermarkets
✅ **Familiar** - Uses established UI patterns
✅ **Accessible** - Works for everyone

**Key Insight**: Filters should feel like a toy, not a tool. Users should want to play with combinations, not struggle to find options.
