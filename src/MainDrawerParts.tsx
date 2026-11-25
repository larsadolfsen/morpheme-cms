// The main drawer and its menu button on #developer/parts/editor (Parts.tsx): the modal drawer in its two levels (sections, and
// a section's list with the back row and a fold-out), opened from a button, so it can be tried at any width, and the menu
// button open and closed. The drawer's header is a sample user (AccountRow). Exposes MainDrawerSample. Uses MainDrawer and
// its parts from ui.tsx.
import { useState } from 'react';
import { icons } from './site';
import { t } from './i18n';
import { Example } from './PartsShown';
import { AccountRow } from './AccountRow';
import {
  Button,
  MainDrawer,
  MainDrawerBack,
  MainDrawerFold,
  MainDrawerItem,
  MainDrawerLevel,
  MainDrawerSectionItem,
  MainDrawerSubitem,
  MenuButton,
} from './ui';
import { materialIcon } from './icon';

const { parts } = t.common;

const sampleUser = { login: 'octocat', name: 'Octo Cat', canSave: true };

export function MainDrawerSample() {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<string | null>(null);
  return (
    <div className="mo-editor-actions-row">
      <Example label={t.parts.screens.example(1)} flat>
        <Button kind="outlined" onClick={() => setOpen(true)}>
          {t.library.openMenu}
        </Button>
      </Example>
      <Example label={t.parts.screens.example(2)} flat>
        <MenuButton label={t.library.openMenu} onClick={() => setOpen(true)} />
      </Example>
      <MenuButton label={t.library.closeMenu} open onClick={() => setOpen(false)} />
      <MainDrawer
        label={t.library.navigation}
        open={open}
        onOpenChange={setOpen}
        onEscape={() => {
          const inList = section !== null;
          setSection(null);
          return inList;
        }}
        variant="modal"
        footer={section === null ? <MainDrawerItem href="" icon={materialIcon('settings')} label={parts.settings} /> : undefined}
        header={
          section === null ? (
            (close) => <AccountRow user={sampleUser} supporting="example.com" href="" actions={close} />
          ) : (
            <MainDrawerBack label={t.library.back} name={t.common.backTo(t.library.mainMenu)} onClick={() => setSection(null)} />
          )
        }
      >
        {section === null ? (
          <MainDrawerLevel>
            <MainDrawerItem href="" icon={icons.home} label={parts.company} />
            <MainDrawerSectionItem icon={icons.global} label={parts.header} selected onClick={() => setSection('global')} />
            <MainDrawerSectionItem icon={icons.appearance} label={parts.appearance} onClick={() => setSection('appearance')} />
          </MainDrawerLevel>
        ) : (
          <MainDrawerLevel focus="list">
            <MainDrawerFold href="" icon={icons.header} label={parts.header} open>
              <MainDrawerSubitem href="" label={parts.apps} selected />
            </MainDrawerFold>
            <MainDrawerItem href="" icon={icons.seo} label={parts.seo} count={3} />
          </MainDrawerLevel>
        )}
      </MainDrawer>
    </div>
  );
}
