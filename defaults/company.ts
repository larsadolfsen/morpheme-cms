// "Virksomheden": the business, in parts, each a screen of its own (CompanyForm.tsx): its phone, e-mail and address
// (src/data/contact.json) and its bank details (src/data/payment.json, under "Betaling", where a site may add its
// other ways to pay, and where the settings of the apps installed that are a way to pay come after, as MobilePay's),
// used all over the site; and its social media (src/data/social.json): the profiles and the post's share buttons.
// The logo and the icon are under "Udseende" (BrandForm.tsx); the link to the calendar in Calendly is the app Calendly's (morpheme-apps/apps/calendly/).
import { AddressBook, Bank, CreditCard, ShareNetwork } from '@phosphor-icons/react';
import type { Part } from '../src/schema';
import { bankFields, contactFields, socialFields } from '@site/collections';

/** The parts of "Virksomheden", in their order, at #virksomheden/<id> ("Betaling"'s at #virksomheden/betaling/<id>). */
export const companyParts: Part[] = [
  { id: 'kontakt', label: 'Kontakt', icon: AddressBook, file: 'src/data/contact.json', fields: contactFields },
  {
    id: 'sociale-medier',
    label: 'Sociale medier',
    icon: ShareNetwork,
    file: 'src/data/social.json',
    fields: socialFields,
    // A switch missing from the file (or a file not there yet) is on; the form would show it off without this.
    defaults: { shareFacebook: true, shareX: true, shareLinkedin: true, sharePinterest: true, shareCopyLink: true },
  },
  {
    id: 'betaling',
    label: 'Betaling',
    icon: CreditCard,
    apps: ['payment'],
    parts: [{ id: 'bank', label: 'Bank', icon: Bank, file: 'src/data/payment.json', fields: bankFields }],
  },
];
