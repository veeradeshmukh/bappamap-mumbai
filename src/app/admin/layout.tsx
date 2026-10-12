import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "BappaMap Moderation Portal — South Mumbai",
    description: "Admin moderation dashboard for BappaMap Mumbai."
};

export default function AdminLayout({
    children
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
