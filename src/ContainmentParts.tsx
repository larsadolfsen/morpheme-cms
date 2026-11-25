// "Parts" › "UI components" (BlockParts.tsx), the group "Dialogs, sheets and carousel": the theme's dialog, bottom sheet and
// carousel (packages/editor/theme/ui/, through @site/editor) as the site draws them, with made-up texts and the plain
// image: a basic dialog, one with an icon, a list and a divider, the container alone (a pop-up's box); the modal bottom sheet, three times, one per wide (a button opens it in a real dialog: on a phone at
// half height, pulled up to full height; on a computer a dialog, a side sheet or a sheet with margins) and the standard
// one collapsed, half expanded and expanded (and with the resize and collapse buttons) at the bottom of a frame with a
// page behind it (it can be dragged and tapped there, as on the site; from the medium width they become a side sheet,
// and one with wide="sheet" stays a sheet); and the carousel in each of Material's
// layouts. The modal sheet, the standard sheet and the carousels do something here; the other buttons lead nowhere.
import type { ReactNode } from 'react';
import { SiteBottomSheet, SiteButton, SiteCarousel, SiteCheckbox, SiteDialog } from './themeUi';
import ModalSheetSample from './ModalSheetSample';
import FullScreenDialogSample from './FullScreenDialogSample';
import { named, Part } from './PartsShown';
import { Preview } from './ui';
import { exampleImage } from './examples';
import { t } from './i18n';

const say = t.parts.screens.containment;
const numbers = [1, 2, 3, 4, 5, 6];

/** A label over an example: what the example shows. */
function Shown({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mo-editor-contain-example" {...named(label)}>
      <p className="mo-editor-contain-example-label">{label}</p>
      {children}
    </div>
  );
}

/** The plain image with its number, which fades as its item shrinks (--mo-comp-carousel-mask, carouselLayout.ts). */
function Image({ n }: { n: number }) {
  return (
    <>
      <img src={exampleImage} alt="" />
      <span className="mo-editor-contain-carousel-label" style={{ opacity: 'calc(1 - 3 * var(--mo-comp-carousel-mask, 0))' }}>
        {say.image(n)}
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
    <div className="mo-editor-contain-dialogs">
      <Shown label={say.dialogKinds.basic}>
        <SiteDialog headline={say.heading} supportingText={say.text} actions={actions} />
      </Shown>
      <Shown label={say.dialogKinds.icon}>
        <SiteDialog icon="info" headline={say.heading} supportingText={say.text} divider actions={actions}>
          <div className="mo-editor-contain-choices">
            {say.choices.map((c, i) => (
              <SiteCheckbox key={c} label={c} checked={i === 0} />
            ))}
          </div>
        </SiteDialog>
      </Shown>
      <Shown label={say.dialogKinds.fullScreen}>
        <FullScreenDialogSample />
      </Shown>
      <Shown label={say.dialogKinds.container}>
        <SiteDialog className="mo-editor-contain-dialog">
          <p className="mo-editor-contain-dialog-heading">{say.heading}</p>
          <p className="mo-editor-contain-dialog-text">{say.text}</p>
        </SiteDialog>
      </Shown>
    </div>
  );
}

function BottomSheets() {
  // The frame holds the sheet (contain: layout) and is as high as a phone screen to it (a size container).
  const frame = (label: string, sheet: ReactNode) => (
    <Shown label={label}>
      <div className="mo-editor-contain-frame">
        <p className="mo-editor-contain-page">{say.page}</p>
        {sheet}
      </div>
    </Shown>
  );
  const texts = (count: number) =>
    Array.from({ length: count }, (_, i) => (
      <p key={i + 1} className="mo-editor-contain-sheet-text">
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
    <div className="mo-editor-contain-dialogs">
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
          <p className="mo-editor-contain-text">{say.text}</p>
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
  const images = (layout: 'multi-browse' | 'hero' | 'full-screen', alignment?: 'center') => (
    <SiteCarousel
      layout={layout}
      alignment={alignment}
      label={say.roleDescription}
      roleDescription={say.roleDescription}
      itemRoleDescription={say.item}
      items={numbers.map((n) => ({ key: String(n), label: say.image(n), content: <Image n={n} /> }))}
      indicatorLabels={numbers.map((n) => say.showImage(n))}
    />
  );
  return (
    <div className="mo-editor-contain-layouts">
      <Shown label={say.layouts.uncontained}>
        <SiteCarousel
          label={say.roleDescription}
          roleDescription={say.roleDescription}
          itemRoleDescription={say.item}
          items={numbers.slice(0, 5).map((n) => ({
            key: String(n),
            label: say.card(n),
            content: (
              <div className="mo-block-panel mo-editor-contain-panel">
                <p className="mo-block-panel__title">{say.card(n)}</p>
                <p className="mo-block-panel__text">{say.text}</p>
              </div>
            ),
          }))}
          indicatorLabels={numbers.slice(0, 5).map((n) => say.show(n))}
        />
      </Shown>
      <Shown label={say.layouts.narrow}>
        <div className="mo-editor-contain-carousel">
          <SiteCarousel
            label={say.roleDescription}
            roleDescription={say.roleDescription}
            itemRoleDescription={say.item}
            items={numbers.slice(0, 5).map((n) => ({
              key: String(n),
              label: say.card(n),
              content: (
                <div className="mo-block-panel mo-editor-contain-panel">
                  <p className="mo-block-panel__title">{say.card(n)}</p>
                  <p className="mo-block-panel__text">{say.text}</p>
                </div>
              ),
            }))}
            indicatorLabels={numbers.slice(0, 5).map((n) => say.show(n))}
          />
        </div>
      </Shown>
      <Shown label={say.layouts.multiAspect}>
        <SiteCarousel
          layout="multi-aspect-ratio"
          label={say.roleDescription}
          roleDescription={say.roleDescription}
          itemRoleDescription={say.item}
          items={numbers.map((n) => ({
            key: String(n),
            label: say.image(n),
            // M3's four printed ratios in turn: 16:9, 9:16, 1:1, 3:4.
            aspect: [16 / 9, 9 / 16, 1, 3 / 4][(n - 1) % 4],
            focusable: true,
            content: <Image n={n} />,
          }))}
        />
      </Shown>
      <Shown label={say.layouts.multiBrowse}>{images('multi-browse')}</Shown>
      <Shown label={say.layouts.hero}>{images('hero')}</Shown>
      <Shown label={say.layouts.heroCenter}>{images('hero', 'center')}</Shown>
      <Shown label={say.layouts.fullScreen}>{images('full-screen')}</Shown>
    </div>
  );
}

export default function ContainmentParts() {
  return (
    <>
      <Part name="Dialog" m3="md.comp.dialog" use={say.dialog}>
        <Preview>
          <Dialogs />
        </Preview>
      </Part>
      <Part name="BottomSheet" m3="md.comp.sheet.bottom" use={say.bottomSheet}>
        <Preview>
          <BottomSheets />
        </Preview>
      </Part>
      <Part name="Carousel" m3="md.comp.carousel" use={say.carousel}>
        <Preview>
          <Carousels />
        </Preview>
      </Part>
    </>
  );
}
