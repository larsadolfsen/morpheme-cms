// The main drawer and its menu button on #developer/parts/editor (Parts.tsx): the modal drawer in its two levels (sections, and
// a section's list with the back row and a fold-out), opened from a button, so it can be tried at any width, and the menu
// button open and closed. The drawer's header is a sample user (AccountRow). Exposes MainDrawerSample. Uses MainDrawer and
// its parts from ui.tsx.
import { useState } from 'react';
import { Gear } from '@phosphor-icons/react';
import { icons } from './site';
import { t } from './i18n';
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

const { parts } = t.common;

const sampleUser = { login: 'octocat', name: 'Octo Cat', canSave: true };

export function MainDrawerSample() {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button kind="outlined" onClick={() => setOpen(true)}>
        {t.library.openMenu}
      </Button>
      <MenuButton label={t.library.openMenu} onClick={() => setOpen(true)} />
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
        footer={section === null ? <MainDrawerItem href="" icon={Gear} label={parts.settings} /> : undefined}
        header={
          section === null ? (
            <AccountRow user={sampleUser} supporting="example.com" href="" />
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
