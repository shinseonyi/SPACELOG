import type { StarKind } from "@spacelog/shared/types";
import { FileText, Image as ImageIcon, Link as LinkIcon, Type, type LucideIcon } from "lucide-react";

const ICON: Record<StarKind, { Icon: LucideIcon; label: string }> = {
  image: { Icon: ImageIcon, label: "이미지" },
  file: { Icon: FileText, label: "파일" },
  link: { Icon: LinkIcon, label: "링크" },
  text: { Icon: Type, label: "텍스트" },
};

/** 기록 종류 아이콘. Lucide 선 아이콘(2px)만 쓴다. 이모지는 쓰지 않는다 (design.md 8장) */
export function KindIcon({ kind, size = 20 }: { kind: StarKind; size?: number }) {
  const { Icon, label } = ICON[kind];
  return (
    <span className={`kind-icon kind-icon--${kind}`} role="img" aria-label={label}>
      <Icon size={size} strokeWidth={2} aria-hidden />
    </span>
  );
}
