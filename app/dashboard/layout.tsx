import { requireUser, ROLE_LABEL } from "@/src/lib/auth";
import SideNav from "@/src/components/SideNav";
import { logout } from "@/app/actions/auth";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const links = [{ href: "/dashboard", label: "Overview" }];
  if (user.role === "BUILDER") links.push({ href: "/dashboard/passport", label: "Skills Passport" }, { href: "/briefs", label: "Find briefs" });
  if (user.role === "ORGANISATION") links.push({ href: "/briefs/new", label: "Publish a brief" }, { href: "/talent", label: "Talent directory" }, { href: "/dashboard/passport", label: "Profile" });
  if (user.role === "PARTNER") links.push({ href: "/dashboard/community", label: "My community" }, { href: "/dashboard/passport", label: "Profile" });
  if (user.role === "ADMIN") links.push({ href: "/admin", label: "Admin console" }, { href: "/talent", label: "Talent directory" }, { href: "/briefs/new", label: "Publish a brief" });
  links.push({ href: "/open-house", label: "Open House" });

  return (
    <div className="page wrap dash">
      <SideNav links={links} name={user.name} roleLabel={ROLE_LABEL[user.role]} logout={logout} />
      <div>{children}</div>
    </div>
  );
}
