type Props = {
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
};

export function PageHeader({ eyebrow, title, description, badge }: Props) {
  return (
    <section className="hero hero-compact">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="hero-copy">{description}</p>
      </div>
      <div className="hero-panels">
        {badge ? (
          <article className="hero-tile">
            <span>Status do modulo</span>
            <strong>{badge}</strong>
            <small>Fluxo pronto para criar, editar, listar e excluir registros.</small>
          </article>
        ) : null}
      </div>
    </section>
  );
}
