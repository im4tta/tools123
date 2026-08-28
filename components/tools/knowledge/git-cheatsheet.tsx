"use client";
import { ToolShell } from "@/components/ui/Shell";
import { CopyButton } from "@/components/CopyButton";
import { useLanguage } from "@/components/LanguageProvider";

type Item = { label: string; labelKm: string; code: string };
type Group = { title: string; titleKm: string; items: Item[] };

const GROUPS: Group[] = [
  {
    title: "Setup & config",
    titleKm: "រៀបចំ និងកំណត់រចនាសម្ព័ន្ធ",
    items: [
      { label: "Initialize a repository", labelKm: "បង្កើត repository ថ្មី", code: "git init" },
      { label: "Set your name", labelKm: "កំណត់ឈ្មោះរបស់អ្នក", code: 'git config --global user.name "Your Name"' },
      { label: "Set your email", labelKm: "កំណត់អ៊ីមែលរបស់អ្នក", code: 'git config --global user.email "you@example.com"' },
      { label: "Show all settings", labelKm: "បង្ហាញការកំណត់ទាំងអស់", code: "git config --list" },
      { label: "Set default editor", labelKm: "កំណត់កម្មវិធីនិពន្ធលំនាំដើម", code: 'git config --global core.editor "code --wait"' },
    ],
  },
  {
    title: "Daily workflow",
    titleKm: "ការងារប្រចាំថ្ងៃ",
    items: [
      { label: "Check file status", labelKm: "ពិនិត្យស្ថានភាពឯកសារ", code: "git status" },
      { label: "Stage a file", labelKm: "បញ្ចូលឯកសារទៅក្នុង staging", code: "git add <file>" },
      { label: "Stage all changes", labelKm: "បញ្ចូលការផ្លាស់ប្ដូរទាំងអស់", code: "git add ." },
      { label: "Commit with a message", labelKm: "រក្សាទុក commit ជាមួយសារ", code: 'git commit -m "message"' },
      { label: "Stage tracked files and commit", labelKm: "បញ្ចូលឯកសារដែលតាមដាន រួច commit", code: 'git commit -am "message"' },
      { label: "Show commit history", labelKm: "បង្ហាញប្រវត្តិ commit", code: "git log --oneline" },
      { label: "Show a commit in detail", labelKm: "បង្ហាញ commit លម្អិត", code: "git show <commit>" },
      { label: "Show unstaged changes", labelKm: "បង្ហាញការផ្លាស់ប្ដូរដែលមិនទាន់ stage", code: "git diff" },
      { label: "Show staged changes", labelKm: "បង្ហាញការផ្លាស់ប្ដូរដែលបាន stage", code: "git diff --staged" },
    ],
  },
  {
    title: "Branches",
    titleKm: "សាខា (Branch)",
    items: [
      { label: "List branches", labelKm: "រាយបញ្ជីសាខា", code: "git branch" },
      { label: "Create a branch", labelKm: "បង្កើតសាខាថ្មី", code: "git branch <name>" },
      { label: "Create and switch to a branch", labelKm: "បង្កើតសាខាហើយប្ដូរទៅវា", code: "git checkout -b <name>" },
      { label: "Switch to a branch", labelKm: "ប្ដូរទៅសាខាផ្សេង", code: "git checkout <name>" },
      { label: "Delete a merged branch", labelKm: "លុបសាខាដែលបាន merge", code: "git branch -d <name>" },
      { label: "Force-delete a branch", labelKm: "បង្ខំលុបសាខា", code: "git branch -D <name>" },
      { label: "Show branches and last commit", labelKm: "បង្ហាញសាខា និង commit ចុងក្រោយ", code: "git branch -v" },
    ],
  },
  {
    title: "Merge & rebase",
    titleKm: "Merge និង rebase",
    items: [
      { label: "Merge a branch into the current one", labelKm: "Merge សាខាចូលក្នុងសាខាបច្ចុប្បន្ន", code: "git merge <branch>" },
      { label: "Reapply commits on top of another branch", labelKm: "ដាក់ commit ឡើងលើសាខាផ្សេង", code: "git rebase <branch>" },
      { label: "Interactive rebase of last 3 commits", labelKm: "Rebase អន្តរកម្ម ៣ commit ចុងក្រោយ", code: "git rebase -i HEAD~3" },
      { label: "Abort a conflicted merge", labelKm: "បោះបង់ merge ដែលមានជម្លោះ", code: "git merge --abort" },
      { label: "Abort a rebase", labelKm: "បោះបង់ rebase", code: "git rebase --abort" },
      { label: "Continue after resolving conflicts", labelKm: "បន្តបន្ទាប់ពីដោះស្រាយជម្លោះ", code: "git rebase --continue" },
      { label: "Launch merge conflict tool", labelKm: "បើកឧបករណ៍ដោះស្រាយជម្លោះ", code: "git mergetool" },
    ],
  },
  {
    title: "Undo",
    titleKm: "មិនធ្វើវិញ (Undo)",
    items: [
      { label: "Discard changes in a file", labelKm: "បោះបង់ការផ្លាស់ប្ដូរក្នុងឯកសារ", code: "git restore <file>" },
      { label: "Unstage a file", labelKm: "ដកឯកសារចេញពី staging", code: "git restore --staged <file>" },
      { label: "Undo last commit, keep changes", labelKm: "មិនធ្វើ commit ចុងក្រោយវិញ រក្សាការផ្លាស់ប្ដូរ", code: "git reset --soft HEAD~1" },
      { label: "Discard last commit and changes (destructive)", labelKm: "បោះបង់ commit និងការផ្លាស់ប្ដូរ (គ្រោះថ្នាក់)", code: "git reset --hard HEAD~1" },
      { label: "Add to last commit", labelKm: "បន្ថែមទៅ commit ចុងក្រោយ", code: "git commit --amend" },
      { label: "Revert a commit with a new commit", labelKm: "បញ្ច្រាស commit ដោយបង្កើត commit ថ្មី", code: "git revert <commit>" },
    ],
  },
  {
    title: "Remotes",
    titleKm: "Remote (ឃ្លាំងពីចម្ងាយ)",
    items: [
      { label: "Add a remote", labelKm: "បន្ថែម remote", code: "git remote add origin <url>" },
      { label: "List remotes", labelKm: "រាយបញ្ជី remote", code: "git remote -v" },
      { label: "Push and set upstream", labelKm: "Push និងកំណត់ upstream", code: "git push -u origin main" },
      { label: "Push changes", labelKm: "Push ការផ្លាស់ប្ដូរ", code: "git push" },
      { label: "Pull with rebase", labelKm: "Pull ជាមួយ rebase", code: "git pull --rebase" },
      { label: "Fetch without merging", labelKm: "Fetch ដោយមិន merge", code: "git fetch" },
      { label: "Clone a repository", labelKm: "Clone repository", code: "git clone <url>" },
    ],
  },
  {
    title: "Stash",
    titleKm: "Stash (ទុកការផ្លាស់ប្ដូរបណ្ដោះអាសន្ន)",
    items: [
      { label: "Stash working changes", labelKm: "ទុកការផ្លាស់ប្ដូរបណ្ដោះអាសន្ន", code: "git stash" },
      { label: "Stash with a message", labelKm: "ទុកបណ្ដោះអាសន្នជាមួយសារ", code: 'git stash push -m "message"' },
      { label: "List stashes", labelKm: "រាយបញ្ជី stash", code: "git stash list" },
      { label: "Apply and remove the latest stash", labelKm: "យកមកវិញហើយលុប stash ចុងក្រោយ", code: "git stash pop" },
      { label: "Apply without removing", labelKm: "យកមកវិញដោយមិនលុប", code: "git stash apply" },
      { label: "Drop a stash", labelKm: "លុប stash", code: "git stash drop" },
    ],
  },
  {
    title: "Tags",
    titleKm: "Tag (ស្លាក)",
    items: [
      { label: "List tags", labelKm: "រាយបញ្ជី tag", code: "git tag" },
      { label: "Create a lightweight tag", labelKm: "បង្កើត tag ស្រាល", code: "git tag v1.0.0" },
      { label: "Create an annotated tag", labelKm: "បង្កើត tag ដែលមានសារ", code: 'git tag -a v1.0.0 -m "message"' },
      { label: "Push a tag", labelKm: "Push tag", code: "git push origin v1.0.0" },
      { label: "Checkout a tag", labelKm: "ប្ដូរទៅ tag", code: "git checkout v1.0.0" },
    ],
  },
  {
    title: "Aliases",
    titleKm: "Alias (ឈ្មោះកាត់)",
    items: [
      { label: "Alias for checkout", labelKm: "Alias សម្រាប់ checkout", code: "git config --global alias.co checkout" },
      { label: "Alias for branch", labelKm: "Alias សម្រាប់ branch", code: "git config --global alias.br branch" },
      { label: "Alias for status", labelKm: "Alias សម្រាប់ status", code: "git config --global alias.st status" },
      { label: "Pretty log alias", labelKm: "Alias log ស្អាតៗ", code: 'git config --global alias.lg "log --oneline --graph --all"' },
    ],
  },
];

export default function GitCheatsheet() {
  const { text: t } = useLanguage();

  return (
    <ToolShell
      title="Git Cheat Sheet"
      khmerTitle="សន្លឹកយោង Git"
      description="Quick reference for the most common Git commands, grouped by task — setup, daily workflow, branches, merge & rebase, undo, remotes, stash, tags, and aliases. Click any command to copy it."
      descriptionKm="ឯកសារយោងរហ័សសម្រាប់ពាក្យបញ្ជា Git ទូទៅ ដាក់ជាក្រុមតាមការងារ — រៀបចំ ការងារប្រចាំថ្ងៃ សាខា merge និង rebase ការមិនធ្វើវិញ remote stash tag និង alias។ ចុចលើពាក្យបញ្ជាណាមួយដើម្បីចម្លង។"
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
          "Curated reference of standard Git commands — check the official Git documentation for your version.",
          "ជាសន្លឹកយោងដកស្រង់ពាក្យបញ្ជា Git ស្ដង់ដារ — សូមពិនិត្យឯកសារផ្លូវការរបស់ Git សម្រាប់កំណែរបស់អ្នក។"
        )}
      </p>
    </ToolShell>
  );
}
