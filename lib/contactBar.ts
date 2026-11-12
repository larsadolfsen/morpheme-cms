// A promotion saved as a contact bar (the kind "Contact bar", `contactbar`: the buttons "Call" and "Contact" at the
// bottom of a phone's screen, with the fields `phoneLabel`, `contactLabel` and `contactPage`), which is now an action
// bar ("Action bar", `bookingbar`) with those two buttons: the first calls, the second goes to its page (without
// one, the contact page, `contactPath`), each with its own text. The site reads it so (site/popups.ts), and the editor
// too (`upgrade` on "Promotion" in defaults/collections.ts), which saves it so. Any other promotion is as it is.
export function fromContactBar(data: Record<string, unknown>, contactPath: string): Record<string, unknown> {
  if (data.type !== 'contactbar') return data;
  const { phoneLabel, contactLabel, contactPage, ...rest } = data;
  const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
  return {
    ...rest,
    type: 'bookingbar',
    buttons: [
      { label: text(phoneLabel), to: 'phone' },
      { label: text(contactLabel), to: 'page', href: text(contactPage) || contactPath },
    ],
  };
}
