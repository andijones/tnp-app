/**
 * BottomSheet Design System Component
 *
 * A consistent bottom sheet implementation following The Naked Pantry design system.
 *
 * Usage Example:
 *
 * ```tsx
 * import { BottomSheet, BottomSheetListItem, BottomSheetFooter } from '../components/common/BottomSheet';
 *
 * const [visible, setVisible] = useState(false);
 * const [selectedItems, setSelectedItems] = useState<string[]>([]);
 *
 * const supermarkets = ['ASDA', 'Able & Cole', 'Amazon', 'Daylesford', 'Morrisons'];
 *
 * const handleToggleItem = (item: string) => {
 *   setSelectedItems(prev =>
 *     prev.includes(item)
 *       ? prev.filter(i => i !== item)
 *       : [...prev, item]
 *   );
 * };
 *
 * const handleApply = () => {
 *   // Apply filters
 *   setVisible(false);
 * };
 *
 * const handleClear = () => {
 *   setSelectedItems([]);
 * };
 *
 * <BottomSheet
 *   visible={visible}
 *   onClose={() => setVisible(false)}
 *   title="Filter by Supermarket"
 *   footer={
 *     <BottomSheetFooter
 *       primaryLabel={`Apply (${selectedItems.length})`}
 *       secondaryLabel="Clear"
 *       onPrimaryPress={handleApply}
 *       onSecondaryPress={handleClear}
 *       primaryDisabled={selectedItems.length === 0}
 *     />
 *   }
 * >
 *   <View style={{ gap: 12 }}>
 *     {supermarkets.map((market) => (
 *       <BottomSheetListItem
 *         key={market}
 *         label={market}
 *         selected={selectedItems.includes(market)}
 *         onPress={() => handleToggleItem(market)}
 *       />
 *     ))}
 *   </View>
 * </BottomSheet>
 * ```
 *
 * Design Specifications (from Figma):
 * - Border radius: 16px (top corners only)
 * - Padding: 16px horizontal, 20px vertical
 * - Header border: 1px solid neutral.100
 * - Footer border: 1px solid neutral.100
 * - Shadow: 0px -12px 24px rgba(16, 24, 40, 0.18)
 * - Backdrop: rgba(23, 23, 23, 0.5) with blur
 * - List item spacing: 12px gap
 * - Button height: 52px
 * - Font sizes: 16px (title, list items, buttons)
 */

export { BottomSheet } from './BottomSheet';
export { BottomSheetListItem } from './BottomSheetListItem';
export { BottomSheetFooter } from './BottomSheetFooter';
export { BottomSheetSeparator } from './BottomSheetSeparator';
