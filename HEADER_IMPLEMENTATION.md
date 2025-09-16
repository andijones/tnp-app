# Blur Header Implementation Guide - Enhanced Transparency

## Overview
I've created two reusable blur header components that provide depth and transparency across your app:

### 1. BlurHeader (White/Light Theme)
- For screens with light backgrounds
- Uses `rgba(255, 255, 255, 0.75)` with **75% opacity** for better transparency
- **Blur intensity: 80** for optimal see-through effect
- Perfect for detail screens and modal overlays

### 2. GreenBlurHeader (Green Theme)
- For screens with green branding
- Uses `rgba(31, 89, 50, 0.65)` with **65% opacity** for maximum transparency
- **Blur intensity: 80** for optimal see-through effect
- Perfect for main screens and navigation headers

## Tab Bar Updates
- **Background opacity reduced** to `rgba(31, 89, 50, 0.65)` - **65% opacity**
- **Blur intensity: 80** for better content visibility
- **Enhanced see-through effect** while maintaining usability

## Implementation Examples

### FoodDetailScreen Usage
Replace the existing header in your FoodDetailScreen with:

```tsx
import { BlurHeader } from '../../components/common/BlurHeader';

// Replace your existing header View with:
<BlurHeader
  showBackButton={true}
  onBackPress={() => navigation.goBack()}
  rightComponent={
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <TouchableOpacity onPress={shareFood}>
        <Ionicons name="share-outline" size={22} color={theme.colors.text.primary} />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleToggleFavorite}>
        <Ionicons
          name={isFavorite(foodId) ? 'heart' : 'heart-outline'}
          size={22}
          color={isFavorite(foodId) ? theme.colors.error : theme.colors.text.primary}
        />
      </TouchableOpacity>
    </View>
  }
/>
```

### HomeScreen Usage
For the main home screen with green header:

```tsx
import { GreenBlurHeader } from '../../components/common/GreenBlurHeader';

<GreenBlurHeader
  showLogo={true}
  rightComponent={
    <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
      <Ionicons name="person-outline" size={22} color="#FFFFFF" />
    </TouchableOpacity>
  }
>
  {/* Search bar or other content can go here */}
  <TextInput
    style={searchStyles.input}
    placeholder="Search foods..."
    placeholderTextColor="rgba(255, 255, 255, 0.7)"
    value={searchQuery}
    onChangeText={setSearchQuery}
  />
</GreenBlurHeader>
```

### Profile/Settings Screens
```tsx
<BlurHeader
  title="Profile Settings"
  showBackButton={true}
  onBackPress={() => navigation.goBack()}
/>
```

## Key Benefits

### 🌫️ **Depth & Modern Feel**
- Content scrolls behind semi-transparent headers
- Native blur effect matching iOS/Android system apps
- Creates visual hierarchy and premium aesthetic

### 🎨 **Design Consistency**
- Same 95% opacity across tab bar and headers
- Consistent blur intensity and styling
- Maintains brand colors while adding sophistication

### ⚡ **Performance**
- Uses native `expo-blur` for optimal performance
- Reusable components reduce code duplication
- Proper z-index and positioning for smooth scrolling

### 📱 **Platform Native**
- Follows iOS and Android design patterns
- Proper status bar handling
- Safe area support built-in

## Usage Tips

1. **Replace existing solid headers** with blur versions
2. **Use GreenBlurHeader** for main app screens
3. **Use BlurHeader** for detail and modal screens
4. **Add `paddingTop` to content** to account for absolute positioned headers
5. **Test scrolling behavior** to ensure content shows through properly

The blur headers will create the same depth feeling as your updated tab bar, making the entire app feel cohesive and modern!