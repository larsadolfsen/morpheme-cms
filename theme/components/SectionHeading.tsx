// The h2 used for every front-page section. `text`: its text.
export default function SectionHeading({ text, id, className }: { text: string; id?: string; className?: string }) {
  return (
    <h2 id={id} className={['text-[2.1rem] leading-tight md:text-5xl', className].filter(Boolean).join(' ')}>
      {text}
    </h2>
  );
}
