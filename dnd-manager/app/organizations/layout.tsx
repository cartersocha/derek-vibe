import Navbar from "@/components/layout/navbar";
import FilterBar from "@/components/layout/filter-bar";

export default function OrganizationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a1f] flex flex-col md:flex-row">
      <Navbar />
      <div className="flex-1 flex flex-col">
        <FilterBar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
