// A settings field filled from a tool of the app's MCP server (`options.from` in app.json, contract 5): it asks the Worker for the
// items (/api/mcp-client/<app>/options), which calls the tool with the credentials the owner connected, and shows them as a menu.
// Exposes ToolSelect({ field, id, inField, value, onChange }). Uses Select (ui.tsx). The chosen value is stored in the app's settings like any other.
import { useEffect, useState } from 'react';
import { Select, SupportingText, type InField } from './ui';
import type { Field } from './schema';
import { t } from './i18n';

type Option = { label: string; value: string };

export function ToolSelect({
  field,
  id,
  inField,
  value,
  onChange,
}: {
  field: Field & { optionsFrom: NonNullable<Field['optionsFrom']> };
  id: string;
  inField: InField;
  value: string;
  onChange: (value: string) => void;
}) {
  const { app, tool, label, value: key } = field.optionsFrom;
  const [loaded, setLoaded] = useState<Option[] | 'failed' | null>(null);
  useEffect(() => {
    let current = true;
    const query = new URLSearchParams({ tool, label, value: key });
    fetch(`/api/mcp-client/${app}/options?${query}`, { cache: 'no-store' })
      .then((res) => (res.ok ? (res.json() as Promise<Option[]>) : Promise.reject(new Error(String(res.status)))))
      .then((list) => current && setLoaded(list))
      .catch(() => current && setLoaded('failed'));
    return () => {
      current = false;
    };
  }, [app, tool, label, key]);
  const options = Array.isArray(loaded) ? loaded : [];
  // The value saved stays shown while the list loads or fails.
  const shown = value && !options.some((o) => o.value === value) ? [{ label: value, value }, ...options] : options;
  return (
    <>
      <Select
        id={id}
        {...inField}
        title={field.label}
        value={value}
        options={[...(field.required ? [] : [{ value: '', label: t.forms.noChoice }]), ...shown]}
        empty={loaded === null ? t.apps.mcpLoading : t.forms.choose}
        onChange={onChange}
      />
      {loaded === 'failed' && <SupportingText className="mt-1">{t.apps.mcpNotLoaded(tool)}</SupportingText>}
    </>
  );
}
