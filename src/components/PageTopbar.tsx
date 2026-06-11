import { ReactNode } from "react";

type Props = {
  title: string;
  subtitle: string;
  action?: ReactNode;
};

export function PageTopbar({ title, subtitle, action }: Props) {
  return (
    <header className="page-topbar">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {action ? <div className="page-topbar-action">{action}</div> : null}
    </header>
  );
}
