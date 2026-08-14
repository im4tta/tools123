'use client';
import React, { useState, useMemo, useRef } from 'react';
import {
  Phone,
  Trash2,
  Copy,
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  Search,
  Table,
  LayoutGrid,
  Check,
  Info,
  FileUp,
  ShieldCheck,
  Sliders,
  Layers,
  BarChart3,
  ArrowUpRight,
  HelpCircle,
  X
} from 'lucide-react';
import { recordExport } from '@/lib/export';

type FormatStyle = 'local' | 'intl' | 'intl_compact' | 'dashed' | 'dotted' | 'compact';
type FilterStatus = 'all' | 'valid' | 'invalid' | 'duplicate';
type OperatorType = 'Cellcard' | 'Smart' | 'Metfone' | 'Other' | 'Unknown';
type ViewMode = 'table' | 'cards' | 'text' | 'social' | 'analytics';
type Language = 'km' | 'en';

interface ParsedNumber {
  id: string;
  originalInput: string;
  normalized: string;
  formatted: string;
  network: OperatorType;
  isValid: boolean;
  isDuplicate: boolean;
  duplicateIndex?: number;
  lineNumber: number;
  telegramUrl: string;
  whatsappUrl: string;
}

const OPERATOR_PREFIXES: Record<OperatorType, string[]> = {
  Cellcard: ['012', '014', '017', '061', '076', '077', '078', '085', '089', '092', '095', '099'],
  Smart: ['010', '015', '016', '069', '070', '081', '086', '087', '093', '096', '098'],
  Metfone: ['031', '060', '066', '067', '068', '071', '088', '090', '097'],
  Other: ['023', '024', '038', '018', '030', '039', '080', '013', '011'],
  Unknown: []
};

const KHMER_DIGIT_MAP: Record<string, string> = {
  '០': '0', '១': '1', '២': '2', '៣': '3', '៤': '4',
  '៥': '5', '៦': '6', '៧': '7', '៨': '8', '៩': '9'
};

