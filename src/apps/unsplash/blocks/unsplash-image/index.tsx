import { Camera } from '@phosphor-icons/react';
import { defineBlock } from '@interstellarcms/cms/src/blocks';

export default defineBlock({
  label: 'Unsplash-billede',
  icon: Camera,
  hint: 'Indsæt et foto fra Unsplash med automatisk fotograf-kreditering, format og billedtekst.',
  fields: [
    {
      name: 'src',
      label: 'Billede',
      type: 'image',
      required: true,
      hint: 'Vælg fra Unsplash-fanen eller dit mediearkiv.',
    },
    {
      name: 'caption',
      label: 'Billedtekst',
      type: 'string',
      hint: 'Valgfri billedtekst under fotografiet.',
    },
    {
      name: 'photographer',
      label: 'Fotograf',
      type: 'string',
      hint: 'Navn på fotografen hos Unsplash.',
    },
    {
      name: 'photographerUrl',
      label: 'Fotografens link',
      type: 'string',
      hint: 'Link til fotografens profil på Unsplash.',
    },
    {
      name: 'alt',
      label: 'Beskrivelse (alt-tekst)',
      type: 'string',
      hint: 'Kort beskrivelse til skærmlæsere og tilgængelighed.',
    },
    {
      name: 'aspect',
      label: 'Format',
      type: 'select',
      options: [
        { label: '16:9 (Vandret)', value: '16/9' },
        { label: '4:3 (Klassisk)', value: '4/3' },
        { label: '1:1 (Kvadratisk)', value: '1/1' },
        { label: '3:4 (Portræt)', value: '3/4' },
        { label: 'Originalt', value: 'auto' },
      ],
    },
    {
      name: 'fullWidth',
      label: 'Fuld bredde',
      type: 'boolean',
      toggle: 'Vis i fuld bredde på skærmen',
    },
  ],
  detail: (props) =>
    [
      String(props.caption || props.alt || 'Unsplash-foto'),
      props.photographer ? `Foto: ${props.photographer}` : 'Unsplash',
    ].filter(Boolean),
  preview: true,
  example: {
    src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80&auto=format',
    caption: 'Yosemite Valley i morgendis',
    photographer: 'Bailey Zindel',
    photographerUrl: 'https://unsplash.com/@baileyzindel?utm_source=interstellar-cms&utm_medium=referral',
    alt: 'Bjerglandskab og flod i Yosemite National Park',
    aspect: '16/9',
    fullWidth: false,
  },
});
