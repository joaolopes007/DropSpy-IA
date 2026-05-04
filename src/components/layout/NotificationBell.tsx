import { useState, useRef, useEffect } from "react";
import { Bell, Info, Box, Link2, Zap } from "lucide-react";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, NotificationType } from "../../hooks/useNotifications";
import { motion, AnimatePresence } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'product': return <Box className="w-4 h-4 text-orange-400" />;
      case 'integration': return <Link2 className="w-4 h-4 text-blue-400" />;
      case 'subscription': return <Zap className="w-4 h-4 text-purple-400" />;
      case 'system': return <Info className="w-4 h-4 text-indigo-400" />;
      default: return <Info className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
      >
        <Bell className={`w-5 h-5 transition-transform ${isOpen ? 'scale-110 text-white' : 'text-white/60 group-hover:text-white'}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-black shadow-lg animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-4 w-96 bg-[#111113] border border-white/10 rounded-[2rem] shadow-2xl z-[100] overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/2">
              <div>
                <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">Notificações</h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">
                  {unreadCount} novas mensagens
                </p>
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={() => markAllRead.mutate(notifications)}
                  className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors"
                >
                  Ler todas
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      onClick={() => !notification.is_read && markRead.mutate(notification.id)}
                      className={`p-5 flex gap-4 transition-all cursor-pointer group ${notification.is_read ? 'opacity-60 bg-transparent' : 'bg-white/2 hover:bg-white/5'}`}
                    >
                      <div className={`mt-1 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${notification.is_read ? 'bg-white/5' : 'bg-indigo-600/10'}`}>
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                           <h4 className={`text-sm font-bold tracking-tight ${notification.is_read ? 'text-white/60' : 'text-white'}`}>
                             {notification.title}
                           </h4>
                           {!notification.is_read && (
                             <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1" />
                           )}
                        </div>
                        <p className="text-xs text-white/40 leading-relaxed">
                          {notification.message}
                        </p>
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest block pt-1">
                          {formatDistanceToNow(notification.created_at.toDate(), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-white/5 rounded-[2rem] flex items-center justify-center text-white/20">
                    <Bell className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1 italic uppercase tracking-tight">Sem notificações</h4>
                    <p className="text-xs text-white/40">Fique atento! Novidades aparecerão aqui.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-white/2 border-t border-white/5 text-center">
               <button className="text-[10px] font-black text-white/30 uppercase tracking-widest hover:text-white transition-colors">
                  Ver histórico completo
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
