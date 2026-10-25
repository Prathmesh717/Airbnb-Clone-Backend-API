import Link from "next/link";
import { Icon } from "./Icon";

export function EmptyState({ title, description, action, href = "/" }: { title: string; description: string; action?: string; href?: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon"><Icon name="home" size={26} /></div>
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? <Link className="button button--dark" href={href}>{action}<Icon name="arrow-right" size={16} /></Link> : null}
    </div>
  );
}
