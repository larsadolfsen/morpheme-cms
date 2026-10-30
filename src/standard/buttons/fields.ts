// The buttons of a "Knapper" block, and the shared ones (shared.ts): where each goes (a page, or where
// the site's config says, `buttonTargets`, named in the site's language), its text, kind and icon. A target that
// picks something (`pick`: a promotion to open) has a field for it, offering what is shown on the page being edited,
// and is offered only while there is something to pick there.
import { config } from '@site/config';
import { siteText, t } from '../../i18n';
import { iconOptions } from '../../icon';
import type { Field } from '../../schema';
import type { BlockData } from '../../blocks';
import type { ButtonTargetName } from '../site';
import { buttonKinds } from '../view';

/** A button as the field writes it; `open`: what a target that picks something has picked (a promotion's file name). */
export type Button = { label?: string; to?: string; href?: string; open?: string; kind?: string; icon?: string };

/** Where the buttons can go besides a page (the site's config). */
export const targets: ButtonTargetName[] = config.buttonTargets ?? [];

export const buttonList: Field = {
  name: 'items',
  label: t.blocks.buttons.items,
  singular: t.blocks.buttons.item,
  type: 'list',
  summary: 'label',
  fields: [
    {
      name: 'label',
      label: t.blocks.buttons.text,
      type: 'string',
      max: 30,
      hint: [
        t.blocks.buttons.textHint(targets.filter((o) => !o.pick).map((o) => siteText(o.label))),
        ...targets.flatMap((o) => (o.note ? [siteText(o.note)] : [])),
      ].join(' '),
    },
    {
      name: 'to',
      label: t.blocks.buttons.to,
      type: 'select',
      required: true,
      default: targets[0]?.value ?? 'page',
      options: [
        ...targets.map((o) => ({ label: siteText(o.label), value: o.value, onPage: o.pick })),
        { label: t.blocks.buttons.page, value: 'page' },
      ],
    },
    ...targets.flatMap((o): Field[] =>
      o.pick
        ? [
            {
              name: 'open',
              label: siteText(o.pickLabel ?? o.label),
              type: 'relation',
              to: o.pick,
              onPage: true,
              required: true,
              only: { field: 'to', is: [o.value] },
            },
          ]
        : [],
    ),
    { name: 'href', label: t.blocks.buttons.href, type: 'relation', to: 'pages', fixed: true, hint: t.blocks.buttons.hrefHint },
    {
      name: 'kind',
      label: t.blocks.buttons.kind,
      type: 'select',
      required: true,
      default: 'filled',
      options: buttonKinds.map((k) => ({ label: t.blocks.buttons.kinds[k], value: k })),
    },
    {
      name: 'icon',
      label: t.blocks.buttons.icon,
      type: 'select',
      icons: true,
      hint: t.blocks.buttons.iconHint,
      options: [
        { label: t.blocks.buttons.arrow, value: 'arrow-right' },
        { label: t.blocks.buttons.calendar, value: 'calendar-blank' },
        ...iconOptions(t.blocks.icons),
      ],
    },
  ],
};

/** A button's text: its own, or its target's (the site's data: BlockData.site.buttons), what it opens (the choice
 * picked, Option.text: a promotion's) or its page's name, with what comes after it (the phone number). */
export const textOf = (b: Button, data: BlockData) => {
  const own = b.label?.trim();
  if (b.to === 'page') return own || data.site.pages.find((p) => p.path === b.href)?.title || b.href || '';
  const pick = targets.find((o) => o.value === b.to)?.pick;
  if (pick) {
    const picked = data.relations[pick]?.find((o) => o.value === b.open);
    return own || picked?.text || data.site.buttons[picked?.as ?? '']?.text || '';
  }
  const target = data.site.buttons[b.to ?? ''];
  return [own || target?.text, target?.after].filter(Boolean).join(' ');
};
