"use client";
import { ToolShell } from "@/components/ui/Shell";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";

type Item = { label: string; labelKm: string; code: string };
type Group = { title: string; titleKm: string; items: Item[] };

const GROUPS: Group[] = [
  {
    title: "SELECT basics",
    titleKm: "SELECT មូលដ្ឋាន",
    items: [
      { label: "Select specific columns", labelKm: "ជ្រើសរើសជួរឈរជាក់លាក់", code: "SELECT first_name, last_name FROM users;" },
      { label: "Select all columns", labelKm: "ជ្រើសរើសជួរឈរទាំងអស់", code: "SELECT * FROM users;" },
      { label: "Distinct values", labelKm: "តម្លៃដោយឡែក", code: "SELECT DISTINCT country FROM users;" },
      { label: "Column alias", labelKm: "ឈ្មោះកាត់ជួរឈរ", code: "SELECT price * qty AS total FROM orders;" },
      { label: "Limit results", labelKm: "កំណត់ចំនួនលទ្ធផល", code: "SELECT * FROM users ORDER BY id LIMIT 10;" },
      { label: "Sort results", labelKm: "តម្រៀបលទ្ធផល", code: "SELECT name FROM products ORDER BY price DESC;" },
    ],
  },
  {
    title: "WHERE filtering",
    titleKm: "តម្រងជាមួយ WHERE",
    items: [
      { label: "Comparison operators", labelKm: "ប្រមាណវិធីប្រៀបធៀប", code: "SELECT * FROM users WHERE age >= 18;" },
      { label: "Text pattern (LIKE)", labelKm: "លំនាំអក្សរ (LIKE)", code: "SELECT * FROM users WHERE email LIKE '%@gmail.com';" },
      { label: "Set membership (IN)", labelKm: "ជាសមាជិកសំណុំ (IN)", code: "SELECT * FROM orders WHERE status IN ('paid', 'shipped');" },
      { label: "Range (BETWEEN)", labelKm: "ចន្លោះ (BETWEEN)", code: "SELECT * FROM products WHERE price BETWEEN 10 AND 50;" },
      { label: "Null check", labelKm: "ពិនិត្យតម្លៃ NULL", code: "SELECT * FROM users WHERE phone IS NOT NULL;" },
      { label: "Combine with AND / OR / NOT", labelKm: "ផ្សំជាមួយ AND / OR / NOT", code: "SELECT * FROM users\nWHERE country = 'KH' AND age >= 18 AND NOT banned;" },
    ],
  },
  {
    title: "JOINs",
    titleKm: "JOIN (ការភ្ជាប់តារាង)",
    items: [
      { label: "INNER JOIN — matching rows", labelKm: "INNER JOIN — ជួរដែលត្រូវគ្នា", code: "SELECT u.name, o.total\nFROM users u\nINNER JOIN orders o ON o.user_id = u.id;" },
      { label: "LEFT JOIN — keep all left rows", labelKm: "LEFT JOIN — រក្សាជួរខាងឆ្វេងទាំងអស់", code: "SELECT u.name, o.total\nFROM users u\nLEFT JOIN orders o ON o.user_id = u.id;" },
      { label: "RIGHT JOIN — keep all right rows", labelKm: "RIGHT JOIN — រក្សាជួរខាងស្ដាំទាំងអស់", code: "SELECT u.name, o.total\nFROM orders o\nRIGHT JOIN users u ON o.user_id = u.id;" },
      { label: "FULL OUTER JOIN — all rows", labelKm: "FULL OUTER JOIN — ជួរទាំងអស់", code: "SELECT u.name, o.total\nFROM users u\nFULL OUTER JOIN orders o ON o.user_id = u.id;" },
      { label: "CROSS JOIN — every pair", labelKm: "CROSS JOIN — គ្រប់គូ", code: "SELECT size, color FROM sizes CROSS JOIN colors;" },
    ],
  },
  {
    title: "GROUP BY & HAVING",
    titleKm: "GROUP BY និង HAVING",
    items: [
      { label: "Group and count", labelKm: "ដាក់ក្រុម និងរាប់", code: "SELECT country, COUNT(*) AS total\nFROM users\nGROUP BY country;" },
      { label: "Filter groups with HAVING", labelKm: "តម្រងក្រុមជាមួយ HAVING", code: "SELECT country, COUNT(*) AS total\nFROM users\nGROUP BY country\nHAVING COUNT(*) > 100;" },
      { label: "Group by with sum", labelKm: "ដាក់ក្រុមជាមួយផលបូក", code: "SELECT customer_id, SUM(amount) AS spent\nFROM orders\nGROUP BY customer_id;" },
    ],
  },
  {
    title: "Aggregates",
    titleKm: "អនុគមន៍សរុប (Aggregates)",
    items: [
      { label: "COUNT — number of rows", labelKm: "COUNT — ចំនួនជួរ", code: "SELECT COUNT(*) FROM orders;" },
      { label: "SUM — total", labelKm: "SUM — សរុប", code: "SELECT SUM(amount) FROM orders;" },
      { label: "AVG — average", labelKm: "AVG — មធ្យម", code: "SELECT AVG(price) FROM products;" },
      { label: "MIN / MAX", labelKm: "MIN / MAX — តិចបំផុត / ច្រើនបំផុត", code: "SELECT MIN(price), MAX(price) FROM products;" },
    ],
  },
  {
    title: "Modifying data",
    titleKm: "កែប្រែទិន្នន័យ",
    items: [
      { label: "INSERT a row", labelKm: "បញ្ចូលជួរដេក", code: "INSERT INTO users (name, email)\nVALUES ('Sok', 'sok@example.com');" },
      { label: "INSERT multiple rows", labelKm: "បញ្ចូលច្រើនជួរ", code: "INSERT INTO users (name, email) VALUES\n  ('Sok', 'sok@example.com'),\n  ('Dara', 'dara@example.com');" },
      { label: "UPDATE rows", labelKm: "កែប្រែជួរដេក", code: "UPDATE users SET country = 'KH' WHERE id = 1;" },
      { label: "DELETE rows", labelKm: "លុបជួរដេក", code: "DELETE FROM users WHERE id = 1;" },
      { label: "Delete all rows (keep table)", labelKm: "លុបជួរទាំងអស់ (រក្សាតារាង)", code: "DELETE FROM users;" },
    ],
  },
  {
    title: "CREATE TABLE",
    titleKm: "បង្កើតតារាង",
    items: [
      { label: "Basic table with constraints", labelKm: "តារាងមូលដ្ឋានជាមួយកំហិត", code: "CREATE TABLE users (\n  id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL,\n  email TEXT UNIQUE,\n  age INTEGER DEFAULT 0\n);" },
      { label: "Foreign key", labelKm: "សោបរទេស (Foreign key)", code: "CREATE TABLE orders (\n  id INTEGER PRIMARY KEY,\n  user_id INTEGER REFERENCES users(id),\n  amount NUMERIC NOT NULL\n);" },
      { label: "Drop a table", labelKm: "លុបតារាង", code: "DROP TABLE orders;" },
    ],
  },
  {
    title: "Indexes",
    titleKm: "លិបិក្រម (Index)",
    items: [
      { label: "Create an index", labelKm: "បង្កើតលិបិក្រម", code: "CREATE INDEX idx_users_email ON users (email);" },
      { label: "Unique index", labelKm: "លិបិក្រមតែមួយគត់", code: "CREATE UNIQUE INDEX idx_users_email ON users (email);" },
      { label: "Drop an index", labelKm: "លុបលិបិក្រម", code: "DROP INDEX idx_users_email;" },
      { label: "Index tip", labelKm: "គន្លឹះសម្រាប់លិបិក្រម", code: "-- Index columns used often in WHERE / JOIN\n-- to speed up lookups.\nSELECT * FROM users WHERE email = 'x@y.com';" },
    ],
  },
];

