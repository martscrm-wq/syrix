import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SYRIX - نظام الإدارة المتكامل",
  description: "منصة إدارية متكاملة لإدارة الموارد البشرية، العمليات، الحسابات، التسويق، والمبيعات",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
