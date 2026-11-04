// "Dele" › "UI-komponenter" (BlockParts.tsx), the group "Dialoger, ark og karrusel": the theme's dialog, bottom sheet and
// carousel (packages/editor/theme/ui/, through @site/editor) as the site draws them, with made-up texts and the plain
// picture: a basic dialog, one with an icon, a list and a divider, the container alone (a pop-up's box) and a
// full-screen one; the modal bottom sheet, three times, one per wide (a button opens it in a real dialog: on a phone at
// half height, pulled up to full height; on a computer a dialog, a side sheet or a sheet with margins) and the standard
// one collapsed, half expanded and expanded (and with the resize and collapse buttons) at the bottom of a frame with a
// page behind it (it can be dragged and tapped there, as on the site; from the medium width they become a side sheet,
// and one with wide="sheet" stays a sheet); and the carousel in each of Material's
// layouts. The modal sheet, the standard sheet and the carousels do something here; the other buttons lead nowhere.
import type { ReactNode } from 'react';
import { SiteBottomSheet, SiteButton, SiteCarousel, SiteCheckbox, SiteDialog, SiteTextField } from './themeUi';
import ModalSheetSample from './ModalSheetSample';
import { Part } from './PartsShown';
import { Preview } from './ui';
import { examplePicture } from './examples';
import { t } from './i18n';

const say = t.parts.screens.containment;
const numbers = [1, 2, 3, 4, 5, 6];

/** A label over an example: what the example shows. */
function Shown({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">{label}</p>
      {children}
    </div>
  );
}

/** The plain picture with its number, which fades as its item shrinks (--carousel-mask, carouselLayout.ts). */
function Picture({ n }: { n: number }) {
  return (
    <>
      <img src={examplePicture} alt="" />
      <span className="absolute bottom-3 left-4 font-medium" style={{ opacity: 'calc(1 - 3 * var(--carousel-mask, 0))' }}>
        {say.picture(n)}
      </span>
    </>
  );
}

function Dialogs() {
  const actions = (
    <>
      <SiteButton kind="text">{say.cancel}</SiteButton>
      <SiteButton>{say.accept}</SiteButton>
    </>
  );
  return (
    <div className="grid gap-6 p-4 expanded:grid-cols-2">
      <Shown label={say.dialogKinds.basic}>
        <SiteDialog headline={say.heading} supportingText={say.text} actions={actions} />
      </Shown>
      <Shown label={say.dialogKinds.icon}>
        <SiteDialog icon="info" headline={say.heading} supportingText={say.text} divider actions={actions}>
          <div className="space-y-3">
            {say.choices.map((c, i) => (
              <SiteCheckbox key={c} label={c} checked={i === 0} />
            ))}
          </div>
        </SiteDialog>
      </Shown>
      <Shown label={say.dialogKinds.container}>
        <SiteDialog className="p-6">
          <p className="text-lg font-medium">{say.heading}</p>
          <p className="mt-2 text-muted">{say.text}</p>
        </SiteDialog>
      </Shown>
      <Shown label={say.dialogKinds.fullScreen}>
        <div className="h-96">
          <SiteDialog
            kind="full-screen"
            className="h-full"
            headline={say.heading}
            closeLabel={say.close}
            divider
            actions={<SiteButton kind="text">{say.save}</SiteButton>}
            supportingText={say.text}
          >
            <div className="space-y-4">
              {say.fields.map((f) => (
                <SiteTextField key={f} label={f} />
              ))}
            </div>
          </SiteDialog>
        </div>
      </Shown>
    </div>
  );
}

