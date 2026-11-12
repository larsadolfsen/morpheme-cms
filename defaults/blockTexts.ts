// "Block templates" in the menu: the texts every copy of a block has, a screen for each block
// (CompanyForm.tsx). The blocks' own are in their folders (shared.ts in src/apps/<app>/blocks/<type>/, saved in
// src/data/blocks.json), and the editor makes their screens itself (sharedParts in
// packages/editor/src/site.ts). Here only what is the site's: "Book an appointment", whose texts are the
// site's buttons too, in src/data/booking.json.
import { CalendarCheck } from '@phosphor-icons/react';
import type { Part } from '../src/schema';

const back = { href: '#blocks', label: 'Block templates' };

export const blockParts: Part[] = (
  [
    {
      id: 'booking',
      label: 'Book an appointment',
      icon: CalendarCheck,
      file: 'src/data/booking.json',
      fields: [
        { name: 'heading', label: 'Heading', type: 'string', required: true },
        { name: 'text', label: 'Text', type: 'text', required: true },
        { name: 'book', label: 'Button text (book)', type: 'string', required: true, max: 30 },
        {
          name: 'call',
          label: 'Button text (call)',
          type: 'string',
          required: true,
          max: 20,
          hint: 'The phone number is shown after the text.',
        },
      ],
    },
  ] as Part[]
).map((p) => ({ ...p, back }));
