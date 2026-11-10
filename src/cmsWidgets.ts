// The widgets the CMS brings, by their key (the full id "cms:<key>", widgets.ts allWidgets). Each widget is a component in
// src/widgets/<key>.tsx; the labels are the editor's texts (t), so this file imports React code and is not read by
// node --test (widgets.ts is).
import { ClockCounterClockwise } from '@phosphor-icons/react';
import { t } from './i18n';
import type { WidgetDefinition } from './widgets';
import { ContinueWidget } from './widgets/continue';

export const cmsWidgets: Record<string, WidgetDefinition> = {
  continue: {
    label: t.library.continueWidgetLabel,
    hint: t.library.continueWidgetHint,
    icon: ClockCounterClockwise,
    component: ContinueWidget,
  },
};
