import type { ReactNode } from "react";

export function SectionHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="section-head">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2 className="h2">{title}</h2>
      </div>
      {children ? <p className="muted">{children}</p> : null}
    </div>
  );
}
