"use client";
import { ToolShell } from "@/components/ui/Shell";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";

type Item = { label: string; labelKm: string; code: string };
type Group = { title: string; titleKm: string; items: Item[] };

const GROUPS: Group[] = [
  {
    title: "Navigation",
    titleKm: "ការរុករក",
    items: [
      { label: "Current directory", labelKm: "ថតបច្ចុប្បន្ន", code: "pwd" },
      { label: "List files", labelKm: "រាយឯកសារ", code: "ls" },
      { label: "List with details (incl. hidden)", labelKm: "រាយជាមួយព័ត៌មានលម្អិត (រួមទាំងឯកសារលាក់)", code: "ls -la" },
      { label: "Change directory", labelKm: "ប្ដូរថត", code: "cd /path/to/dir" },
      { label: "Go to home directory", labelKm: "ទៅថតផ្ទះ", code: "cd ~" },
      { label: "Go up one level", labelKm: "ឡើងលើមួយកម្រិត", code: "cd .." },
      { label: "Find files by name", labelKm: "រកឯកសារតាមឈ្មោះ", code: "find . -name '*.log'" },
    ],
  },
  {
    title: "File operations",
    titleKm: "ប្រតិបត្តិការលើឯកសារ",
    items: [
      { label: "Create an empty file", labelKm: "បង្កើតឯកសារទទេ", code: "touch notes.txt" },
      { label: "Create directories (with parents)", labelKm: "បង្កើតថត (រួមទាំងថតមេ)", code: "mkdir -p a/b/c" },
      { label: "Copy file or directory", labelKm: "ចម្លងឯកសារ ឬថត", code: "cp -r source/ dest/" },
      { label: "Move / rename", labelKm: "ផ្លាស់ទី / ប្ដូរឈ្មោះ", code: "mv old.txt new.txt" },
      { label: "Remove file or directory (destructive)", labelKm: "លុបឯកសារ ឬថត (គ្រោះថ្នាក់)", code: "rm -rf temp/" },
      { label: "Symbolic link", labelKm: "តំណនិមិត្ត (Symlink)", code: "ln -s /real/path link_name" },
      { label: "View file with pager", labelKm: "មើលឯកសារជាមួយ pager", code: "less file.txt" },
      { label: "Show first / last lines", labelKm: "បង្ហាញបន្ទាត់ដើម / ចុង", code: "head -n 10 file.txt\ntail -n 10 file.txt" },
      { label: "Follow a log live", labelKm: "តាមដាន log ផ្ទាល់", code: "tail -f app.log" },
    ],
  },
  {
    title: "Permissions (chmod)",
    titleKm: "សិទ្ធិចូលប្រើ (chmod)",
    items: [
      { label: "Symbolic permissions", labelKm: "សិទ្ធិតាមនិមិត្ត", code: "chmod u+x script.sh   # owner can execute\nchmod g-w file.txt     # remove group write" },
      { label: "Numeric permissions", labelKm: "សិទ្ធិតាមលេខ", code: "chmod 755 script.sh   # rwxr-xr-x\nchmod 644 file.txt     # rw-r--r--" },
      { label: "Apply recursively", labelKm: "អនុវត្តតាមលំដាប់", code: "chmod -R 755 public/" },
      { label: "Change owner and group", labelKm: "ប្ដូរម្ចាស់ និងក្រុម", code: "chown user:group file.txt" },
    ],
  },
  {
    title: "Processes",
    titleKm: "ដំណើរការ (Process)",
    items: [
      { label: "List processes", labelKm: "រាយដំណើរការ", code: "ps aux" },
      { label: "Interactive monitor", labelKm: "ម៉ូនីទ័រអន្តរកម្ម", code: "top" },
      { label: "Kill by PID", labelKm: "បញ្ឈប់តាម PID", code: "kill 1234" },
      { label: "Force kill", labelKm: "បង្ខំបញ្ឈប់", code: "kill -9 1234" },
      { label: "Kill by name", labelKm: "បញ្ឈប់តាមឈ្មោះ", code: "pkill -f node" },
      { label: "Run in background", labelKm: "ដំណើរការផ្ទៃខាងក្រោយ", code: "nohup python app.py > app.log 2>&1 &" },
    ],
  },
  {
    title: "Disk & memory",
    titleKm: "ថាស និងអង្គចងចាំ",
    items: [
      { label: "Disk usage by filesystem", labelKm: "ការប្រើប្រាស់ថាសតាមប្រព័ន្ធឯកសារ", code: "df -h" },
      { label: "Directory size", labelKm: "ទំហំថត", code: "du -sh /var/log" },
      { label: "Largest items (one level)", labelKm: "ធាតុធំៗ (មួយកម្រិត)", code: "du -h --max-depth=1 | sort -h" },
      { label: "Memory usage", labelKm: "ការប្រើប្រាស់អង្គចងចាំ", code: "free -h" },
      { label: "Block devices", labelKm: "ឧបករណ៍ block", code: "lsblk" },
    ],
  },
  {
    title: "Network",
    titleKm: "បណ្ដាញ",
    items: [
      { label: "Ping a host", labelKm: "សាកល្បង ping", code: "ping -c 4 example.com" },
      { label: "Fetch a URL", labelKm: "ទាញយក URL", code: "curl -O https://example.com/file.zip" },
      { label: "Download a file", labelKm: "ទាញយកឯកសារ", code: "wget https://example.com/file.zip" },
      { label: "SSH to a server", labelKm: "SSH ទៅម៉ាស៊ីនមេ", code: "ssh user@host" },
      { label: "Copy files over SSH", labelKm: "ចម្លងឯកសារតាម SSH", code: "scp file.txt user@host:/path/" },
      { label: "Sync directories", labelKm: "ធ្វើសមកាលកម្មថត", code: "rsync -av source/ user@host:/dest/" },
      { label: "Show IP addresses", labelKm: "បង្ហាញអាសយដ្ឋាន IP", code: "ip addr" },
      { label: "Listening ports", labelKm: "ច្រកកំពុងស្ដាប់", code: "ss -tulpn" },
    ],
  },
  {
    title: "Text tools",
    titleKm: "ឧបករណ៍អត្ថបទ",
    items: [
      { label: "Search recursively", labelKm: "ស្វែងរកតាមលំដាប់", code: "grep -rn 'TODO' src/" },
      { label: "Case-insensitive, exclude", labelKm: "មិនប្រកាន់អក្សរ និងបដិសេធ", code: "grep -iv 'skip' file.txt" },
      { label: "Count matches", labelKm: "រាប់ចំនួនការត្រូវ", code: "grep -c 'error' app.log" },
      { label: "Stream edit (sed)", labelKm: "កែប្រែស្ទ្រីម (sed)", code: "sed 's/old/new/g' file.txt" },
      { label: "Print lines 1–5", labelKm: "បង្ហាញបន្ទាត់ទី ១–៥", code: "sed -n '1,5p' file.txt" },
      { label: "Print a field (awk)", labelKm: "បង្ហាញវាលមួយ (awk)", code: "awk '{print $1}' file.txt" },
      { label: "Split by delimiter (cut)", labelKm: "កាត់តាមសញ្ញាបំបែក (cut)", code: "cut -d: -f1 /etc/passwd" },
      { label: "Sort and count unique", labelKm: "តម្រៀប និងរាប់តម្លៃតែមួយ", code: "sort file.txt | uniq -c | sort -rn" },
    ],
  },
  {
    title: "Archives",
    titleKm: "បណ្ណសារ (Archive)",
    items: [
      { label: "Create a tar.gz", labelKm: "បង្កើត tar.gz", code: "tar -czvf backup.tar.gz /path/to/dir" },
      { label: "Extract a tar.gz", labelKm: "ពន្លា tar.gz", code: "tar -xzvf backup.tar.gz" },
      { label: "List archive contents", labelKm: "រាយមាតិកាបណ្ណសារ", code: "tar -tzf backup.tar.gz" },
      { label: "Create / extract a zip", labelKm: "បង្កើត / ពន្លា zip", code: "zip -r files.zip dir/\nunzip files.zip" },
      { label: "Compress a single file", labelKm: "បង្ហាប់ឯកសារតែមួយ", code: "gzip file.txt\ngunzip file.txt.gz" },
    ],
  },
];

