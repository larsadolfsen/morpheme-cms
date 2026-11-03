// Groups of links to pages (.block-panels in ../../styles/blocks.css): a box for each group (Panel.tsx) with its heading,
// a link to its page when it has one, and its pages under each other in a list (List.tsx in ../../ui/) by their titles,
// each with an arrow. Two boxes side by side where there is room. `className`: the site's own classes on it.
import Panel from '@theme/blocks/Panel';
import List, { ListItem } from '@theme/ui/List';
import { Svg } from '@morpheme/cms/src/icon';
import type { LinkGroup } from '@morpheme/cms/src/standard/links/view';
import { Link } from '@morpheme/cms/src/standard/view';

export default function LinkGroups({ groups, className }: { groups: LinkGroup[]; className?: string }) {
  return (
    <div className={className ? `block-panels ${className}` : 'block-panels'}>
      {groups.map((g, i) => (
        <Panel key={i} title={g.href ? <Link href={g.href}>{g.title}</Link> : g.title}>
          <List>
            {g.pages.map((p) => (
              <ListItem key={p.href} href={p.href} headline={p.name} trailing={<Svg name="arrow-right" size={18} />} />
            ))}
          </List>
        </Panel>
      ))}
    </div>
  );
}
