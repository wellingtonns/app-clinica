import { ReactNode } from "react";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function CrudPanel({ title, subtitle, children }: Props) {
  return (
    <article className="panel">
      <div className="panel-header">
        <div>
          <h4>{title}</h4>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </article>
  );
}
