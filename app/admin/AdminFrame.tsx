"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, FileText, Globe2, Home, Languages, LogOut, Menu, Moon, PanelsTopLeft, Save, Sun, X, Inbox } from "lucide-react";
import { useEffect, useState } from "react";
import type { CmsRole } from "@/lib/cms/types";

const items = [
  { href: "/admin", label: "الرئيسية", icon: Home, roles: ["admin","editor"] },
  { href: "/admin/homepage", label: "الصفحة الرئيسية", icon: Home, roles: ["admin","editor"] },
  { href: "/admin/content", label: "المحتوى", icon: FileText, roles: ["admin","editor"] },
  { href: "/admin/pages", label: "إدارة الصفحات", icon: PanelsTopLeft, roles: ["admin","editor"] },
  { href: "/admin/requests", label: "الطلبات", icon: Inbox, roles: ["admin","editor"] },
  { href: "/admin/translations", label: "الترجمة", icon: Languages, roles: ["admin","editor"] },
  { href: "/admin/languages", label: "اللغات", icon: Globe2, roles: ["admin"] },
  { href: "/admin/backup", label: "النسخ الاحتياطي", icon: Save, roles: ["admin"] }
] as const;

export function AdminFrame({ role, email, displayName, children }: { role: CmsRole; email: string; displayName?: string; children: React.ReactNode }) {
  const path = usePathname();
  const [open,setOpen]=useState(false);
  const [dark,setDark]=useState(false);

  useEffect(()=>{
    const stored=localStorage.getItem("aas-admin-theme");
    const next=stored==="dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(next);
    document.documentElement.dataset.adminTheme=next?"dark":"light";
  },[]);

  function toggleTheme(){
    const next=!dark; setDark(next);
    document.documentElement.dataset.adminTheme=next?"dark":"light";
    localStorage.setItem("aas-admin-theme",next?"dark":"light");
  }

  async function logout(){
    await fetch("/api/admin/logout",{method:"POST"});
    window.location.replace("/admin/login");
  }

  const allowed=items.filter(item=>item.roles.includes(role as never));

  return <div className="admin-app">
    <aside className={`admin-sidebar ${open?"open":""}`}>
      <div className="admin-brand"><span className="admin-brand-mark">ع</span><span><strong>لوحة التحكم</strong><small>عبدالعزيز الصاري</small></span></div>
      <button className="admin-sidebar-close" type="button" onClick={()=>setOpen(false)} aria-label="إغلاق القائمة"><X size={20}/></button>
      <nav>{allowed.map(({href,label,icon:Icon})=><Link key={href} href={href} onClick={()=>setOpen(false)} className={path===href||path.startsWith(href+"/")?"active":""}><Icon size={18}/><span>{label}</span></Link>)}</nav>
      <div className="admin-profile">
        <strong>{displayName||email}</strong><small>{role==="admin"?"مدير":"محرر"}</small>
      </div>
    </aside>
    <button className={`admin-overlay ${open?"open":""}`} aria-label="إغلاق القائمة" onClick={()=>setOpen(false)}/>
    <section className="admin-workspace">
      <header className="admin-toolbar">
        <button className="admin-menu-button" onClick={()=>setOpen(true)} aria-label="فتح القائمة"><Menu size={20}/></button>
        <div className="admin-toolbar-spacer"/>
        <a className="admin-icon-button" href="/" target="_blank" rel="noreferrer" title="عرض الموقع"><BookOpen size={18}/></a>
        <button className="admin-icon-button" onClick={toggleTheme} title="الوضع الداكن / الفاتح">{dark?<Sun size={18}/>:<Moon size={18}/>}</button>
        <button className="admin-icon-button" onClick={logout} title="تسجيل الخروج"><LogOut size={18}/></button>
      </header>
      <main className="admin-page-content">{children}</main>
    </section>
  </div>;
}
