// The widgets the CMS brings, by their key (the full id "cms:<key>", widgets.ts allWidgets). Each widget is a component in
// src/widgets/<key>.tsx; the labels are the editor's texts (t), so this file imports React code and is not read by
// node --test (widgets.ts is).
import { CalendarBlank, CheckCircle, ClockCounterClockwise, PencilSimple } from '@phosphor-icons/react';
import { t } from './i18n';
import type { WidgetDefinition } from './widgets';
import { ContinueWidget } from './widgets/continue';
import { UnfinishedWidget } from './widgets/unfinished';
import { BlogRhythmWidget } from './widgets/blogRhythm';
import { StatusWidget } from './widgets/status';
import { defineSettings } from './apps';

export const cmsWidgets: Record<string, WidgetDefinition> = {
  continue: {
    label: t.library.continueWidgetLabel,
    hint: t.library.continueWidgetHint,
    icon: ClockCounterClockwise,
    component: ContinueWidget,
  },
  unfinished: {
    label: t.library.unfinishedWidgetLabel,
    hint: t.library.unfinishedWidgetHint,
    icon: PencilSimple,
    component: UnfinishedWidget,
  },
  'blog-rhythm': {
    label: t.library.blogRhythmWidgetLabel,
    hint: t.library.blogRhythmWidgetHint,
    icon: CalendarBlank,
    settings: defineSettings({
      fields: [
        {
          name: 'every',
          label: t.library.blogRhythmEvery,
          type: 'select',
          segments: true,
          options: [
            { label: t.library.blogRhythmEveryWeek, value: 'week' },
            { label: t.library.blogRhythmEveryTwoWeeks, value: 'two-weeks' },
            { label: t.library.blogRhythmEveryMonth, value: 'month' },
          ],
        },
      ],
      values: { every: 'month' },
    }),
    component: BlogRhythmWidget,
  },
  status: {
    label: t.library.statusWidgetLabel,
    hint: t.library.statusWidgetHint,
    icon: CheckCircle,
    component: StatusWidget,
  },
};
