// "Dele" › "UI-komponenter" (BlockParts.tsx), the group "Dialoger, ark og karrusel": the theme's dialog, bottom sheet and carousel
// (packages/editor/theme/ui/, through @site/editor) as the site draws them, with made-up texts and the plain picture: a
// basic dialog, one with an icon, a list and a divider, the container alone (a pop-up's box) and a full-screen one; the
// modal bottom sheet and the standard one collapsed, half expanded and expanded at the bottom of a frame with a page
// behind it (it can be dragged and tapped there, as on the site); and the carousel in each of Material's layouts. Only
// the standard sheet and the carousels do something here; the buttons lead nowhere.
import type { ReactNode } from 'react';
import { SiteBottomSheet, SiteButton, SiteCarousel, SiteCheckbox, SiteDialog, SiteTextField, bottomSheetCoverClass } from './themeUi';
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
    <div className="grid gap-6 p-4 lg:grid-cols-2">
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
  const standard = (state: 'collapsed' | 'half-expanded' | 'expanded', label: string) => (
    <Shown label={label}>
      {/* The frame holds the sheet (contain: layout) and is as high as a screen to it (a size container). */}
      <div className="[container-type:size] relative h-96 overflow-hidden rounded-xl border border-line [contain:layout]">
        <p className="p-4 text-muted">{say.page}</p>
        <SiteBottomSheet
          kind="standard"
          state={state}
          headline={say.heading}
          supportingText={say.sheetText}
          dragHandleLabel={say.dragHandle}
        >
          {numbers.slice(0, 4).map((n) => (
            <p key={n} className="mb-3 text-muted">
              {say.text}
            </p>
          ))}
        </SiteBottomSheet>
      </div>
    </Shown>
  );
  return (
    <div className="grid gap-6 p-4 lg:grid-cols-2">
      <Shown label={say.sheetKinds.modal}>
        <SiteBottomSheet headline={say.heading} supportingText={say.sheetText} closeLabel={say.close} footer={say.footer} height="18rem">
          <p className={bottomSheetCoverClass}>{say.text}</p>
        </SiteBottomSheet>
      </Shown>
      {standard('collapsed', say.sheetKinds.collapsed)}
      {standard('half-expanded', say.sheetKinds.halfExpanded)}
      {standard('expanded', say.sheetKinds.expanded)}
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
