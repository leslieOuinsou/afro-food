import * as React from "react";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", ...props }: DivProps) {
  return (
    <div
      className={`rounded-3xl border border-orange-200/30 bg-white/80 backdrop-blur ${className}`}
      {...props}
    />
  );
}

export function CardContent({ className = "", ...props }: DivProps) {
  return <div className={`p-5 ${className}`} {...props} />;
}
