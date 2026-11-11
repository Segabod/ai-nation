import type { Metadata } from "next";
import "./globals.css";
import { getCurrentUser } from "@/src/lib/auth";
import Nav from "@/src/components/Nav";
import Footer from "@/src/components/Footer";
import HelpBot from "@/src/components/HelpBot";
import { cookies } from "next/headers";
import { AUDIENCE_COOKIE, audienceForRole, isAudience } from "@/src/lib/audience";

export const metadata: Metadata = {
  title: { default: "AI Nation | People. Skills. Opportunity.", template: "%s | AI Nation" },
  description:
    "Connecting university, college and hackathon talent with organisations ready to build something meaningful.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const remembered = (await cookies()).get(AUDIENCE_COOKIE)?.value;
  const audience = audienceForRole(user?.role) ?? (isAudience(remembered) ? remembered : null);
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,500;0,600;1,400&family=Rubik:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <Nav user={user ? { name: user.name, role: user.role } : null} audience={audience} />
        <main id="main">{children}</main>
        <Footer />
        <HelpBot user={user ? { name: user.name, role: user.role } : null} />
      </body>
    </html>
  );
}
