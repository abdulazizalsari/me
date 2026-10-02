import "@puckeditor/core/puck.css";
import "./admin.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-root" dir="rtl">{children}</div>;
}
