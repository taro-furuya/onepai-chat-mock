export default function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold mb-3">{title}</h2>
      {children}
    </section>
  );
}