function BottomSheets() {
  // The frame holds the sheet (contain: layout) and is as high as a phone screen to it (a size container).
  const frame = (label: string, sheet: ReactNode) => (
    <Shown label={label}>
      <div className="[container-type:size] relative h-160 overflow-hidden rounded-xl border border-line [contain:layout]">
        <p className="p-4 text-muted">{say.page}</p>
        {sheet}
      </div>
    </Shown>
  );
  const texts = (count: number) =>
    Array.from({ length: count }, (_, i) => (
      <p key={i + 1} className="mb-3 text-muted">
        {say.text}
      </p>
    ));
  const standard = (state: 'collapsed' | 'half-expanded' | 'expanded', label: string) =>
    frame(
      label,
      <SiteBottomSheet
        kind="standard"
        state={state}
        headline={say.heading}
        supportingText={say.sheetText}
        peek={say.sheetPeek}
        dragHandleLabel={say.dragHandle}
      >
        {texts(4)}
      </SiteBottomSheet>,
    );
  return (
    <div className="grid gap-6 p-4 expanded:grid-cols-2">
      <Shown label={say.sheetKinds.modal}>
        <ModalSheetSample />
      </Shown>
      <Shown label={say.sheetKinds.modalSideSheet}>
        <ModalSheetSample wide="side-sheet" label={say.openSideSheet} />
      </Shown>
      <Shown label={say.sheetKinds.modalSheet}>
        <ModalSheetSample wide="sheet" label={say.openWideSheet} />
      </Shown>
      {standard('collapsed', say.sheetKinds.collapsed)}
      {standard('half-expanded', say.sheetKinds.halfExpanded)}
      {standard('expanded', say.sheetKinds.expanded)}
      {frame(
        say.sheetKinds.wideSheet,
        <SiteBottomSheet
          kind="standard"
          wide="sheet"
          headline={say.heading}
          supportingText={say.sheetText}
          dragHandleLabel={say.dragHandle}
        >
          {texts(4)}
        </SiteBottomSheet>,
      )}
      {frame(
        say.sheetKinds.fixed,
        <SiteBottomSheet kind="standard" states={['expanded']} dragHandle={false} label={say.sheetLabel}>
          <p className="text-muted">{say.text}</p>
        </SiteBottomSheet>,
      )}
      {frame(
        say.sheetKinds.resizeButton,
        <SiteBottomSheet kind="standard" headline={say.heading} dragHandle={false} resizeLabel={say.resize}>
          {texts(4)}
        </SiteBottomSheet>,
      )}
      {frame(
        say.sheetKinds.collapseButton,
        <SiteBottomSheet
          kind="standard"
          state="expanded"
          headline={say.heading}
          dragHandleLabel={say.dragHandle}
          collapseLabel={say.collapse}
        >
          {texts(12)}
        </SiteBottomSheet>,
      )}
    </div>
  );
}

function Carousels() {
  const pictures = (layout: 'multi-browse' | 'hero' | 'full-screen', alignment?: 'center') => (
    <SiteCarousel
      layout={layout}
      alignment={alignment}
      label={say.roleDescription}
      roleDescription={say.roleDescription}
      itemRoleDescription={say.item}
      items={numbers.map((n) => ({ key: String(n), label: say.picture(n), content: <Picture n={n} /> }))}
      indicatorLabels={numbers.map((n) => say.showPicture(n))}
    />
  );
  return (
    <div className="space-y-8 p-4">
      <Shown label={say.layouts.uncontained}>
        <SiteCarousel
          label={say.roleDescription}
          roleDescription={say.roleDescription}
          itemRoleDescription={say.item}
          items={numbers.slice(0, 5).map((n) => ({
            key: String(n),
            label: say.card(n),
            content: (
              <div className="block-panel w-full">
                <p className="block-panel-title">{say.card(n)}</p>
                <p className="block-panel-text">{say.text}</p>
              </div>
            ),
          }))}
          indicatorLabels={numbers.slice(0, 5).map((n) => say.show(n))}
        />
      </Shown>
      <Shown label={say.layouts.multiBrowse}>{pictures('multi-browse')}</Shown>
      <Shown label={say.layouts.hero}>{pictures('hero')}</Shown>
      <Shown label={say.layouts.heroCenter}>{pictures('hero', 'center')}</Shown>
      <Shown label={say.layouts.fullScreen}>{pictures('full-screen')}</Shown>
    </div>
  );
}

export default function ContainmentParts() {
  return (
    <>
      <Part name="Dialog" use={say.dialog}>
        <Preview>
          <Dialogs />
        </Preview>
      </Part>
      <Part name="BottomSheet" use={say.bottomSheet}>
        <Preview>
          <BottomSheets />
        </Preview>
      </Part>
      <Part name="Carousel" use={say.carousel}>
        <Preview>
          <Carousels />
        </Preview>
      </Part>
    </>
  );
}
