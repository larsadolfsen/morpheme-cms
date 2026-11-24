// "Business": the business, in parts, each a screen of its own (CompanyForm.tsx): its phone, e-mail and address
// (src/data/contact.json) and its bank details (src/data/payment.json, under "Payment", where a site may add its
// other ways to pay, and where the settings of the apps installed that are a way to pay come after, as MobilePay's),
// used all over the site; and its social media (src/data/social.json): the profiles, a list of links added with the FAB, and
// the post's share buttons.
// The logo and the icon are under "Appearance" (BrandForm.tsx); the link to the calendar in Calendly is the app Calendly's (morpheme-apps/apps/calendly/).
import type { Part } from '../src/schema';
import { bankFields, contactFields, socialFields } from '@site/collections';
import { upgradeSocial } from '../site/social.mjs';
import { materialIcon } from '../src/icon';

/** The parts of "Business", in their order, at #company/<id> ("Payment"'s at #company/payment/<id>). */
export const companyParts: Part[] = [
  { id: 'contact', label: 'Contact', icon: materialIcon('contacts'), file: 'src/data/contact.json', fields: contactFields },
  {
    id: 'social-media',
    label: 'Social media',
    icon: materialIcon('share'),
    file: 'src/data/social.json',
    fields: socialFields,
    // A file from before the profiles were a list (a key for each network) is read and saved as one.
    upgrade: upgradeSocial,
    // A switch missing from the file (or a file not there yet) is on; the form would show it off without this.
    defaults: { shareFacebook: true, shareX: true, shareLinkedin: true, sharePinterest: true, shareCopyLink: true },
  },
  {
    id: 'payment',
    label: 'Payment',
    icon: materialIcon('credit_card'),
    apps: ['payments'],
    parts: [{ id: 'bank', label: 'Bank', icon: materialIcon('account_balance'), file: 'src/data/payment.json', fields: bankFields }],
  },
];
