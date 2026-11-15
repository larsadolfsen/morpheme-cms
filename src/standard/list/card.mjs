// The card of a List ("Card" and "Card style"): `card: 'one'` puts the whole list in one card of the style `design`, the same key and values as
// Cards (outlined is the empty one), read as Cards reads them: an unknown style is outlined. Without `card` there is no card.
/** @param {Record<string, any>} props @returns {{ card?: 'one'; design?: 'outlined' | 'filled' | 'elevated' }} */
export const cardOf = (props) =>
  props.card === 'one' ? { card: 'one', design: props.design === 'filled' || props.design === 'elevated' ? props.design : 'outlined' } : {};
