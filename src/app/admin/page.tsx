import type { Metadata } from "next";
import AdminClient from "./AdminClient";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Admin Dashboard | Qudu Hub",
  description: "Internal operations center.",
};

export default function AdminDashboardPage() {
  return <AdminClient />;
}
