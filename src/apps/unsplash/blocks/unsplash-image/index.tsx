import { Camera } from '@phosphor-icons/react';
import { defineBlock } from '@interstellarcms/cms/src/blocks';

export default defineBlock({
  label: 'Unsplash image',
  icon: Camera,
  hint: 'Insert an Unsplash photo with automatic photographer credit, aspect ratio, and caption.',
  fields: [
    {
      name: 'src',
      label: 'Image',
      type: 'image',
      required: true,
      hint: 'Choose from the Unsplash tab or your media library.',
    },
    {
      name: 'caption',
      label: 'Caption',
      type: 'string',
      hint: 'Optional caption beneath the photo.',
    },
    {
      name: 'photographer',
      label: 'Photographer',
      type: 'string',
      hint: 'Name of the photographer on Unsplash.',
    },
    {
      name: 'photographerUrl',
      label: 'Photographer link',
      type: 'string',
      hint: "Link to the photographer's Unsplash profile.",
    },
    {
      name: 'alt',
      label: 'Description (alt text)',
      type: 'string',
      hint: 'Short description for screen readers and accessibility.',
    },
    {
      name: 'aspect',
      label: 'Aspect ratio',
      type: 'select',
      options: [
        { label: '16:9 (Landscape)', value: '16/9' },
        { label: '4:3 (Standard)', value: '4/3' },
        { label: '1:1 (Square)', value: '1/1' },
        { label: '3:4 (Portrait)', value: '3/4' },
        { label: 'Original', value: 'auto' },
      ],
    },
    {
      name: 'fullWidth',
      label: 'Full width',
      type: 'boolean',
      toggle: 'Display full width on screen',
    },
  ],
  detail: (props) =>
    [
      String(props.caption || props.alt || 'Unsplash photo'),
      props.photographer ? `Photo: ${props.photographer}` : 'Unsplash',
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
