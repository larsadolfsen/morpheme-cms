// "Standardblokke" on the start screen: the texts every copy of a block has, a screen for each block
// (CompanyForm.tsx). The blocks' own are in their folders (shared.ts in src/apps/<app>/blocks/<type>/, saved in
// src/data/blocks.json), and the editor makes their screens itself (sharedParts in
// packages/editor/src/site.ts). Here only what is the site's: "Book en tid", whose texts are the
// site's buttons too, in src/data/booking.json.
import { CalendarCheck } from '@phosphor-icons/react';
import type { Part } from '../src/schema';

const back = { href: '#blokke', label: 'Standardblokke' };

export const blockParts: Part[] = (
  [
    {
      id: 'booking',
      label: 'Book en tid',
      icon: CalendarCheck,
      file: 'src/data/booking.json',
      fields: [
        { name: 'heading', label: 'Overskrift', type: 'string', required: true },
        { name: 'text', label: 'Tekst', type: 'text', required: true },
        { name: 'book', label: 'Knaptekst (book)', type: 'string', required: true, max: 30 },
        {
          name: 'call',
          label: 'Knaptekst (ring)',
          type: 'string',
          required: true,
          max: 20,
          hint: 'Telefonnummeret vises efter teksten.',
        },
      ],
    },
  ] as Part[]
).map((p) => ({ ...p, back }));
