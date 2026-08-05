import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { Card, EmptyState } from "../../components/ui";
import { formatDate } from "../../lib/format";
import { financeService } from "../../services/finance";
import type { Notification } from "../../types";

export function NotificationsView({ notifications, locale, busy, run, remove }:{
  notifications:Notification[]; locale:string; busy:boolean;
  run:(action:()=>Promise<unknown>,message:string)=>Promise<boolean>;
  remove:(action:()=>Promise<void>)=>Promise<void>;
}){
  return <Card title="Notificações" subtitle="Lembretes gerados automaticamente" actions={<Bell size={20}/> }>
    {notifications.length ? <ul className="list notification-list">{notifications.map(item=><li key={item.id}>
      <div><b>{item.title}</b><small>{item.message}{item.due_at?` · ${formatDate(item.due_at.slice(0,10),locale)}`:""}</small></div>
      <div className="row-actions">
        <button type="button" className="icon" disabled={busy} onClick={()=>run(()=>financeService.markNotification(item.id,true),"Notificação marcada como lida.")} aria-label={`Marcar ${item.title} como lida`}><CheckCheck size={16}/></button>
        <button type="button" className="icon danger-icon" disabled={busy} onClick={()=>remove(()=>financeService.deleteNotification(item.id))} aria-label={`Excluir notificação ${item.title}`}><Trash2 size={16}/></button>
      </div>
    </li>)}</ul>:<EmptyState title="Tudo em dia" description="Novos lembretes de assinaturas e recorrências aparecerão aqui."/>}
  </Card>;
}
