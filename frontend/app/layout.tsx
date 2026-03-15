import "./globals.css";
import type { ReactNode } from "react";
import { AuthProvider } from "../components/AuthProvider";

export const metadata = {
  title: "Team Standup Tracker",
  description: "Track daily standups for team members and managers",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
