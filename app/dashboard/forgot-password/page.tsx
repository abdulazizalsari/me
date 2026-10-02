import type { Metadata } from "next";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "استعادة كلمة مرور الإدارة",
  robots: { index: false, follow: false }
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
