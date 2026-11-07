import { CircleDashed, FlaskConical, ShieldCheck } from "lucide-react";
import type { EvidenceState } from "../content/model";

export function Badge({
  state,
  children,
}: {
  state: EvidenceState;
  children?: React.ReactNode;
}) {
  const Icon =
    state === "verified"
      ? ShieldCheck
      : state === "demo"
        ? FlaskConical
        : CircleDashed;
  return (
    <span className={`badge ${state}`}>
      <Icon size={13} aria-hidden />
      {children ??
        {
          demo: "Nội dung minh họa",
          verified: "Đã xác minh từ source FE",
          pending: "Chờ khảo sát",
        }[state]}
    </span>
  );
}
