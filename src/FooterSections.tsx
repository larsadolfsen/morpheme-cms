// The footer's fields (footer.json) in three sections for Appearance › Footer (FooterSettings.tsx): "Tekst" (the text under
// the name), "Kontakt" (its heading, with the link to the contact details) and "Links" (their heading and the links), each a
// plain section component so a shared layout can take them. Exposes FooterSections. Uses fields.tsx (FieldList) and ui.tsx.
import { FieldList } from './fields';
import { FieldGroup } from './ui';
import type { DataFile } from './schema';
import { t } from './i18n';

type Props = { dataFile: DataFile; value: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void };

// One section: the file's fields with these names.
function Section({ label, names, dataFile, value, onChange }: Props & { label: string; names: string[] }) {
  const fields = dataFile.fields.filter((f) => names.includes(f.name));
  return (
    <FieldGroup label={label}>
      <FieldList fields={fields} value={value} onChange={(v) => onChange(v as Record<string, unknown>)} />
    </FieldGroup>
  );
}

export const FooterText = (p: Props) => <Section {...p} label={t.library.footerSections.text} names={['text']} />;
export const FooterContact = (p: Props) => <Section {...p} label={t.library.footerSections.contact} names={['contactHeading']} />;
export const FooterLinks = (p: Props) => <Section {...p} label={t.library.footerSections.links} names={['linksHeading', 'links']} />;

export function FooterSections(props: Props) {
  return (
    <>
      <FooterText {...props} />
      <FooterContact {...props} />
      <FooterLinks {...props} />
    </>
  );
}
