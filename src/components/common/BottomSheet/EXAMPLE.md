# BottomSheet Component - Usage Examples

A consistent bottom sheet design system component following The Naked Pantry design specifications from Figma.

## Design Specifications

- **Border radius**: 16px (top corners only)
- **Padding**: 16px horizontal, 20px vertical
- **Header border**: 1px solid neutral.100
- **Footer border**: 1px solid neutral.100
- **Shadow**: 0px -12px 24px rgba(16, 24, 40, 0.18)
- **Backdrop**: rgba(23, 23, 23, 0.5)
- **List item spacing**: 12px gap
- **Button height**: 52px
- **Font sizes**: 16px (title, list items, buttons)
- **Animations**: Spring slide-up, fade-in backdrop

## Components

### `BottomSheet`
Main container component with header, content area, and optional footer.

**Props**:
- `visible: boolean` - Controls visibility
- `onClose: () => void` - Close handler
- `title: string` - Header title
- `children: React.ReactNode` - Content
- `footer?: React.ReactNode` - Optional footer

### `BottomSheetListItem`
Selectable list item with optional checkmark.

**Props**:
- `label: string` - Item text
- `selected?: boolean` - Shows checkmark when true
- `onPress: () => void` - Press handler

### `BottomSheetFooter`
Two-button footer (Clear/Apply pattern).

**Props**:
- `primaryLabel: string` - Primary button text (e.g., "Apply (1)")
- `secondaryLabel: string` - Secondary button text (e.g., "Clear")
- `onPrimaryPress: () => void` - Primary action
- `onSecondaryPress: () => void` - Secondary action
- `primaryDisabled?: boolean` - Disable primary button

### `BottomSheetSeparator`
Thin horizontal divider line.

## Example 1: Filter Bottom Sheet (Single Select)

```tsx
import React, { useState } from 'react';
import { View } from 'react-native';
import {
  BottomSheet,
  BottomSheetListItem,
  BottomSheetFooter,
} from '../components/common/BottomSheet';

export const FoodGroupFilter = () => {
  const [visible, setVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const foodGroups = [
    'Fruits & Vegetables',
    'Meat & Poultry',
    'Dairy & Eggs',
    'Grains & Cereals',
    'Nuts & Seeds',
  ];

  const handleApply = () => {
    // Apply the filter
    console.log('Selected:', selectedGroup);
    setVisible(false);
  };

  const handleClear = () => {
    setSelectedGroup(null);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={() => setVisible(false)}
      title="Filter by Food Group"
      footer={
        <BottomSheetFooter
          primaryLabel={selectedGroup ? `Apply (1)` : 'Apply'}
          secondaryLabel="Clear"
          onPrimaryPress={handleApply}
          onSecondaryPress={handleClear}
          primaryDisabled={!selectedGroup}
        />
      }
    >
      <View style={{ gap: 12 }}>
        {foodGroups.map((group) => (
          <BottomSheetListItem
            key={group}
            label={group}
            selected={selectedGroup === group}
            onPress={() => setSelectedGroup(group)}
          />
        ))}
      </View>
    </BottomSheet>
  );
};
```

## Example 2: Filter Bottom Sheet (Multi-Select)

```tsx
import React, { useState } from 'react';
import { View } from 'react-native';
import {
  BottomSheet,
  BottomSheetListItem,
  BottomSheetFooter,
} from '../components/common/BottomSheet';

export const SupermarketFilter = () => {
  const [visible, setVisible] = useState(false);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);

  const supermarkets = [
    'ASDA',
    'Able & Cole',
    'Amazon',
    'Daylesford',
    'Morrisons',
    'Sainsbury\'s',
    'Tesco',
    'Waitrose',
  ];

  const handleToggleMarket = (market: string) => {
    setSelectedMarkets((prev) =>
      prev.includes(market)
        ? prev.filter((m) => m !== market)
        : [...prev, market]
    );
  };

  const handleApply = () => {
    // Apply filters
    console.log('Selected markets:', selectedMarkets);
    setVisible(false);
  };

  const handleClear = () => {
    setSelectedMarkets([]);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={() => setVisible(false)}
      title="Filter by Supermarket"
      footer={
        <BottomSheetFooter
          primaryLabel={
            selectedMarkets.length > 0
              ? `Apply (${selectedMarkets.length})`
              : 'Apply'
          }
          secondaryLabel="Clear"
          onPrimaryPress={handleApply}
          onSecondaryPress={handleClear}
          primaryDisabled={selectedMarkets.length === 0}
        />
      }
    >
      <View style={{ gap: 12 }}>
        {supermarkets.map((market) => (
          <BottomSheetListItem
            key={market}
            label={market}
            selected={selectedMarkets.includes(market)}
            onPress={() => handleToggleMarket(market)}
          />
        ))}
      </View>
    </BottomSheet>
  );
};
```

## Example 3: Processing Level Filter