export default function SqlCheatsheet() {
  const { text: t } = useLanguage();

  return (
    <ToolShell
      title="SQL Cheat Sheet"
      khmerTitle="សន្លឹកយោង SQL"
      description="Quick reference for standard SQL — SELECT, WHERE, JOINs, GROUP BY / HAVING, aggregates, INSERT / UPDATE / DELETE, CREATE TABLE, and indexes, each with a copyable example."
      descriptionKm="ឯកសារយោងរហ័សសម្រាប់ SQL ស្ដង់ដារ — SELECT, WHERE, JOIN, GROUP BY / HAVING, អនុគមន៍សរុប, INSERT / UPDATE / DELETE, CREATE TABLE និងលិបិក្រម — នីមួយៗមានឧទាហរណ៍ដែលអាចចម្លងបាន។"
    >
      <div className="space-y-6">
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--gold)]">
              {t(group.title, group.titleKm)}
            </h2>
            <div className="overflow-hidden rounded-md border border-[var(--ground-line)]">
              {group.items.map((item) => (
                <div key={item.label} className="border-b border-[var(--ground-line)] p-3 last:border-0">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium uppercase tracking-wide text-[var(--ink-dim)]">
                        {t(item.label, item.labelKm)}
                      </div>
                      <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap font-mono-ui text-sm text-[var(--ink)]">
                        {item.code}
                      </pre>
                    </div>
                    <div className="shrink-0">
                      <CopyButton text={item.code} compact />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="text-xs text-[var(--ink-dim)]">
        {t(
          "Curated reference of standard SQL — dialect details (e.g. MySQL, PostgreSQL, SQLite) may differ; check your database documentation.",
          "ជាសន្លឹកយោងដកស្រង់ SQL ស្ដង់ដារ — ព័ត៌មានលម្អិតតាមប្រភេទមូលដ្ឋានទិន្នន័យ (ឧ. MySQL, PostgreSQL, SQLite) អាចខុសគ្នា; សូមពិនិត្យឯកសាររបស់មូលដ្ឋានទិន្នន័យអ្នក។"
        )}
      </p>
    </ToolShell>
  );
}
