import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  X,
  Calendar,
  AlertTriangle,
  Clock,
  Info,
  RefreshCw,
  BellRing,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { useApp, Notification } from "../store/AppContext";
import { safeGetTime } from "../lib/dateUtils";

export const NotificationCenter: React.FC = () => {
  const {
    notifications,
    currentUser,
    markNotificationAsRead,
    clearNotifications,
  } = useApp();

  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const userNotifications = notifications.filter(
    (n) => n.userId === currentUser?.id
  );

  const unreadCount = userNotifications.filter((n) => !n.isRead).length;

  const filteredNotifications = userNotifications
    .filter((n) => (activeTab === "unread" ? !n.isRead : true))
    .sort((a, b) => safeGetTime(b.date) - safeGetTime(a.date));

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    return () =>
      document.removeEventListener("mousedown", handleOutside);
  }, []);

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "event_new":
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case "event_update":
        return <RefreshCw className="w-4 h-4 text-orange-500" />;
      case "reminder":
        return <BellRing className="w-4 h-4 text-green-600" />;
      case "emergency":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  const markAllRead = () => {
    userNotifications.forEach((item) => {
      if (!item.isRead) markNotificationAsRead(item.id);
    });
  };

  const openNotification = (item: Notification) => {
    markNotificationAsRead(item.id);
    setIsOpen(false);

    if (item.link) {
      const [path, hash] = item.link.split("#");
      navigate(path);

      if (hash) {
        setTimeout(() => {
          const el = document.getElementById(hash);
          el?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 300);
      }
    }
  };

  return (
    <>
      {/* Bell */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 transition"
      >
        <Bell className="w-6 h-6 text-slate-600" />

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen &&
        createPortal(
          <div
            ref={panelRef}
            className="
              fixed top-14 right-2 sm:right-4
              w-[calc(100vw-16px)] sm:w-[360px] md:w-[380px]
              max-w-full
              bg-white border border-slate-200
              rounded-2xl
              shadow-lg
              z-[999999]
              overflow-hidden
            "
          >
            {/* Header */}
            <div className="p-3 border-b border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-slate-900">
                  Thông báo
                </h2>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                    activeTab === "all"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  Tất cả
                </button>

                <button
                  onClick={() => setActiveTab("unread")}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                    activeTab === "unread"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  Chưa đọc ({unreadCount})
                </button>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="ml-auto text-xs text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đọc hết
                  </button>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="max-h-[52vh] overflow-y-auto divide-y divide-slate-100">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => openNotification(item)}
                    className={`p-3 hover:bg-slate-50 cursor-pointer transition ${
                      !item.isRead ? "bg-blue-50/40" : ""
                    }`}
                  >
                    <div className="flex gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        {getIcon(item.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                            {item.title}
                          </p>

                          {!item.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                          )}
                        </div>

                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {item.message}
                        </p>

                        <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          {format(
                            parseISO(item.date),
                            "HH:mm dd/MM",
                            { locale: vi }
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <Bell className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-800">
                    Không có thông báo
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {userNotifications.length > 0 && (
              <div className="p-2.5 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={clearNotifications}
                  className="w-full py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                  Xóa tất cả
                </button>
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
};