const TRANSLATIONS = {
  km: {
    appTitle: 'កម្មវិធីសម្អាត និងបំប្លែងលេខទូរស័ព្ទខ្មែរ',
    appSubtitle: 'កែតម្រូវទម្រង់ បែងចែកប្រព័ន្ធទូរស័ព្ទ (Cellcard, Smart, Metfone) និងលុបលេខស្ទួន',
    prefixCodesBtn: 'កូដប្រព័ន្ធ (Prefixes)',
    clearAllBtn: 'សម្អាតទាំងអស់',
    statTotalRead: 'ចំនួនសរុប',
    statValid: 'លេខត្រឹមត្រូវ',
    statInvalid: 'មិនត្រឹមត្រូវ',
    statDuplicates: 'លេខស្ទួន',
    inputTitle: 'បញ្ចូលបញ្ជីលេខទូរស័ព្ទ',
    uploadBtn: 'បញ្ចូល (.txt / .csv)',
    sampleDatasetsLabel: 'ទិន្នន័យគំរូសាកល្បង៖',
    sampleMixed: 'គំរូចម្រុះ',
    sampleKhmerNumerals: 'លេខអក្សរខ្មែរ (០-៩)',
    sampleMessy: 'លេខស្ទួន និងមិនត្រឹមត្រូវ',
    inputPlaceholder: 'សូមចម្លង ឬវាយបញ្ចូលលេខទូរស័ព្ទនៅទីនេះ (១ ខ្សែ ១ លេខ)...',
    linesFound: (count: number) => `បានរកឃើញ ${count} បន្ទាត់`,
    autoConvertNote: 'បំប្លែងលេខខ្មែរ ០-៩ ស្វ័យប្រវត្តិ',
    formatTitle: 'ជ្រើសរើសទម្រង់បង្ហាញលេខ (Formatting Style)',
    formatLocal: 'ក្នុងស្រុក (Local)',
    formatIntl: 'អន្តរជាតិ (Intl)',
    formatIntlCompact: 'អន្តរជាតិជាប់គ្នា',
    formatDashed: 'សញ្ញាដក (-)',
    formatDotted: 'សញ្ញាចុច (.)',
    formatCompact: 'លេខជាប់គ្នា',
    autoDeduplicateOption: 'លុបលេខស្ទួនស្វ័យប្រវត្តិ (Auto Deduplicate)',
    excludeInvalidOption: 'ជម្រុះលេខមិនត្រឹមត្រូវចេញ (Exclude Invalid)',
    filterAll: 'ទាំងអស់',
    filterValid: 'ត្រឹមត្រូវ',
    filterInvalid: 'មិនត្រឹមត្រូវ',
    filterDuplicate: 'លេខស្ទួន',
    allNetworks: 'គ្រប់ប្រព័ន្ធ',
    searchPlaceholder: 'ស្វែងរកលេខ...',
    viewTable: 'តារាង',
    viewCards: 'ប័ណ្ណ',
    viewText: 'អត្ថបទសុទ្ធ',
    viewSocial: 'តំណសង្គម',
    viewAnalytics: 'វិភាគប្រព័ន្ធ',
    copyAllBtn: 'ចម្លងទាំងអស់',
    noDataFound: 'ពុំមានទិន្នន័យត្រូវគ្នានឹងការស្វែងរកទេ',
    colIndex: '#',
    colFormatted: 'លេខបំប្លែងរួច',
    colOriginal: 'លេខដើម',
    colNetwork: 'ប្រព័ន្ធ',
    colStatus: 'ស្ថានភាព',
    colAction: 'សកម្មភាព',
    statusValid: 'ត្រឹមត្រូវ',
    statusInvalid: 'មិនត្រឹមត្រូវ',
    badgeDuplicate: 'ស្ទួន',
    copyTooltip: 'ចម្លងលេខ',
    opCellcard: 'សែលកាត (Cellcard)',
    opSmart: 'ស្មាត (Smart)',
    opMetfone: 'មិតហ្វូន (Metfone)',
    opOther: 'ផ្សេងៗ',
    prefixModalHeader: 'កូដក្បាលលេខតាមប្រព័ន្ធនិមួយៗ (Prefixes)',
    prefixModalSubtitle: 'ទិន្នន័យផ្លូវការសម្រាប់សម្គាល់ប្រព័ន្ធទូរស័ព្ទចល័តនៅកម្ពុជា',
    prefixModalFooterNote: 'ប្រព័ន្ធបំប្លែងស្វ័យប្រវត្តិនឹងកែប្រែកូដអន្តរជាតិ (+855, 00855) និងបំប្លែងលេខអក្សរខ្មែរ (០-៩) ទៅជាលេខសកលដោយស្វ័យប្រវត្តិ។',
    toastCopiedSingle: (num: string) => `បានចម្លង "${num}"`,
    toastCopiedAll: (count: number) => `បានចម្លង ${count} លេខ`,
    toastNoDataToCopy: 'គ្មានទិន្នន័យសម្រាប់ចម្លងទេ',
    toastExportTxt: 'បានទាញយកជា TXT',
    toastExportCsv: 'បានទាញយកជា CSV',
    toastExportVcard: 'បានទាញយកជា vCard (.vcf)',
    toastFileLoaded: (name: string) => `បានបញ្ចូលឯកសារ ${name}`,
    toastNoVcardData: 'គ្មានលេខត្រឹមត្រូវសម្រាប់ទាញយកជា vCard ទេ'
  },
  en: {
    appTitle: 'Phone Number Cleaner Pro',
    appSubtitle: 'Clean, format, validate, identify operators (Cellcard, Smart, Metfone), and remove duplicates.',
    prefixCodesBtn: 'Prefix Codes',
    clearAllBtn: 'Clear All',
    statTotalRead: 'Total Numbers',
    statValid: 'Valid',
    statInvalid: 'Invalid',
    statDuplicates: 'Duplicates',
    inputTitle: '1. Enter Phone Numbers',
    uploadBtn: 'Upload (.txt / .csv)',
    sampleDatasetsLabel: 'Try Sample Datasets:',
    sampleMixed: 'Cambodian Standard',
    sampleKhmerNumerals: 'Khmer Numerals',
    sampleMessy: 'Messy & Duplicates',
    inputPlaceholder: 'Paste phone numbers or enter them here, one per line...',
    linesFound: (count: number) => `${count} phone numbers`,
    autoConvertNote: 'Auto-converts Khmer digits (០-៩) to Western digits',
    formatTitle: '2. Formatting Options',
    formatLocal: 'Local Format',
    formatIntl: 'International (+855)',
    formatIntlCompact: 'Compact Intl',
    formatDashed: 'Dashed (012-345-678)',
    formatDotted: 'Dotted (012.345.678)',
    formatCompact: 'Compact (012345678)',
    autoDeduplicateOption: 'Auto Deduplicate Numbers',
    excludeInvalidOption: 'Exclude Invalid Entries',
    filterAll: 'All',
    filterValid: 'Valid',
    filterInvalid: 'Invalid',
    filterDuplicate: 'Duplicate',
    allNetworks: 'All Networks',
    searchPlaceholder: 'Search numbers...',
    viewTable: 'Table',
    viewCards: 'Cards',
    viewText: 'Plain Text',
    viewSocial: 'Social Links',
    viewAnalytics: 'Analytics',
    copyAllBtn: 'Copy All',
    noDataFound: 'No numbers found matching your criteria',
    colIndex: '#',
    colFormatted: 'FORMATTED NUMBER',
    colOriginal: 'ORIGINAL INPUT',
    colNetwork: 'NETWORK',
    colStatus: 'STATUS',
    colAction: 'ACTION',
    statusValid: 'Valid',
    statusInvalid: 'Invalid',
    badgeDuplicate: 'Duplicate',
    copyTooltip: 'Copy number',
    opCellcard: 'Cellcard',
    opSmart: 'Smart',
    opMetfone: 'Metfone',
    opOther: 'Other',
    prefixModalHeader: 'Cambodian Operator Prefix Reference',
    prefixModalSubtitle: 'Official mobile operator routing codes in Cambodia',
    prefixModalFooterNote: 'International prefixes (+855, 00855) and Khmer digits (០-៩) are automatically normalized.',
    toastCopiedSingle: (num: string) => `Copied "${num}"`,
    toastCopiedAll: (count: number) => `Copied ${count} numbers`,
    toastNoDataToCopy: 'No data to copy',
    toastExportTxt: 'Exported as TXT',
    toastExportCsv: 'Exported as CSV',
    toastExportVcard: 'Exported as vCard (.vcf)',
    toastFileLoaded: (name: string) => `Loaded file ${name}`,
    toastNoVcardData: 'No valid numbers available to export as vCard'
  }
};

const SAMPLE_MIXED = `012-345-678
012.345.678
012 345 678
+85512345678
096 111 222
096.111.222
097 555 444
097-555-444
010 888 777
088 999 000
+855 15 666 777`;

const SAMPLE_KHMER = `០១២-៣៤៥-៦៧៨
០៩៦ ១១១ ២២២
+៨៥៥៩៧៥៥៥៤៤៤
០១០ ៨៨៨ ៧៧៧
០៦៩ ៧៧៧ ៦៦៦
០១២៣៤៥៦៧៨
០៨៨ ៤៤៤ ៣៣៣`;

const SAMPLE_MESSY = `012-345-678
012345678
+855 12 345 678
096.111.222
invalid_phone_123
096111222
097-555-444
097 555 444
000-000-00
010888777
012-345-678
85516998877`;

function convertKhmerNumerals(str: string): string {
  return str.replace(/[០-៩]/g, (match) => KHMER_DIGIT_MAP[match] || match);
}

