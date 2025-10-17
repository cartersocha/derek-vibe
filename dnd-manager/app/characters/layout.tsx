import Navbar from "@/components/layout/navbar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#0a0a1f]">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
