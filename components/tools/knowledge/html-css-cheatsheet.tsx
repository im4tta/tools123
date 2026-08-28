"use client";
import { ToolShell } from "@/components/ui/Shell";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";

type Item = { label: string; labelKm: string; code: string };
type Group = { title: string; titleKm: string; items: Item[] };

const GROUPS: Group[] = [
  {
    title: "HTML5 core tags",
    titleKm: "ស្លាក HTML5 មូលដ្ឋាន",
    items: [
      { label: "Document skeleton", labelKm: "គ្រោងឯកសារ", code: "<!DOCTYPE html>\n<html>\n<head>\n  <title>Page title</title>\n</head>\n<body>\n  Content\n</body>\n</html>" },
      { label: "Meta charset", labelKm: "Meta តួអក្សរ", code: '<meta charset="UTF-8">' },
      { label: "Link a stylesheet", labelKm: "ភ្ជាប់សន្លឹករចនាប័ទ្ម", code: '<link rel="stylesheet" href="style.css">' },
      { label: "Link a script", labelKm: "ភ្ជាប់ស្គ្រីប", code: '<script src="app.js"></script>' },
      { label: "Headings", labelKm: "ចំណងជើង", code: "<h1>Largest</h1>\n<h2>Section</h2>\n<h3>Subsection</h3>" },
      { label: "Paragraph", labelKm: "កថាខណ្ឌ", code: "<p>Text paragraph.</p>" },
      { label: "Link", labelKm: "តំណ", code: '<a href="https://example.com">Link text</a>' },
      { label: "Image", labelKm: "រូបភាព", code: '<img src="photo.jpg" alt="Description">' },
      { label: "Lists", labelKm: "បញ្ជី", code: "<ul>\n  <li>Item</li>\n</ul>\n<ol>\n  <li>First</li>\n</ol>" },
      { label: "Table", labelKm: "តារាង", code: "<table>\n  <tr>\n    <th>Name</th>\n  </tr>\n  <tr>\n    <td>Value</td>\n  </tr>\n</table>" },
      { label: "Form controls", labelKm: "ធាតុបញ្ចូលក្នុងទម្រង់", code: '<form action="/submit">\n  <input type="text" name="name">\n  <button type="submit">Send</button>\n</form>' },
      { label: "Generic blocks & inline", labelKm: "ធាតុទូទៅ block និង inline", code: "<div>Block container</div>\n<span>Inline text</span>" },
    ],
  },
  {
    title: "Attributes",
    titleKm: "គុណលក្ខណៈ (Attributes)",
    items: [
      { label: "id — unique identifier", labelKm: "id — លេខសម្គាល់តែមួយ", code: '<div id="header">…</div>' },
      { label: "class — style hook", labelKm: "class — សម្រាប់រចនាប័ទ្ម", code: '<p class="note">…</p>' },
      { label: "Inline style", labelKm: "រចនាប័ទ្មក្នុងបន្ទាត់", code: '<p style="color: red;">…</p>' },
      { label: "lang — language", labelKm: "lang — ភាសា", code: '<html lang="km">' },
      { label: "data-* custom attributes", labelKm: "data-* គុណលក្ខណៈផ្ទាល់ខ្លួន", code: '<button data-id="42">…</button>' },
      { label: "Open link in new tab", labelKm: "បើកតំណក្នុងផ្ទាំងថ្មី", code: '<a href="…" target="_blank" rel="noopener">…</a>' },
    ],
  },
  {
    title: "Semantic tags",
    titleKm: "ស្លាកអត្ថន័យ (Semantic)",
    items: [
      { label: "Page layout skeleton", labelKm: "គ្រោងប្លង់ទំព័រ", code: "<header>Logo & nav</header>\n<nav>Menu</nav>\n<main>\n  <article>Content</article>\n  <aside>Sidebar</aside>\n</main>\n<footer>Copyright</footer>" },
      { label: "Figure with caption", labelKm: "រូបភាពជាមួយចំណងជើង", code: "<figure>\n  <img src=\"…\" alt=\"…\">\n  <figcaption>Caption</figcaption>\n</figure>" },
      { label: "Time & highlight", labelKm: "ពេលវេលា និងបន្លិច", code: "<time datetime=\"2025-01-01\">Jan 1</time>\n<mark>highlighted</mark>" },
      { label: "Section with heading", labelKm: "ផ្នែកជាមួយចំណងជើង", code: "<section>\n  <h2>Heading</h2>\n  <p>Body text.</p>\n</section>" },
    ],
  },
  {
    title: "CSS selectors",
    titleKm: "អ្នកជ្រើសរើស CSS",
    items: [
      { label: "Element, class, id", labelKm: "ធាតុ class និង id", code: "p { }\n.note { }\n#header { }" },
      { label: "Descendant & child", labelKm: "កូនចៅ (descendant) និងកូន (child)", code: "div p { }       /* any <p> inside <div> */\ndiv > p { }      /* direct child only */" },
      { label: "Adjacent sibling", labelKm: "បងប្អូនជាប់គ្នា", code: "h2 + p { }      /* <p> right after <h2> */" },
      { label: "Attribute selector", labelKm: "អ្នកជ្រើសរើសតាមគុណលក្ខណៈ", code: 'input[type="text"] { }' },
      { label: "Pseudo-classes", labelKm: "Pseudo-class", code: "a:hover { }\nli:first-child { }\nli:nth-child(2n) { }" },
      { label: "Pseudo-elements", labelKm: "Pseudo-element", code: "p::before { content: \"→ \"; }\np::after { content: \" ←\"; }" },
    ],
  },
  {
    title: "Box model",
    titleKm: "គំរូប្រអប់ (Box model)",
    items: [
      { label: "The box", labelKm: "ប្រអប់", code: ".box {\n  margin: 10px;      /* space outside */\n  border: 1px solid #ccc;\n  padding: 12px;      /* space inside */\n  width: 200px;\n}" },
      { label: "Border-box sizing", labelKm: "កំណត់ទំហំតាម border-box", code: "* {\n  box-sizing: border-box;\n}" },
    ],
  },
  {
    title: "Flexbox",
    titleKm: "Flexbox",
    items: [
      { label: "Basic flex row", labelKm: "Flex បន្ទាត់មូលដ្ឋាន", code: ".row {\n  display: flex;\n  justify-content: space-between; /* main axis */\n  align-items: center;            /* cross axis */\n  gap: 8px;\n}" },
      { label: "Column direction & wrap", labelKm: "ទិសដៅជួរឈរ និងរុំបន្ទាត់", code: ".col {\n  display: flex;\n  flex-direction: column;\n  flex-wrap: wrap;\n}" },
      { label: "Grow or shrink an item", labelKm: "ពង្រីក ឬបង្រួមធាតុ", code: ".item {\n  flex: 1;            /* grow equally */\n  flex: 0 0 auto;     /* keep natural size */\n}" },
    ],
  },
  {
    title: "CSS Grid",
    titleKm: "CSS Grid",
    items: [
      { label: "Basic grid", labelKm: "Grid មូលដ្ឋាន", code: ".grid {\n  display: grid;\n  grid-template-columns: 1fr 1fr 1fr;\n  gap: 12px;\n}" },
      { label: "Named tracks & spans", labelKm: "ជួរឈរឈ្មោះ និងការលាត", code: ".grid {\n  grid-template-columns: 200px 1fr;\n}\n.sidebar { grid-column: 1; }\n.content  { grid-column: 2; }" },
      { label: "Centering with place-items", labelKm: "ដាក់កណ្ដាលជាមួយ place-items", code: ".center {\n  display: grid;\n  place-items: center;\n}" },
    ],
  },
  {
    title: "Common properties",
    titleKm: "លក្ខណៈទូទៅ",
    items: [
      { label: "Text styling", labelKm: "រចនាប័ទ្មអក្សរ", code: "p {\n  color: #222;\n  font-size: 16px;\n  font-family: system-ui, sans-serif;\n  line-height: 1.6;\n  text-align: justify;\n}" },
      { label: "Positioning", labelKm: "ការកំណត់ទីតាំង", code: ".fixed {\n  position: fixed;\n  top: 0;\n  z-index: 10;\n}\n.relative { position: relative; }\n.absolute { position: absolute; }" },
      { label: "Rounded corners & shadow", labelKm: "ជ្រុងមូល និងស្រមោល", code: ".card {\n  border-radius: 8px;\n  box-shadow: 0 2px 6px rgb(0 0 0 / 0.15);\n  overflow: hidden;\n}" },
      { label: "Hover transition", labelKm: "ការផ្លាស់ប្ដូរពេល hover", code: "button {\n  transition: background 0.2s ease;\n}\nbutton:hover {\n  background: #e0b400;\n}" },
      { label: "Responsive media query", labelKm: "Media query ឆ្លើយតប", code: "@media (max-width: 600px) {\n  .grid { grid-template-columns: 1fr; }\n}" },
      { label: "Hide / show overflow", labelKm: "លាក់ ឬបង្ហាញ overflow", code: ".hidden { display: none; }\n.scroll { overflow-x: auto; }" },
    ],
  },
];

export default function HtmlCssCheatsheet() {
  const { text: t } = useLanguage();

  return (
    <ToolShell
      title="HTML & CSS Cheat Sheet"
      khmerTitle="សន្លឹកយោង HTML និង CSS"
      description="Quick reference for core HTML5 tags, attributes, and semantic elements, plus CSS selectors, the box model, flexbox, grid, and common properties — each with a copyable example."
      descriptionKm="ឯកសារយោងរហ័សសម្រាប់ស្លាក HTML5 មូលដ្ឋាន គុណលក្ខណៈ និងធាតុ semantic ព្រមទាំងអ្នកជ្រើសរើស CSS គំរូប្រអប់ flexbox grid និងលក្ខណៈទូទៅ — នីមួយៗមានឧទាហរណ៍ដែលអាចចម្លងបាន។"
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
          "Curated reference — always check the official HTML and CSS specifications for details.",
          "ជាសន្លឹកយោងដកស្រង់ — សូមពិនិត្យលក្ខណៈបច្ចេកទេសផ្លូវការរបស់ HTML និង CSS សម្រាប់ព័ត៌មានលម្អិត។"
        )}
      </p>
    </ToolShell>
  );
}