function detectOperator(normalized: string): OperatorType {
  if (!normalized || normalized.length < 3) return 'Unknown';
  const prefix3 = normalized.substring(0, 3);
  
  for (const [op, prefixes] of Object.entries(OPERATOR_PREFIXES)) {
    if (prefixes.includes(prefix3)) {
      return op as OperatorType;
    }
  }
  return 'Unknown';
}

function normalizePhoneNumber(raw: string): { normalized: string; isValid: boolean } {
  let cleaned = convertKhmerNumerals(raw.trim());
  cleaned = cleaned.replace(/[^0-9+]/g, '');

  if (cleaned.startsWith('+855')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('00855')) {
    cleaned = '0' + cleaned.slice(5);
  } else if (cleaned.startsWith('855') && cleaned.length >= 11) {
    cleaned = '0' + cleaned.slice(3);
  } else if (!cleaned.startsWith('0') && (cleaned.length === 8 || cleaned.length === 9)) {
    cleaned = '0' + cleaned;
  }

  const isDigitsOnly = /^[0-9]+$/.test(cleaned);
  const validLength = cleaned.length >= 9 && cleaned.length <= 10;
  const startsWithZero = cleaned.startsWith('0');
  const operator = detectOperator(cleaned);

  const isValid = isDigitsOnly && validLength && startsWithZero && operator !== 'Unknown';

  return { normalized: cleaned, isValid };
}

function formatNumber(normalized: string, style: FormatStyle, isValid: boolean): string {
  if (!isValid || !normalized) return normalized;

  const prefix = normalized.substring(0, 3);
  const rest = normalized.substring(3);

  let p1 = '';
  let p2 = '';
  if (rest.length === 6) {
    p1 = rest.substring(0, 3);
    p2 = rest.substring(3);
  } else if (rest.length === 7) {
    p1 = rest.substring(0, 3);
    p2 = rest.substring(3);
  } else {
    p1 = rest.substring(0, Math.ceil(rest.length / 2));
    p2 = rest.substring(Math.ceil(rest.length / 2));
  }

  switch (style) {
    case 'local':
      return `${prefix} ${p1} ${p2}`.trim();
    case 'intl':
      return `+855 ${prefix.substring(1)} ${p1} ${p2}`.trim();
    case 'intl_compact':
      return `+855${prefix.substring(1)}${rest}`;
    case 'dashed':
      return `${prefix}-${p1}-${p2}`;
    case 'dotted':
      return `${prefix}.${p1}.${p2}`;
    case 'compact':
      return normalized;
    default:
      return `${prefix} ${p1} ${p2}`.trim();
  }
}

