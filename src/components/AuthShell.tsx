import type { ReactNode } from "react";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="container-x grid place-items-center py-14 sm:py-20">
      <div className="card w-full max-w-md p-6 sm:p-9">
        <h1 className="text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-slate-600">{subtitle}</p>}
        <div className="mt-7">{children}</div>
        {footer && <div className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-600">{footer}</div>}
      </div>
    </div>
  );
}
