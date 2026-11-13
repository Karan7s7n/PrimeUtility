import {
  Braces,
  Briefcase,
  Calculator,
  Code2,
  FileDown,
  FileText,
  Image as ImageIcon,
  KeyRound,
  Layers,
  QrCode,
  Regex,
  Repeat,
  Shrink,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  braces: Braces,
  "key-round": KeyRound,
  regex: Regex,
  "qr-code": QrCode,
  shrink: Shrink,
  repeat: Repeat,
  "file-down": FileDown,
  layers: Layers,
  "file-text": FileText,
  calculator: Calculator,
  image: ImageIcon,
  code: Code2,
  briefcase: Briefcase,
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const Component = icons[name] ?? Braces;
  return <Component className={className} aria-hidden="true" />;
}