export default function App() {
  const [lang, setLang] = useState<Language>('km');
  const [inputText, setInputText] = useState<string>(SAMPLE_MIXED);
  const [formatStyle, setFormatStyle] = useState<FormatStyle>('local');
  const [autoDeduplicate, setAutoDeduplicate] = useState<boolean>(true);
  const [excludeInvalid, setExcludeInvalid] = useState<boolean>(false);
  
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [networkFilter, setNetworkFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPrefixModalOpen, setIsPrefixModalOpen] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const t = TRANSLATIONS[lang];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const parsedResults = useMemo(() => {
    const lines = inputText.split('\n');
    const results: ParsedNumber[] = [];
    const seenMap = new Map<string, number>();

    lines.forEach((rawLine, index) => {
      const lineTrimmed = rawLine.trim();
      if (!lineTrimmed) return;

      const { normalized, isValid } = normalizePhoneNumber(lineTrimmed);
      const network = isValid ? detectOperator(normalized) : 'Unknown';

      let isDuplicate = false;
      let duplicateIndex: number | undefined = undefined;

      if (isValid && normalized) {
        if (seenMap.has(normalized)) {
          isDuplicate = true;
          duplicateIndex = seenMap.get(normalized);
        } else {
          seenMap.set(normalized, results.length + 1);
        }
      }

      const formatted = formatNumber(normalized, formatStyle, isValid);
      const intlNumber = isValid ? `855${normalized.substring(1)}` : '';
      const telegramUrl = isValid ? `https://t.me/+${intlNumber}` : '';
      const whatsappUrl = isValid ? `https://wa.me/${intlNumber}` : '';

      results.push({
        id: `line-${index}-${Math.random().toString(36).substring(2, 7)}`,
        originalInput: lineTrimmed,
        normalized,
        formatted,
        network,
        isValid,
        isDuplicate,
        duplicateIndex,
        lineNumber: index + 1,
        telegramUrl,
        whatsappUrl
      });
    });

    return results;
  }, [inputText, formatStyle]);

  const stats = useMemo(() => {
    const total = parsedResults.length;
    const valid = parsedResults.filter((r) => r.isValid).length;
    const invalid = parsedResults.filter((r) => !r.isValid).length;
    const duplicates = parsedResults.filter((r) => r.isDuplicate).length;

    const opCounts: Record<OperatorType, number> = {
      Cellcard: 0,
      Smart: 0,
      Metfone: 0,
      Other: 0,
      Unknown: 0
    };

    parsedResults.forEach((r) => {
      if (r.isValid) {
        opCounts[r.network] = (opCounts[r.network] || 0) + 1;
      }
    });

    return { total, valid, invalid, duplicates, opCounts };
  }, [parsedResults]);

  const filteredResults = useMemo(() => {
    return parsedResults.filter((item) => {
      if (autoDeduplicate && item.isDuplicate) return false;
      if (excludeInvalid && !item.isValid) return false;

      if (statusFilter === 'valid' && !item.isValid) return false;
      if (statusFilter === 'invalid' && item.isValid) return false;
      if (statusFilter === 'duplicate' && !item.isDuplicate) return false;

      if (networkFilter !== 'all' && item.network.toLowerCase() !== networkFilter.toLowerCase()) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchFormatted = item.formatted.toLowerCase().includes(query);
        const matchOriginal = item.originalInput.toLowerCase().includes(query);
        const matchNetwork = item.network.toLowerCase().includes(query);
        return matchFormatted || matchOriginal || matchNetwork;
      }

      return true;
    });
  }, [parsedResults, autoDeduplicate, excludeInvalid, statusFilter, networkFilter, searchQuery]);

  const handleCopySingle = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(t.toastCopiedSingle(text));
  };

  const handleCopyAll = () => {
    const textToCopy = filteredResults.map((r) => r.formatted).join('\n');
    if (!textToCopy) {
      showToast(t.toastNoDataToCopy);
      return;
    }
    navigator.clipboard.writeText(textToCopy);
    showToast(t.toastCopiedAll(filteredResults.length));
  };

  const handleExportTxt = () => {
    const content = filteredResults.map((r) => r.formatted).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cleaned_khmer_phones.txt`;
    link.click();
    URL.revokeObjectURL(url);
    recordExport();
    showToast(t.toastExportTxt);
  };

  const handleExportCsv = () => {
    let csvContent = 'No,Formatted Phone,Original Input,Operator,Status,Duplicate\n';
    filteredResults.forEach((r) => {
      const status = r.isValid ? 'Valid' : 'Invalid';
      const duplicate = r.isDuplicate ? 'Yes' : 'No';
      csvContent += `"${r.lineNumber}","${r.formatted}","${r.originalInput}","${r.network}","${status}","${duplicate}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cleaned_khmer_phones.csv`;
    link.click();
    URL.revokeObjectURL(url);
    recordExport();
    showToast(t.toastExportCsv);
  };

  const handleExportVCard = () => {
    let vcfContent = '';
    filteredResults.forEach((r, idx) => {
      if (r.isValid) {
        const intlNum = `+855${r.normalized.substring(1)}`;
        vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:KH Contact ${idx + 1} (${r.network})\nTEL;TYPE=CELL:${intlNum}\nEND:VCARD\n`;
      }
    });

    if (!vcfContent) {
      showToast(t.toastNoVcardData);
      return;
    }

    const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `khmer_contacts.vcf`;
    link.click();
    URL.revokeObjectURL(url);
    recordExport();
    showToast(t.toastExportVcard);
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setInputText(text);
        showToast(t.toastFileLoaded(file.name));
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--ground)] text-[var(--ink)] font-sans p-4 sm:p-6 lg:p-8 antialiased selection:bg-[var(--slate-accent)] selection:text-[var(--ink)] relative overflow-x-hidden">
      
      {/* Import Khmer Kantumruy Pro & Plus Jakarta Sans Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:ital,wght@0,300..700;1,300..700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        body {
          font-family: 'Kantumruy Pro', 'Plus Jakarta Sans', system-ui, sans-serif;
        }
      `}</style>

      {/* Background Lighting Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--slate-accent)]/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-[var(--gold)]/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-[var(--teal)]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[var(--ground-raised)]/95 border border-[var(--teal)]/50 text-[var(--teal)] px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-[var(--teal)] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Operator Prefix Reference Modal */}
      {isPrefixModalOpen && (
        <div className="fixed inset-0 z-50 bg-[var(--ground)]/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--ground-raised)] border border-[var(--ground-line)]/80 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 relative shadow-2xl animate-in zoom-in-95 duration-150">
            
            <button
              onClick={() => setIsPrefixModalOpen(false)}
              className="absolute top-5 right-5 text-[var(--ink-dim)] hover:text-[var(--ink)] p-2 rounded-xl bg-[var(--ground-raised-hi)]/60 hover:bg-[var(--ground-raised-hi)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--slate-accent)]/10 text-[var(--slate-accent)] border border-[var(--slate-accent)]/20 text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t.prefixCodesBtn}</span>
              </div>
              <h3 className="text-lg font-bold text-[var(--ink)] pt-2">{t.prefixModalHeader}</h3>
              <p className="text-xs text-[var(--ink-dim)]">{t.prefixModalSubtitle}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
              
              {/* Cellcard Card */}
              <div className="p-4 bg-gradient-to-b from-[var(--ground-raised)] to-[var(--ground)] border border-[var(--gold)]/30 rounded-2xl space-y-2">
                <div className="font-bold text-[var(--gold)] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--gold)] shadow-sm shadow-amber-400/50" />
                  {t.opCellcard}
                </div>
                <div className="font-mono text-[var(--ink)] text-[11px] leading-relaxed">
                  {OPERATOR_PREFIXES.Cellcard.join(', ')}
                </div>
              </div>

              {/* Smart Card */}
              <div className="p-4 bg-gradient-to-b from-[var(--ground-raised)] to-[var(--ground)] border border-[var(--teal)]/30 rounded-2xl space-y-2">
                <div className="font-bold text-[var(--teal)] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--teal)] shadow-sm shadow-[var(--teal)]/50" />
                  {t.opSmart}
                </div>
                <div className="font-mono text-[var(--ink)] text-[11px] leading-relaxed">
                  {OPERATOR_PREFIXES.Smart.join(', ')}
                </div>
              </div>

              {/* Metfone Card */}
              <div className="p-4 bg-gradient-to-b from-[var(--ground-raised)] to-[var(--ground)] border border-[var(--danger)]/30 rounded-2xl space-y-2">
                <div className="font-bold text-[var(--danger)] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--danger)] shadow-sm shadow-[var(--danger)]/50" />
                  {t.opMetfone}
                </div>
                <div className="font-mono text-[var(--ink)] text-[11px] leading-relaxed">
                  {OPERATOR_PREFIXES.Metfone.join(', ')}
                </div>
              </div>

            </div>

            <div className="text-[var(--ink-dim)] text-xs leading-relaxed pt-3 border-t border-[var(--ground-line)] flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[var(--slate-accent)] shrink-0 mt-0.5" />
              <span>{t.prefixModalFooterNote}</span>
            </div>

          </div>
        </div>
      )}

      {/* Main App Workspace */}
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Bar with Language Switcher */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-[var(--ground-line)]/80">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[var(--slate-accent)] to-[var(--slate-accent-dim)] p-0.5 shadow-lg shadow-[var(--slate-accent)]/20">
              <div className="w-full h-full bg-[var(--ground)] rounded-[14px] flex items-center justify-center text-[var(--slate-accent)]">
                <Phone className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-[var(--ink)] tracking-tight">
                  {t.appTitle}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[var(--slate-accent)]/20 border border-[var(--slate-accent)]/30 text-[var(--slate-accent)] text-[10px] font-bold">
                  PRO v2.5
                </span>
              </div>
              <p className="text-xs text-[var(--ink-dim)] mt-0.5">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Action Buttons & Language Switcher */}
          <div className="flex flex-wrap items-center gap-2.5 self-end md:self-auto">
            
            {/* Language Switcher Toggle Button */}
            <div className="inline-flex items-center bg-[var(--ground-raised)] border border-[var(--ground-line)]/80 rounded-xl p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setLang('km')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  lang === 'km'
                    ? 'bg-[var(--slate-accent)] text-[var(--ink)] shadow-sm'
                    : 'text-[var(--ink-dim)] hover:text-[var(--ink)]'
                }`}
              >
                KH
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  lang === 'en'
                    ? 'bg-[var(--slate-accent)] text-[var(--ink)] shadow-sm'
                    : 'text-[var(--ink-dim)] hover:text-[var(--ink)]'
                }`}
              >
                EN
              </button>
            </div>

            <button
              onClick={() => setIsPrefixModalOpen(true)}
              className="px-3.5 py-2 bg-[var(--ground-raised)] hover:bg-[var(--ground-raised-hi)] text-[var(--ink)] rounded-xl text-xs font-semibold border border-[var(--ground-line)]/80 transition-all flex items-center gap-2 shadow-sm"
            >
              <HelpCircle className="w-4 h-4 text-[var(--slate-accent)]" />
              <span>{t.prefixCodesBtn}</span>
            </button>

            <button
              onClick={() => setInputText('')}
              className="px-3.5 py-2 bg-[var(--danger)]/10 hover:bg-[var(--danger)]/20 text-[var(--danger)] rounded-xl text-xs font-semibold border border-[var(--danger)]/30 transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t.clearAllBtn}</span>
            </button>
          </div>
        </header>

        {/* Dashboard Stat Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--ground-raised)]/90 to-[var(--slate-accent)]/40 border border-[var(--slate-accent)]/20 shadow-md space-y-1">
            <div className="flex items-center justify-between text-xs text-[var(--slate-accent)] font-medium">
              <span>{t.statTotalRead}</span>
              <Layers className="w-4 h-4 opacity-70" />
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--ink)] pt-1">
              {stats.total}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--ground-raised)]/90 to-[var(--teal)]/40 border border-[var(--teal)]/30 shadow-md space-y-1">
            <div className="flex items-center justify-between text-xs text-[var(--teal)] font-medium">
              <span>{t.statValid}</span>
              <CheckCircle2 className="w-4 h-4 opacity-70" />
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--teal)] pt-1">
              {stats.valid}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--ground-raised)]/90 to-[var(--danger)]/40 border border-[var(--danger)]/30 shadow-md space-y-1">
            <div className="flex items-center justify-between text-xs text-[var(--danger)] font-medium">
              <span>{t.statInvalid}</span>
              <XCircle className="w-4 h-4 opacity-70" />
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--danger)] pt-1">
              {stats.invalid}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--ground-raised)]/90 to-[var(--gold)]/40 border border-[var(--gold)]/30 shadow-md space-y-1">
            <div className="flex items-center justify-between text-xs text-[var(--gold)] font-medium">
              <span>{t.statDuplicates}</span>
              <Copy className="w-4 h-4 opacity-70" />
            </div>
            <div className="text-2xl font-bold font-mono text-[var(--gold)] pt-1">
              {stats.duplicates}
            </div>
          </div>

        </div>

        {/* Main Grid Studio */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Panel: Inputs & Format Controls */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Input Box Card */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`bg-[var(--ground-raised)]/80 border rounded-2xl p-5 space-y-4 transition-all shadow-lg ${
                isDragOver ? 'border-[var(--slate-accent)] bg-[var(--slate-accent)]/10 ring-2 ring-[var(--slate-accent)]/20' : 'border-[var(--ground-line)]'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--ink)] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[var(--slate-accent)]" />
                  {t.inputTitle}
                </span>
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 bg-[var(--ground-raised-hi)] hover:bg-[var(--ground-line)] text-[var(--slate-accent)] rounded-lg font-semibold transition-colors flex items-center gap-1.5 border border-[var(--ground-line)]/60"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>{t.uploadBtn}</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  accept=".txt,.csv"
                  className="hidden"
                />
              </div>

              {/* Sample Preset Buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[var(--ink-dim)]">{t.sampleDatasetsLabel}</span>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <button
                    onClick={() => setInputText(SAMPLE_MIXED)}
                    className="px-2.5 py-1 bg-[var(--ground-raised-hi)]/80 hover:bg-[var(--ground-line)] text-[var(--ink)] rounded-lg border border-[var(--ground-line)]/60 transition-colors"
                  >
                    {t.sampleMixed}
                  </button>
                  <button
                    onClick={() => setInputText(SAMPLE_KHMER)}
                    className="px-2.5 py-1 bg-[var(--ground-raised-hi)]/80 hover:bg-[var(--ground-line)] text-[var(--ink)] rounded-lg border border-[var(--ground-line)]/60 transition-colors"
                  >
                    {t.sampleKhmerNumerals}
                  </button>
                  <button
                    onClick={() => setInputText(SAMPLE_MESSY)}
                    className="px-2.5 py-1 bg-[var(--ground-raised-hi)]/80 hover:bg-[var(--ground-line)] text-[var(--ink)] rounded-lg border border-[var(--ground-line)]/60 transition-colors"
                  >
                    {t.sampleMessy}
                  </button>
                </div>
              </div>

              {/* Main Textarea */}
              <textarea
                rows={10}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t.inputPlaceholder}
                className="w-full p-4 bg-[var(--ground)] border border-[var(--ground-line)] rounded-xl font-mono text-xs text-[var(--ink)] placeholder-[var(--ink-faint)] focus:outline-none focus:border-[var(--slate-accent)] focus:ring-1 focus:ring-[var(--slate-accent)] transition-all resize-y leading-relaxed"
              />

              <div className="flex items-center justify-between text-[11px] text-[var(--ink-dim)] font-medium">
                <span>{t.linesFound(inputText.split('\n').filter((l) => l.trim()).length)}</span>
                <span>{t.autoConvertNote}</span>
              </div>
            </div>

            {/* Output Formatting Options Card */}
            <div className="bg-[var(--ground-raised)]/80 border border-[var(--ground-line)] rounded-2xl p-5 space-y-4 shadow-lg">
              <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[var(--slate-accent)]" />
                {t.formatTitle}
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'local', label: t.formatLocal, example: '012 345 678' },
                  { id: 'intl', label: t.formatIntl, example: '+855 12 345 678' },
                  { id: 'intl_compact', label: t.formatIntlCompact, example: '+85512345678' },
                  { id: 'dashed', label: t.formatDashed, example: '012-345-678' },
                  { id: 'dotted', label: t.formatDotted, example: '012.345.678' },
                  { id: 'compact', label: t.formatCompact, example: '012345678' },
                ].map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setFormatStyle(style.id as FormatStyle)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      formatStyle === style.id
                        ? 'border-[var(--slate-accent)] bg-[var(--slate-accent)]/10 text-[var(--ink)] shadow-sm ring-1 ring-[var(--slate-accent)]/30'
                        : 'border-[var(--ground-line)] bg-[var(--ground)]/50 text-[var(--ink-dim)] hover:bg-[var(--ground-raised-hi)]/60'
                    }`}
                  >
                    <div className="font-bold text-[var(--ink)]">{style.label}</div>
                    <div className="text-[10px] font-mono mt-0.5 text-[var(--slate-accent)]/80">{style.example}</div>
                  </button>
                ))}
              </div>

              {/* Option Toggles */}
              <div className="pt-3 border-t border-[var(--ground-line)] space-y-3 text-xs">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[var(--ink)] font-medium">{t.autoDeduplicateOption}</span>
                  <input
                    type="checkbox"
                    checked={autoDeduplicate}
                    onChange={(e) => setAutoDeduplicate(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--ground-line)] bg-[var(--ground)] text-[var(--slate-accent)] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[var(--ink)] font-medium">{t.excludeInvalidOption}</span>
                  <input
                    type="checkbox"
                    checked={excludeInvalid}
                    onChange={(e) => setExcludeInvalid(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--ground-line)] bg-[var(--ground)] text-[var(--slate-accent)] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                </label>
              </div>

            </div>

          </div>

          {/* Right Panel: Cleaned Output Studio */}
          <div className="lg:col-span-7 space-y-4">
            
            <div className="bg-[var(--ground-raised)]/80 border border-[var(--ground-line)] rounded-2xl p-5 space-y-4 shadow-lg">
              
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-[var(--ground-line)]">
                
                {/* Status Segmented Controls */}
                <div className="flex items-center bg-[var(--ground)] p-1 rounded-xl border border-[var(--ground-line)] text-xs font-semibold">
                  {[
                    { id: 'all', label: t.filterAll },
                    { id: 'valid', label: t.filterValid },
                    { id: 'invalid', label: t.filterInvalid },
                    { id: 'duplicate', label: t.filterDuplicate }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStatusFilter(item.id as FilterStatus)}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        statusFilter === item.id
                          ? 'bg-[var(--slate-accent)] text-[var(--ink)] shadow-sm'
                          : 'text-[var(--ink-dim)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Network Selector & Search */}
                <div className="flex items-center gap-2">
                  <select
                    value={networkFilter}
                    onChange={(e) => setNetworkFilter(e.target.value)}
                    className="px-3 py-1.5 bg-[var(--ground)] border border-[var(--ground-line)] rounded-xl text-xs font-semibold text-[var(--ink)] outline-none focus:border-[var(--slate-accent)]"
                  >
                    <option value="all">{t.allNetworks}</option>
                    <option value="cellcard">{t.opCellcard}</option>
                    <option value="smart">{t.opSmart}</option>
                    <option value="metfone">{t.opMetfone}</option>
                  </select>

                  <div className="relative flex-1 sm:w-36">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
                    <input
                      type="text"
                      placeholder={t.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-[var(--ground)] border border-[var(--ground-line)] rounded-xl text-xs text-[var(--ink)] placeholder-[var(--ink-faint)] outline-none focus:border-[var(--slate-accent)]"
                    />
                  </div>
                </div>

              </div>

              {/* View Selector & Export Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
                
                {/* View Mode Buttons */}
                <div className="flex items-center gap-1 bg-[var(--ground)] p-1 rounded-xl border border-[var(--ground-line)] font-semibold">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-2.5 py-1.2 rounded-lg flex items-center gap-1.5 transition-all ${
                      viewMode === 'table' ? 'bg-[var(--ground-raised-hi)] text-[var(--slate-accent)]' : 'text-[var(--ink-dim)] hover:text-[var(--ink)]'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>{t.viewTable}</span>
                  </button>
                  
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-2.5 py-1.2 rounded-lg flex items-center gap-1.5 transition-all ${
                      viewMode === 'cards' ? 'bg-[var(--ground-raised-hi)] text-[var(--slate-accent)]' : 'text-[var(--ink-dim)] hover:text-[var(--ink)]'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>{t.viewCards}</span>
                  </button>

                  <button
                    onClick={() => setViewMode('text')}
                    className={`px-2.5 py-1.2 rounded-lg flex items-center gap-1.5 transition-all ${
                      viewMode === 'text' ? 'bg-[var(--ground-raised-hi)] text-[var(--slate-accent)]' : 'text-[var(--ink-dim)] hover:text-[var(--ink)]'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{t.viewText}</span>
                  </button>

                  <button
                    onClick={() => setViewMode('social')}
                    className={`px-2.5 py-1.2 rounded-lg flex items-center gap-1.5 transition-all ${
                      viewMode === 'social' ? 'bg-[var(--ground-raised-hi)] text-[var(--slate-accent)]' : 'text-[var(--ink-dim)] hover:text-[var(--ink)]'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>{t.viewSocial}</span>
                  </button>

                  <button
                    onClick={() => setViewMode('analytics')}
                    className={`px-2.5 py-1.2 rounded-lg flex items-center gap-1.5 transition-all ${
                      viewMode === 'analytics' ? 'bg-[var(--ground-raised-hi)] text-[var(--slate-accent)]' : 'text-[var(--ink-dim)] hover:text-[var(--ink)]'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>{t.viewAnalytics}</span>
                  </button>
                </div>

                {/* Export Options Buttons */}
                <div className="flex items-center gap-1.5 font-semibold">
                  <button
                    onClick={handleCopyAll}
                    className="px-3 py-1.5 bg-[var(--slate-accent)] hover:bg-[var(--slate-accent)] text-[var(--ink)] rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t.copyAllBtn}</span>
                  </button>

                  <button
                    onClick={handleExportTxt}
                    className="px-2.5 py-1.5 bg-[var(--ground-raised-hi)] hover:bg-[var(--ground-line)] text-[var(--ink)] rounded-xl border border-[var(--ground-line)]/60 transition-all"
                  >
                    TXT
                  </button>

                  <button
                    onClick={handleExportCsv}
                    className="px-2.5 py-1.5 bg-[var(--teal)] hover:bg-[var(--teal)] text-[var(--ink)] rounded-xl transition-all flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>

                  <button
                    onClick={handleExportVCard}
                    className="px-2.5 py-1.5 bg-[var(--ground-raised-hi)] hover:bg-[var(--ground-line)] text-[var(--ink)] rounded-xl border border-[var(--ground-line)]/60 transition-all"
                    title="Export vCard (.vcf) for Phone Contacts"
                  >
                    vCard
                  </button>
                </div>

              </div>

              {/* View Mode 1: Table View */}
              {viewMode === 'table' && (
                <div className="overflow-x-auto rounded-xl border border-[var(--ground-line)] bg-[var(--ground)]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[var(--ground-line)] text-[var(--ink-dim)] font-bold bg-[var(--ground-raised)]/50">
                        <th className="py-3 px-3.5">{t.colIndex}</th>
                        <th className="py-3 px-3.5">{t.colFormatted}</th>
                        <th className="py-3 px-3.5">{t.colOriginal}</th>
                        <th className="py-3 px-3.5">{t.colNetwork}</th>
                        <th className="py-3 px-3.5">{t.colStatus}</th>
                        <th className="py-3 px-3.5 text-right">{t.colAction}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredResults.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-[var(--ink-faint)] italic">
                            {t.noDataFound}
                          </td>
                        </tr>
                      ) : (
                        filteredResults.map((item) => (
                          <tr key={item.id} className="hover:bg-[var(--ground-raised)]/70 transition-colors">
                            <td className="py-3 px-3.5 font-mono text-[var(--ink-faint)]">
                              {item.lineNumber}
                            </td>

                            <td className="py-3 px-3.5 font-mono font-bold text-[var(--ink)] text-sm">
                              {item.formatted}
                            </td>

                            <td className="py-3 px-3.5 font-mono text-[var(--ink-dim)]">
                              {item.originalInput}
                            </td>

                            <td className="py-3 px-3.5">
                              {item.isValid ? (
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                    item.network === 'Cellcard'
                                      ? 'text-[var(--gold)] bg-[var(--gold)]/10 border border-[var(--gold)]/30'
                                      : item.network === 'Smart'
                                      ? 'text-[var(--teal)] bg-[var(--teal)]/10 border border-[var(--teal)]/30'
                                      : item.network === 'Metfone'
                                      ? 'text-[var(--danger)] bg-[var(--danger)]/10 border border-[var(--danger)]/30'
                                      : 'text-[var(--slate-accent)] bg-[var(--slate-accent)]/10 border border-[var(--slate-accent)]/30'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    item.network === 'Cellcard' ? 'bg-[var(--gold)]' :
                                    item.network === 'Smart' ? 'bg-[var(--teal)]' :
                                    item.network === 'Metfone' ? 'bg-[var(--danger)]' : 'bg-[var(--slate-accent)]'
                                  }`} />
                                  {item.network === 'Cellcard' ? (lang === 'km' ? 'សែលកាត' : 'Cellcard') :
                                   item.network === 'Smart' ? (lang === 'km' ? 'ស្មាត' : 'Smart') :
                                   item.network === 'Metfone' ? (lang === 'km' ? 'មិតហ្វូន' : 'Metfone') :
                                   (lang === 'km' ? 'ផ្សេងៗ' : 'Other')}
                                </span>
                              ) : (
                                <span className="text-[var(--ink-faint)]">—</span>
                              )}
                            </td>

                            <td className="py-3 px-3.5">
                              {item.isValid ? (
                                <span className="text-[var(--teal)] font-bold text-[11px] inline-flex items-center gap-1">
                                  <Check className="w-3 h-3" /> {t.statusValid}
                                </span>
                              ) : (
                                <span className="text-[var(--danger)] font-bold text-[11px] inline-flex items-center gap-1">
                                  <X className="w-3 h-3" /> {t.statusInvalid}
                                </span>
                              )}
                              {item.isDuplicate && (
                                <span className="ml-1.5 text-[var(--gold)] text-[10px] bg-[var(--gold)]/10 border border-[var(--gold)]/30 px-1.5 py-0.5 rounded-md font-bold">
                                  {t.badgeDuplicate}
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleCopySingle(item.formatted)}
                                className="text-[var(--ink-dim)] hover:text-[var(--ink)] p-1.5 rounded-lg bg-[var(--ground-raised)] hover:bg-[var(--ground-raised-hi)] transition-colors"
                                title={t.copyTooltip}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* View Mode 2: Grid Cards View */}
              {viewMode === 'cards' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredResults.length === 0 ? (
                    <div className="col-span-full py-10 text-center text-[var(--ink-faint)] italic text-xs">
                      {t.noDataFound}
                    </div>
                  ) : (
                    filteredResults.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 bg-[var(--ground)] border border-[var(--ground-line)] rounded-xl space-y-2.5 text-xs shadow-sm hover:border-[var(--ground-line)] transition-all"
                      >
                        <div className="flex items-center justify-between text-[var(--ink-faint)] font-mono text-[11px]">
                          <span>#{item.lineNumber}</span>
                          <div>
                            {item.isValid && (
                              <span className={`font-sans font-bold px-2 py-0.5 rounded-full text-[10px] ${
                                item.network === 'Cellcard' ? 'text-[var(--gold)] bg-[var(--gold)]/10 border border-[var(--gold)]/30' :
                                item.network === 'Smart' ? 'text-[var(--teal)] bg-[var(--teal)]/10 border border-[var(--teal)]/30' :
                                item.network === 'Metfone' ? 'text-[var(--danger)] bg-[var(--danger)]/10 border border-[var(--danger)]/30' : 'text-[var(--ink-dim)]'
                              }`}>
                                {item.network === 'Cellcard' ? (lang === 'km' ? 'សែលកាត' : 'Cellcard') :
                                 item.network === 'Smart' ? (lang === 'km' ? 'ស្មាត' : 'Smart') :
                                 item.network === 'Metfone' ? (lang === 'km' ? 'មិតហ្វូន' : 'Metfone') :
                                 (lang === 'km' ? 'ផ្សេងៗ' : 'Other')}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="font-mono font-bold text-[var(--ink)] text-base tracking-wide">
                          {item.formatted}
                        </div>

                        <div className="flex items-center justify-between pt-1 text-[var(--ink-dim)] border-t border-[var(--ground-line)]/60">
                          <span className="font-mono text-[11px] truncate max-w-[150px] text-[var(--ink-faint)]">
                            {item.originalInput}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopySingle(item.formatted)}
                            className="text-[var(--ink-dim)] hover:text-[var(--ink)] p-1 rounded transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* View Mode 3: Raw Text Output */}
              {viewMode === 'text' && (
                <div className="space-y-2">
                  <textarea
                    readOnly
                    rows={12}
                    value={filteredResults.map((r) => r.formatted).join('\n')}
                    className="w-full p-4 bg-[var(--ground)] border border-[var(--ground-line)] rounded-xl font-mono text-xs text-[var(--slate-accent)] outline-none leading-relaxed"
                  />
                </div>
              )}

              {/* View Mode 4: Social Quick Connect Links */}
              {viewMode === 'social' && (
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {filteredResults.filter((r) => r.isValid).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-[var(--ground)] border border-[var(--ground-line)] rounded-xl flex items-center justify-between gap-3 text-xs hover:border-[var(--ground-line)] transition-all"
                    >
                      <div>
                        <div className="font-mono font-bold text-[var(--ink)] text-sm">
                          {item.formatted}
                        </div>
                        <span className="text-[10px] font-semibold text-[var(--ink-dim)]">
                          {item.network} Network
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-semibold">
                        <a
                          href={item.telegramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-[var(--slate-accent)]/10 hover:bg-[var(--slate-accent)]/20 text-[var(--slate-accent)] border border-[var(--slate-accent)]/30 rounded-lg text-[11px] flex items-center gap-1 transition-all"
                        >
                          <span>Telegram</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                        <a
                          href={item.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-[var(--teal)]/10 hover:bg-[var(--teal)]/20 text-[var(--teal)] border border-[var(--teal)]/30 rounded-lg text-[11px] flex items-center gap-1 transition-all"
                        >
                          <span>WhatsApp</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* View Mode 5: Carrier Analytics Chart */}
              {viewMode === 'analytics' && (
                <div className="space-y-5 p-3 text-xs">
                  <div className="space-y-4">
                    {[
                      { op: t.opCellcard, count: stats.opCounts.Cellcard, color: 'bg-[var(--gold)]', textColor: 'text-[var(--gold)]' },
                      { op: t.opSmart, count: stats.opCounts.Smart, color: 'bg-[var(--teal)]', textColor: 'text-[var(--teal)]' },
                      { op: t.opMetfone, count: stats.opCounts.Metfone, color: 'bg-[var(--danger)]', textColor: 'text-[var(--danger)]' },
                      { op: t.opOther, count: stats.opCounts.Other, color: 'bg-[var(--slate-accent)]', textColor: 'text-[var(--slate-accent)]' },
                    ].map(({ op, count, color, textColor }) => {
                      const pct = stats.valid > 0 ? Math.round((count / stats.valid) * 100) : 0;
                      return (
                        <div key={op} className="space-y-1.5">
                          <div className="flex items-center justify-between text-[var(--ink)] font-semibold">
                            <span>{op}</span>
                            <span className={`font-mono font-bold ${textColor}`}>{count} ({pct}%)</span>
                          </div>
                          <div className="w-full h-2.5 bg-[var(--ground)] rounded-full overflow-hidden border border-[var(--ground-line)] p-0.5">
                            <div
                              className={`h-full ${color} rounded-full transition-all duration-500`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}