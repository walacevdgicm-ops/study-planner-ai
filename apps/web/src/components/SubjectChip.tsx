import { Link } from 'react-router-dom';
import { SubjectDot, cn } from '@spa/ui-kit';
import { useSubjectMap } from '@/store/selectors';

/** Identificação compacta e consistente da disciplina, usada em todas as listas. */
export function SubjectChip({
  subjectId,
  className,
  showCode,
  asLink = true,
}: {
  subjectId: string;
  className?: string;
  showCode?: boolean;
  asLink?: boolean;
}) {
  const map = useSubjectMap();
  const subject = map.get(subjectId);
  if (!subject) return null;

  const content = (
    <>
      <SubjectDot color={subject.hex} />
      <span className="truncate">{showCode ? subject.code : subject.name}</span>
    </>
  );

  const base = cn('inline-flex min-w-0 items-center gap-1.5 text-[12.5px] text-ink-2', className);

  if (!asLink) return <span className={base}>{content}</span>;

  return (
    <Link to={`/disciplinas/${subject.id}`} className={cn(base, 'hover:text-ink')}>
      {content}
    </Link>
  );
}
