import { AddressBook, Bank, CreditCard } from '@phosphor-icons/react';
import type { Part } from '@interstellarcms/cms/src/schema';
import { bankFields, contactFields } from '@site/collections';

/** The parts of "Virksomheden", in their order, at #virksomheden/<id> ("Betaling"'s at #virksomheden/betaling/<id>). */
export const companyParts: Part[] = [
  { id: 'kontakt', label: 'Kontakt', icon: AddressBook, file: 'src/data/contact.json', fields: contactFields },
  {
    id: 'betaling',
    label: 'Betaling',
    icon: CreditCard,
    apps: ['payment'],
    parts: [{ id: 'bank', label: 'Bank', icon: Bank, file: 'src/data/payment.json', fields: bankFields }],
  },
];
