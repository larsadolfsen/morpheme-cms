// "Parts" › "UI components" (BlockParts.tsx), the group "Switches, choices and side sheets": the theme's switches, setting rows, radio buttons,
// sliders, dividers and side sheets (packages/editor/theme/ui/, through @site/editor) as the site draws them, in every
// kind and state (the sliders also centered, in each size, with an icon and vertical), with made-up texts. The
// switches, radio buttons and sliders can be tried (a slider's tracks and labels follow it here as on the site);
// nothing is saved, and the side sheets are only drawn (on the site a modal one opens over the page with sideSheet()).
// On a phone the standard one is drawn without the page beside it, as there is no room for both.
import { SiteButton, SiteDivider, SiteRadioButton, SiteRadioGroup, SiteSettingRow, SiteSideSheet, SiteSlider, SiteSwitch } from './themeUi';
import { Part } from './PartsShown';
import { Preview } from './ui';
import { t } from './i18n';

const say = t.parts.screens.selection;
const dividerKinds = ['full-width', 'inset', 'middle-inset'] as const;
const sliderSizes = ['xsmall', 'small', 'medium', 'large', 'xlarge'] as const;

export default function SelectionParts() {
  const grid = 'mo-editor-selection-columns';
  const sheet = (kind: 'standard' | 'modal', back = false) => (
    <SiteSideSheet
      kind={kind}
      headline={say.heading}
      closeLabel={say.close}
      backLabel={back ? say.back : undefined}
      onBack={back ? () => {} : undefined}
      actions={
        <>
          <SiteButton>{say.apply}</SiteButton>
          <SiteButton kind="outlined">{say.cancel}</SiteButton>
        </>
      }
    >
      <p>{say.text}</p>
    </SiteSideSheet>
  );
  return (
    <>
      <Part name="Switch" use={say.switch}>
        <Preview>
          <div className={grid}>
            <SiteSwitch label={say.switchLabel} />
            <SiteSwitch label={say.switchLabel} checked />
            <SiteSwitch label={say.switchLabel} supporting={say.switchSupporting} icons="both" />
            <SiteSwitch label={say.switchLabel} supporting={say.switchSupporting} icons="both" checked />
            <SiteSwitch label={say.switchLabel} icons="selected" checked />
            <SiteSwitch label={say.switchLabel} checked disabled />
          </div>
        </Preview>
      </Part>
      <Part name="SettingRow" use={say.settingRow}>
        <Preview>
          <div className={grid}>
            <SiteSettingRow label={say.switchLabel} supporting={say.switchSupporting}>
              <SiteButton kind="text" size="small">
                {say.choices[0]}
              </SiteButton>
            </SiteSettingRow>
            <SiteSettingRow label={say.switchLabel}>
              <SiteButton kind="text" size="small" disabled>
                {say.choices[1]}
              </SiteButton>
            </SiteSettingRow>
          </div>
        </Preview>
      </Part>
      <Part name="RadioButton" use={say.radioButton}>
        <Preview>
          <div className={grid}>
            <SiteRadioGroup label={say.groupLabel}>
              {say.choices.map((c, i) => (
                <SiteRadioButton
                  key={c}
                  name="parts-selection-time"
                  value={c}
                  label={c}
                  supporting={i === 0 ? say.choiceSupporting : undefined}
                  checked={i === 0}
                />
              ))}
            </SiteRadioGroup>
            <SiteRadioGroup label={say.groupLabel}>
              {say.choices.map((c, i) => (
                <SiteRadioButton key={c} name="parts-selection-disabled" value={c} label={c} checked={i === 1} disabled />
              ))}
            </SiteRadioGroup>
          </div>
        </Preview>
      </Part>
      <Part name="Slider" use={say.slider}>
        <Preview>
          <div className="mo-editor-selection-sliders">
            <SiteSlider label={say.volume} value={40} valueLabel />
            <SiteSlider label={say.count} max={10} value={6} stops valueLabel="always" />
            <SiteSlider label={say.price} max={1000} step={50} range={[200, 700]} handleLabels={say.handles} valueLabel="always" />
            <SiteSlider label={say.volume} value={40} disabled />
            <SiteSlider label={say.balance} min={-50} max={50} value={20} centered valueLabel />
            <SiteSlider label={say.balance} min={-50} max={50} step={10} value={-30} centered stops valueLabel="always" />
          </div>
          <div className="mo-editor-selection-sliders">
            {sliderSizes.map((size) => (
              <SiteSlider key={size} label={say.sliderSizes[size]} size={size} value={60} />
            ))}
            {(['medium', 'large', 'xlarge'] as const).map((size) => (
              <SiteSlider key={size} label={`${say.brightness}: ${say.sliderSizes[size]}`} size={size} value={60} icon="sun" />
            ))}
            <SiteSlider label={`${say.brightness}: ${say.sliderSizes.large}`} size="large" value={4} icon="sun" />
          </div>
          <div className="mo-editor-selection-vertical-sliders" role="group" aria-label={say.verticalSliders}>
            <SiteSlider label={say.volume} orientation="vertical" value={40} valueLabel />
            <SiteSlider label={say.count} orientation="vertical" max={10} value={6} stops />
            <SiteSlider label={say.price} orientation="vertical" max={1000} step={50} range={[200, 700]} handleLabels={say.handles} />
            <SiteSlider label={say.brightness} orientation="vertical" size="medium" value={70} icon="sun" />
          </div>
        </Preview>
      </Part>
      <Part name="Divider" use={say.divider}>
        <Preview>
          <div className="mo-editor-selection-dividers">
            {dividerKinds.map((k) => (
              <div key={k} className="mo-editor-selection-kind">
                <p className="mo-editor-selection-kind-label">{say.kinds[k]}</p>
                <SiteDivider kind={k} />
              </div>
            ))}
            <div className="mo-editor-selection-vertical-dividers">
              <span className="mo-editor-selection-small-label">{say.kinds.vertical}</span>
              <SiteDivider vertical />
              <span className="mo-editor-selection-small-label">{say.kinds['middle-inset']}</span>
              <SiteDivider vertical kind="middle-inset" />
            </div>
          </div>
        </Preview>
      </Part>
      <Part name="SideSheet" use={say.sideSheet}>
        <Preview>
          <div className="mo-editor-selection-sheets">
            <div className="mo-editor-selection-kind">
              <p className="mo-editor-selection-sheet-label">{say.sheetKinds.standard}</p>
              <div className="mo-editor-selection-sheet-stage">
                <p className="mo-editor-selection-sheet-page">{say.page}</p>
                {sheet('standard')}
              </div>
            </div>
            <div className="mo-editor-selection-kind">
              <p className="mo-editor-selection-sheet-label">{say.sheetKinds.withBack}</p>
              <div className="mo-editor-selection-sheet-stage">
                <p className="mo-editor-selection-sheet-page">{say.page}</p>
                {sheet('standard', true)}
              </div>
            </div>
            <div className="mo-editor-selection-kind">
              <p className="mo-editor-selection-sheet-label">{say.sheetKinds.modal}</p>
              <div className="mo-editor-selection-modal-stage">{sheet('modal')}</div>
            </div>
          </div>
        </Preview>
      </Part>
    </>
  );
}