export default function LinuxCheatsheet() {
  const { text: t } = useLanguage();

  return (
    <ToolShell
      title="Linux Command Cheat Sheet"
      khmerTitle="សន្លឹកយោង Linux"
      description="Quick reference for everyday Linux commands — navigation, file operations, permissions, processes, disk, network, text tools (grep, sed, awk, cut), and archives, each with a copyable command."
      descriptionKm="ឯកសារយោងរហ័សសម្រាប់ពាក្យបញ្ជា Linux ប្រចាំថ្ងៃ — ការរុករក ប្រតិបត្តិការលើឯកសារ សិទ្ធិ ដំណើរការ ថាស បណ្ដាញ ឧបករណ៍អត្ថបទ (grep, sed, awk, cut) និងបណ្ណសារ — នីមួយៗមានពាក្យបញ្ជាដែលអាចចម្លងបាន។"
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
          "Curated reference of standard Linux commands — flags may vary slightly between distributions and versions; check your system's manual pages.",
          "ជាសន្លឹកយោងដកស្រង់ពាក្យបញ្ជា Linux ស្ដង់ដារ — ទង់ជម្រើសអាចខុសគ្នាបន្តិចបន្តួចតាមប្រព័ន្ធ និងកំណែ; សូមពិនិត្យ manual របស់ប្រព័ន្ធអ្នក។"
        )}
      </p>
    </ToolShell>
  );
}
