import { Link } from 'react-router-dom';
import { Button, Highlight } from '@spa/ui-kit';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="font-mono text-[12px] tracking-widest text-ink-3 uppercase">erro 404</p>
      <h1 className="mt-2 font-display text-[30px] font-extrabold text-ink">
        Essa <Highlight color="var(--color-caneta)">página</Highlight> não existe
      </h1>
      <p className="mt-2 text-[13.5px] text-ink-2">
        O link pode estar quebrado ou o item que você procurava foi removido do semestre.
      </p>
      <Link to="/" className="mt-5 inline-block">
        <Button>Voltar ao dashboard</Button>
      </Link>
    </div>
  );
}
