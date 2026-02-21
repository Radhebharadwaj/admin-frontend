import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";

// Placeholder role check
async function checkAdminAccess() {
  // Simulate checking user role
  const userRole = "SUPER_ADMIN"; // Change to "USER" to simulate unauthorized access
  if (userRole !== "SUPER_ADMIN" && userRole !== "EDITOR") {
    redirect("/"); // Redirect unauthorized users to home
  }
  return { role: userRole };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = await checkAdminAccess();

  return <AdminShell role={role}>{children}</AdminShell>;
}