```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  BottomSheet,
  BottomSheetListItem,
  BottomSheetFooter,
} from '../components/common/BottomSheet';
import { theme } from '../../theme';

export const ProcessingLevelFilter = () => {
  const [visible, setVisible] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);

  const processingLevels = [
    { value: 1, label: 'Whole Food', description: 'Natural and unprocessed' },
    { value: 2, label: 'Extracted Foods', description: 'Single ingredient' },
    { value: 3, label: 'Lightly Processed', description: 'Few added ingredients' },
  ];

  const handleToggleLevel = (value: number) => {
    setSelectedLevels((prev) =>
      prev.includes(value)
        ? prev.filter((l) => l !== value)
        : [...prev, value]
    );
  };

  const handleApply = () => {
    console.log('Selected levels:', selectedLevels);
    setVisible(false);
  };

  const handleClear = () => {
    setSelectedLevels([]);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={() => setVisible(false)}
      title="Filter by Processing Level"
      footer={
        <BottomSheetFooter
          primaryLabel={
            selectedLevels.length > 0
              ? `Apply (${selectedLevels.length})`
              : 'Apply'
          }
          secondaryLabel="Clear"
          onPrimaryPress={handleApply}
          onSecondaryPress={handleClear}
          primaryDisabled={selectedLevels.length === 0}
        />
      }
    >
      <View style={{ gap: 12 }}>
        {processingLevels.map((level) => (
          <View key={level.value}>
            <BottomSheetListItem
              label={level.label}
              selected={selectedLevels.includes(level.value)}
              onPress={() => handleToggleLevel(level.value)}
            />
            {selectedLevels.includes(level.value) && (
              <Text style={styles.description}>{level.description}</Text>
            )}
          </View>
        ))}
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  description: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 4,
    marginLeft: 0,
  },
});
```

## Example 4: Simple Action Sheet (No Footer)

```tsx
import React, { useState } from 'react';
import { View } from 'react-native';
import { BottomSheet, BottomSheetListItem } from '../components/common/BottomSheet';

export const SortOptions = () => {
  const [visible, setVisible] = useState(false);
  const [sortBy, setSortBy] = useState<string>('name');

  const sortOptions = [
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'recent', label: 'Recently Added' },
    { value: 'ingredients', label: 'Fewest Ingredients' },
  ];

  const handleSelect = (value: string) => {
    setSortBy(value);
    setVisible(false);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={() => setVisible(false)}
      title="Sort By"
    >
      <View style={{ gap: 12 }}>
        {sortOptions.map((option) => (
          <BottomSheetListItem
            key={option.value}
            label={option.label}
            selected={sortBy === option.value}
            onPress={() => handleSelect(option.value)}
          />
        ))}
      </View>
    </BottomSheet>
  );
};
```

## Example 5: Custom Content

```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  BottomSheet,
  BottomSheetFooter,
  BottomSheetSeparator,
} from '../components/common/BottomSheet';
import { Input } from '../components/common/Input';
import { theme } from '../../theme';

export const ReportFood = () => {
  const [visible, setVisible] = useState(false);
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    console.log('Report submitted:', reason);
    setVisible(false);
    setReason('');
  };

  const handleCancel = () => {
    setVisible(false);
    setReason('');
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={() => setVisible(false)}
      title="Report Food Item"
      footer={
        <BottomSheetFooter
          primaryLabel="Submit Report"
          secondaryLabel="Cancel"
          onPrimaryPress={handleSubmit}
          onSecondaryPress={handleCancel}
          primaryDisabled={reason.trim().length === 0}
        />
      }
    >
      <View>
        <Text style={styles.label}>
          Tell us what's wrong with this food item:
        </Text>
        <Input
          value={reason}
          onChangeText={setReason}
          placeholder="Incorrect information, inappropriate content, etc."
          multiline
          numberOfLines={4}
        />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 12,
  },
});
```

## Tips

1. **Keep it simple**: Bottom sheets work best with focused, single-purpose content
2. **Use for filters**: Ideal for multi-select filters with Apply/Clear actions
3. **Touch outside to close**: Users expect tapping the backdrop to dismiss
4. **Disable primary button**: When no selection is made, disable the Apply button
5. **Show count in button**: Display selection count in Apply button (e.g., "Apply (3)")
6. **Consistent spacing**: Use 12px gap between list items
7. **Animated entry**: The component includes smooth slide-up and fade-in animations
8. **Safe area**: Automatically handles safe areas on devices with notches

## Accessibility

- Touch targets are 44×44 minimum
- Close button has hit slop for easier tapping
- Buttons have clear labels
- Uses semantic colors from design system
- Supports screen readers (future enhancement)

## Migration Guide

If you have existing bottom sheet implementations, replace them with this design system component:

**Before**:
```tsx
<Modal visible={visible} transparent>
  <View style={styles.backdrop}>
    <View style={styles.sheet}>
      {/* Custom content */}
    </View>
  </View>
</Modal>
```

**After**:
```tsx
<BottomSheet
  visible={visible}
  onClose={() => setVisible(false)}
  title="Your Title"
>
  {/* Same content */}
</BottomSheet>
```
