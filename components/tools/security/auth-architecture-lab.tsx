"use client";

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BadgeCheck,
  Binary,
  BookOpen,
  Building2,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Compass,
  Cookie,
  Cpu,
  FileJson,
  Fingerprint,
  GitFork,
  HelpCircle,
  Key,
  Layers,
  Lock,
  Network,
  Play,
  ScanFace,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Table2,
  Terminal,
  Ticket,
  XCircle,
} from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { Field, Select, ToolShell } from "@/components/ui/Shell";

type MethodGroup = "selfie" | "biometric" | "identification" | "delegation" | "cryptographic";
type Accent = "gold" | "teal" | "slate" | "danger" | "success";

const ACCENTS: Record<Accent, { text: string; bg10: string; border: string; dot: string }> = {
  gold: { text: "text-[var(--gold)]", bg10: "bg-[var(--gold)]/10", border: "border-[var(--gold)]/40", dot: "bg-[var(--gold)]" },
  teal: { text: "text-[var(--teal)]", bg10: "bg-[var(--teal)]/10", border: "border-[var(--teal)]/40", dot: "bg-[var(--teal)]" },
  slate: { text: "text-[var(--slate-accent)]", bg10: "bg-[var(--slate-accent)]/10", border: "border-[var(--slate-accent)]/40", dot: "bg-[var(--slate-accent)]" },
  danger: { text: "text-[var(--danger)]", bg10: "bg-[var(--danger)]/10", border: "border-[var(--danger)]/40", dot: "bg-[var(--danger)]" },
  success: { text: "text-[var(--success)]", bg10: "bg-[var(--success)]/10", border: "border-[var(--success)]/40", dot: "bg-[var(--success)]" },
};

interface Method {
  id: string;
  num: string;
  title: string;
  sub: string;
  badge: string;
  group: MethodGroup;
  accent: Accent;
  icon: LucideIcon;
  desc: string;
  trust: string;
  code: string;
  strength: string;
  risk: string;
  bestFor: string;
  inspectorDesc: string;
  matrix: { osi: string; state: string; granularity: string; phishing: string; risk: string };
}

const METHODS: Method[] = [
  {
    id: "selfie-ekyc",
    num: "",
    title: "Meta & Google AI Selfie & Video Liveness",
    sub: "Active/Passive Video Motion • Deepfake Anti-Spoofing • 512-d Face Vector Embeddings",
    badge: "NIST IAL2 / eKYC",
    group: "selfie",
    accent: "danger",
    icon: Camera,
    desc: "ត្រូវបានប្រើប្រាស់ដោយ <strong>Meta (Facebook / Instagram)</strong> សម្រាប់ស្តារគណនីឡើងវិញ (Account Recovery) និង <strong>Google (Google Wallet / Cloud Identity)</strong> សម្រាប់ eKYC។ កម្មវិធីបាញ់បញ្ជូនវីដេអូខ្លី ឬរូបថត real-time ហើយម៉ូឌែល AI វិភាគចលនាទម្រង់មុខ (ងាកឆ្វេងស្ដាំ, បិទបើកភ្នែក) ព្រមទាំងគណនា vector ផ្ទៃមុខ 512-d ដើម្បីផ្ទៀងផ្ទាត់ជាមួយ Vault ទិន្នន័យ។",
    trust: "ដែនកំណត់ Cloud AI Identity Proofing (NIST IAL2/IAL3)។ ការពារការលួចគណនី នៅពេលដែលអ្នកប្រើប្រាស់បាត់បង់ទូរស័ព្ទ, ឧបករណ៍ Hardware Passkeys ឬ 2FA។",
    code: `POST /v1/identity/selfie-liveness HTTP/1.1
{
  "motionLiveness": { "headYaw": 24.5, "blinkCount": 3, "score": 0.998 },
  "embeddingVector": [-0.012, 0.482, ...]
}`,
    strength: "ស្ដារគណនីបានដោយសុវត្ថិភាពខ្ពស់ដោយមិនបាច់ប្រើលេខសម្ងាត់ និងការពារ Deepfake និងរូបថតបោកប្រាស់។",
    risk: "ត្រូវអនុវត្តតាមច្បាប់ឯកជនភាពទិន្នន័យ (GDPR/BIPA) និងត្រូវការប្រព័ន្ធលុបទិន្នន័យវីដេអូស្វ័យប្រវត្តិ។",
    bestFor: "Account Recovery, eKYC Onboarding, Meta Pay & Google Wallet",
    inspectorDesc: "កម្មវិធីថតយកវីដេអូ ឬរូបថតជាប់ៗគ្នា។ AI វិភាគចលនាក្បាលរស់រវើក (Liveness) រួចគណនា Facial Distance ប្រៀបធៀបជាមួយ Vault ដែលបានរក្សាទុក។",
    matrix: {
      osi: "Cloud AI / Layer 7",
      state: "Vector Embedding Vault",
      granularity: "Biometric Proofing (NIST IAL2)",
      phishing: "១០០% (Anti-Deepfake Liveness)",
      risk: "វីដេអូ AI deepfakes បើគ្មាន Liveness Check",
    },
  },
  {
    id: "webauthn",
    num: "១.",
    title: "Passkeys & WebAuthn / ជីវមាត្រ",
    sub: "W3C Standard • Face ID / Fingerprint / Iris",
    badge: "មិនប្រើ Password",
    group: "biometric",
    accent: "gold",
    icon: ScanFace,
    desc: "ប្រើប្រាស់បច្ចេកវិទ្យាជីវមាត្រ hardware (Face ID, Touch ID / ស្នាមម្រាមដៃ, ស្កេនប្រស្រីភ្នែក) នៅក្នុងបន្ទះឈីប <strong>Secure Enclave / TPM</strong> នៃទូរស័ព្ទ។ ទិន្នន័យជីវមាត្រ <em>មិនដែលចាកចេញពីទូរស័ព្ទឡើយ</em>។",
    trust: "ដែនកំណត់ Hardware ជីវមាត្រ។ ការពារការ Phishing ១០០% — រូបភាពជីវមាត្រនៅក្នុងទូរស័ព្ទ ហើយ Server ទទួលបានតែ Cryptographic Signature ប៉ុណ្ណោះ។",
    code: `navigator.credentials.get({
  publicKey: { challenge: new Uint8Array(...),
               userVerification: "required" }
});`,
    strength: "ការពារ Credential Phishing ១០០%, គ្មាន Password ត្រូវលេចធ្លាយ, លឿននិងរលូន។",
    risk: "ត្រូវមានយុទ្ធសាស្ត្រ Account Recovery ពេលអ្នកប្រើប្រាស់បាត់បង់ឧបករណ៍ Hardware។",
    bestFor: "កម្មវិធីធនាគារ (Mobile Banking), Zero-Trust Authentication",
    inspectorDesc: "ឧបករណ៍ផ្ទាល់ខ្លួនធ្វើការផ្ទៀងផ្ទាត់ Face ID, ស្នាមម្រាមដៃ ឬស្កេនប្រស្រីភ្នែក នៅក្នុងបន្ទះឈីប Secure Enclave។ Server ទទួលបានតែ Cryptographic Assertion Signature ប៉ុណ្ណោះ។",
    matrix: {
      osi: "Hardware / W3C",
      state: "Stateless PubKey",
      granularity: "User Biometric Binding",
      phishing: "១០០% Phishing Proof",
      risk: "ត្រូវការវិធីសាស្ត្រស្តារគណនីពេលបាត់ទូរស័ព្ទ",
    },
  },
  {
    id: "api-keys",
    num: "២.",
    title: "API Keys",
    sub: "Layer 7 • Service Identification",
    badge: "Project / Metering",
    group: "identification",
    accent: "slate",
    icon: Key,
    desc: "ជា String វែងដែលផ្ដល់ឱ្យ Developer ឬប្រព័ន្ធខាងក្រៅ ដើម្បីសម្គាល់ថា <em>តើកម្មវិធីមួយណា</em> កំពុងហៅប្រើប្រាស់ API សម្រាប់កំណត់ Rate Limit, Quotas និងប្រព័ន្ធគិតប្រាក់ (Billing)។",
    trust: "ការពារ API Gateway ពីការប្រើប្រាស់ហួសកម្រិត (Quota Limit)។ វាមិនមែនជាឧបករណ៍បញ្ជាក់អត្តសញ្ញាណអ្នកប្រើប្រាស់ (User Identity) ឡើយ!",
    code: `GET /v1/telemetry HTTP/1.1
X-API-Key: api_live_9f823a1b4c7d2e...`,
    strength: "ងាយស្រួលរៀបចំ, ផ្ទៀងផ្ទាត់រហ័សនៅ API Gateway level, ងាយស្រួលកំណត់ Rate Limit។",
    risk: "ងាយស្រួលជ្រុះលេចធ្លាយ ប្រសិនបើសរសេរ Hardcode ក្នុងកូដ Frontend JavaScript។",
    bestFor: "Public B2B APIs, SDK Integrations",
    inspectorDesc: "ជា String សម្គាល់គម្រោងដែលត្រូវផ្ញើជាមួយគ្រប់ HTTP call។ ប្រើប្រាស់សម្រាប់កំណត់ Rate limit និងតាមដានការប្រើប្រាស់ (Billing)។",
    matrix: {
      osi: "Layer 7",
      state: "Stateful (Lookup)",
      granularity: "Project Level",
      phishing: "ទាប (Low)",
      risk: "សរសេរជ្រុះក្នុងកូដ Frontend JavaScript",
    },
  },
  {
    id: "basic-auth",
    num: "៣.",
    title: "Basic Authentication",
    sub: "RFC 7617 • HTTP Protocol Level",
    badge: "Point-to-Point",
    group: "identification",
    accent: "slate",
    icon: Lock,
    desc: "ផ្ញើឈ្មោះអ្នកប្រើប្រាស់ និងលេខសម្ងាត់ ដោយភ្ជាប់គ្នារវាងសញ្ញាចុចពីរ (<code class=\"text-[var(--slate-accent)]\">user:pass</code>) ហើយធ្វើការ Base64 Encode ជាមួយ <em>គ្រប់ HTTP request ទាំងអស់</em>។ ត្រូវតែប្រើប្រាស់ជាមួយ HTTPS/TLS ដាច់ខាត។",
    trust: "ការពារការចូលប្រើប្រាស់ Server ដោយផ្ទាល់តាមរយៈបណ្តាញចរាចរណ៍ HTTPS ដែលបាន Encrypt។",
    code: `GET /admin/dashboard HTTP/1.1
Authorization: Basic YWRtaW46c2VjcmV0MTIz`,
    strength: "មានស្រាប់នៅក្នុង Web Browser និង Web Server (Nginx / Apache)។",
    risk: "Base64 មិនមែនជាការ Encryption ទេ! លេខសម្ងាត់ត្រូវផ្ញើគ្រប់ Request។",
    bestFor: "Internal Dashboards, Internal Webhooks",
    inspectorDesc: "ជា Base64 string (<code class=\"text-[var(--slate-accent)]\">username:password</code>)។ ពឹងផ្អែកទាំងស្រុងលើការ Encrypt របស់ HTTPS TLS Transport Socket។",
    matrix: {
      osi: "Layer 7",
      state: "Stateful",
      granularity: "User Level",
      phishing: "ទាប (Low)",
      risk: "ការលួចស្កេនទិន្នន័យ Plaintext បើគ្មាន TLS",
    },
  },
  {
    id: "session-cookies",
    num: "៤.",
    title: "Session Cookies & CSRF Tokens",
    sub: "Stateful Cookie • HttpOnly & SameSite",
    badge: "Browser First",
    group: "identification",
    accent: "teal",
    icon: Cookie,
    desc: "Server រក្សាទុក Session State ក្នុង Redis/DB ហើយផ្ញើ <code class=\"text-[var(--teal)]\">HttpOnly; Secure; SameSite=Strict</code> Cookie ទៅកាន់ Browser។ ប្រើប្រាស់អមដោយ Anti-CSRF header ដើម្បីការពារការវាយប្រហារ Cross-Site Request Forgery។",
    trust: "ការពារ Web Portal រៀបចំតាមបែបបុរាណ។ ដោត <code class=\"text-[var(--teal)]\">HttpOnly</code> ការពារ JavaScript XSS មិនឱ្យលួចអាន Cookie ឡើយ។",
    code: `Set-Cookie: sid=s%3A982a1...; HttpOnly; Secure; SameSite=Strict
X-CSRF-Token: d98f312a0f81...`,
    strength: "អាច Revoke/លុប Session ភ្លាមៗពី Server DB; JavaScript មិនអាចលួចអាន HttpOnly cookie បានឡើយ។",
    risk: "ត្រូវស្វែងរកមើល DB គ្រប់ Request (Stateful DB lookup); មានបញ្ហា CORS លើ Mobile Apps។",
    bestFor: "SSR Web Portals, Web Banking Dashboards",
    inspectorDesc: "Browser បញ្ជូន HttpOnly encrypted cookie ដោយស្វ័យប្រវត្តិ។ Server ផ្ទៀងផ្ទាត់ Session ID ជាមួយ Redis DB និងពិនិត្យ X-CSRF-Token header ដើម្បីទប់ស្កាត់ CSRF។",
    matrix: {
      osi: "Layer 7 HTTP",
      state: "Stateful Server DB",
      granularity: "User Session",
      phishing: "មធ្យម (CSRF Protected)",
      risk: "ការវាយប្រហារ Cross-site request forgery បើគ្មាន Token",
    },
  },
  {
    id: "bearer-tokens",
    num: "៥.",
    title: "Bearer Tokens",
    sub: "RFC 6750 • Possession-Based Access",
    badge: "Access Token",
    group: "delegation",
    accent: "teal",
    icon: Ticket,
    desc: "\"ផ្ដល់សិទ្ធិឱ្យអ្នកណាដែលកាន់ Token នេះ\"។ Server បង្កើត Token String ផ្ញើឱ្យ Client ហើយ Client ផ្ញើវានៅក្នុង Authorization Header ដើម្បីស្នើសុំទិន្នន័យ។",
    trust: "បំបែក Credential សម្ងាត់ (Password) ចេញពី API Resource Server។ API មិនចាំបាច់មើលឃើញ Password របស់អ្នកប្រើប្រាស់ឡើយ។",
    code: `POST /api/v1/orders HTTP/1.1
Authorization: Bearer v2.local.8a93b71c...`,
    strength: "Password មិនលេចធ្លាយទៅកាន់ 3rd party clients; ងាយស្រួលកំណត់ Scopes និងពេលវេលាផុតកំណត់ (TTL)។",
    risk: "ងាយរងគ្រោះបើ Token ត្រូវគេលួចបាន; ត្រូវតែរៀបចំការរក្សាទុក Token ឱ្យមានសុវត្ថិភាព។",
    bestFor: "Web Apps, Mobile APIs, OAuth output",
    inspectorDesc: "Access token string ផ្ដល់ដោយ Auth server ដើម្បីអនុញ្ញាតឱ្យចូលប្រើប្រាស់ API endpoints ដែលបានការពារ។",
    matrix: {
      osi: "Layer 7",
      state: "មានច្រើនប្រភេទ",
      granularity: "Scoped Token",
      phishing: "មធ្យម (Medium)",
      risk: "ការលួច Token / Replay Attack បើគ្មាន Encryption",
    },
  },
  {
    id: "jwt",
    num: "៦.",
    title: "JWT (JSON Web Token)",
    sub: "RFC 7519 • Self-Contained Claims",
    badge: "Stateless Assertion",
    group: "delegation",
    accent: "gold",
    icon: FileJson,
    desc: "បែងចែកជា ៣ ផ្នែក (<span class=\"text-[var(--danger)]\">Header</span>.<span class=\"text-[var(--gold)]\">Payload</span>.<span class=\"text-[var(--teal)]\">Signature</span>)។ អនុញ្ញាតឱ្យ Microservices ផ្ទៀងផ្ទាត់ Claims ដោយមិនបាច់សួរ DB (Stateless) ដោយប្រើ Public Key។",
    trust: "ការពារ Microservices ពីការកកស្ទះនៃការស្វែងរកក្នុង DB។ ផ្លាស់ប្តូរការផ្ទៀងផ្ទាត់មកជាការផ្ទៀងផ្ទាត់ Cryptographic Signature។",
    code: `Authorization: Bearer eyJhbG...eyJzdWI...SflKxw...`,
    strength: "មិនបាច់សួរ DB ដើម្បីផ្ទៀងផ្ទាត់ Token; ល្អឥតខ្ចោះសម្រាប់ Microservices Mesh។",
    risk: "ពិបាក Revoke/លុបចោលភ្លាមៗ; ទិន្នន័យក្នុង Payload គ្រាន់តែធ្វើ Base64 មិនមែន Encrypted ទេ!",
    bestFor: "Microservice meshes, Distributed Auth",
    inspectorDesc: "ជា Claims Assertion ដែលត្រូវបានចុះហត្ថលេខាជាមួយ RS256 Key pair។ ផ្ទៀងផ្ទាត់ statelessly ដោយ Microservices ដោយមិនបាច់សួរ DB។",
    matrix: {
      osi: "Layer 7",
      state: "Stateless",
      granularity: "Claims & Roles",
      phishing: "មធ្យម (Medium)",
      risk: "ការវាយប្រហារ Alg \"none\", ពិបាក Revoke ភ្លាមៗ",
    },
  },
  {
    id: "oauth2",
    num: "៧.",
    title: "OAuth 2.0",
    sub: "RFC 6749 • Delegated Scope Framework",
    badge: "Authorization",
    group: "delegation",
    accent: "slate",
    icon: GitFork,
    desc: "ជា <em>Authorization Framework</em> (មិនមែន Authentication ទេ!) ដែលអនុញ្ញាតឱ្យកម្មវិធីទីបី (3rd Party) ទទួលបានសិទ្ធិប្រើប្រាស់ Resource ដោយមិនចាំបាច់ស្គាល់ Password ដើម។",
    trust: "ការពារម្ចាស់ទិន្នន័យ មិនឱ្យប្រគល់ Password ទៅឱ្យកម្មវិធី 3rd Party។ កំណត់សិទ្ធិយ៉ាងលម្អិតតាមរយៈ <code class=\"text-[var(--slate-accent)]\">scopes</code>។",
    code: `POST /oauth/token HTTP/1.1
grant_type=authorization_code&code=SplxlOBe...`,
    strength: "កំណត់សិទ្ធិបានលម្អិត (Granular Scopes), មានសុវត្ថិភាពខ្ពស់, គាំទ្រ PKCE សម្រាប់ Mobile Apps។",
    risk: "ស្ថាបត្យកម្មមានភាពស្មុគស្មាញ; បើប្រើប្រាស់ច្រឡំជា Authentication នឹងបង្កើតចន្លោះប្រហោងសន្តិសុខ។",
    bestFor: "Third-party API ecosystems, Social Login Grants",
    inspectorDesc: "ការពារការលួចស្កាត់ Authorization code លើ Mobile & SPA apps ដោយប្រៀបធៀប dynamic challenge verifier (PKCE)។",
    matrix: {
      osi: "Layer 7 Framework",
      state: "Stateful Token DB",
      granularity: "Scoped Consent",
      phishing: "ខ្ពស់ (PKCE Flow)",
      risk: "ការលួចស្កាត់ Authorization code",
    },
  },
  {
    id: "oidc",
    num: "៨.",
    title: "OpenID Connect (OIDC)",
    sub: "Identity Layer លើ OAuth 2.0",
    badge: "Federated Identity",
    group: "delegation",
    accent: "slate",
    icon: BadgeCheck,
    desc: "បន្ថែម <strong>ID Token</strong> (JWT) ទៅលើ OAuth 2.0 ដើម្បីធ្វើ <em>Authentication</em> (ផ្ទៀងផ្ទាត់អត្តសញ្ញាណ)។ ផ្ដល់ព័ត៌មានអត្តសញ្ញាណស្តង់ដារ (<code class=\"text-[var(--slate-accent)]\">sub, email, name</code>)។",
    trust: "បង្កើតដែនកំណត់ Single Sign-On (SSO) រវាង Identity Providers (Okta, Auth0, Keycloak) និង Client Applications។",
    code: `{ "id_token": "eyJhbG...", "access_token": "v2.local..." }`,
    strength: "អត្តសញ្ញាណស្តង់ដាររួមសម្រាប់ Enterprise Apps, មាន Discovery Endpoint (<code class=\"text-[var(--slate-accent)]\">/.well-known</code>)។",
    risk: "ID tokens ត្រូវតែផ្ទៀងផ្ទាត់យ៉ាងម៉ឺងម៉ាត់ជាមួយ Audience ដែលបានរំពឹងទុក។",
    bestFor: "Enterprise Single Sign-On (SSO)",
    inspectorDesc: "បង្កើតស្តង់ដារផ្ទៀងផ្ទាត់អត្តសញ្ញាណ ដោយផ្ញើត្រឡប់មកវិញនូវ ID Token ដែលមានប្រវត្តិរូបអ្នកប្រើប្រាស់។",
    matrix: {
      osi: "Layer 7 Protocol",
      state: "Stateless / Federated",
      granularity: "User Identity Claims",
      phishing: "ខ្ពស់ (High)",
      risk: "ការប្រើប្រាស់ ID Token ច្រឡំជាមួយ Access Token",
    },
  },
  {
    id: "saml",
    num: "៩.",
    title: "SAML 2.0",
    sub: "XML Security Standard • B2B Enterprise",
    badge: "Enterprise Legacy",
    group: "delegation",
    accent: "slate",
    icon: Building2,
    desc: "ប្រើប្រាស់ Signed XML Assertions ផ្លាស់ប្តូរគ្នាតាមរយៈ HTTP POST Redirects រវាង Identity Provider (IdP) និង Service Provider (SP)។ ចាំបាច់សម្រាប់ប្រព័ន្ធ Enterprise IT។",
    trust: "ការពារដែនកំណត់ក្រមក្រុមហ៊ុនធំៗ (Active Directory / LDAP Federation) តាមរយៈ XML Digital Signatures។",
    code: `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">
  <saml:Assertion ID="_a98213...">...</saml:Assertion>
</samlp:Response>`,
    strength: "គាំទ្រយ៉ាងទូលំទូលាយលើប្រព័ន្ធ IT Enterprise ធំៗ និង Active Directory។",
    risk: "ទំហំ XML ធំខ្លាំង, ការគ្រប់គ្រង Certificate ស្មុគស្មាញ, ពិបាក Parse លើ Mobile Apps។",
    bestFor: "Enterprise B2B SaaS, Government IT Systems",
    inspectorDesc: "ប្រើប្រាស់ XML tokens ផ្លាស់ប្តូរគ្នារវាង enterprise Identity Providers (Active Directory, Okta) និង Service Providers។",
    matrix: {
      osi: "Layer 7 Protocol",
      state: "Federated XML",
      granularity: "Enterprise User",
      phishing: "ខ្ពស់ (High)",
      risk: "ការវាយប្រហារ XML signature wrapping",
    },
  },
  {
    id: "hmac",
    num: "១០.",
    title: "HMAC Signatures",
    sub: "RFC 2104 • Hash Message Auth",
    badge: "Integrity + Non-Replay",
    group: "cryptographic",
    accent: "success",
    icon: Binary,
    desc: "Client ចុះហត្ថលេខាលើ Method, URI, Timestamp, និង Body ដោយប្រើប្រាស់ Shared Secret Hash (<code class=\"text-[var(--success)]\">HMAC-SHA256</code>)។ Server គណនា Hash ឡើងវិញដើម្បីផ្ទៀងផ្ទាត់ភាពត្រឹមត្រូវនៃទិន្នន័យ។",
    trust: "ការពារទិន្នន័យកំពុងធ្វើដំណើរ (Data-in-Transit) ពីការកែបន្លំ (Tampering) និងការវាយប្រហារ Replay Attacks។",
    code: `X-Signature: t=1720000000,v1=9f8a32b1c4e7...`,
    strength: "ធានាថាទិន្នន័យមិនត្រូវគេកែបន្លំ; ការពារ Replay Attack តាមរយៈការពិនិត្យ Timestamp។",
    risk: "ត្រូវការម៉ោង (Clock Synchronize) ត្រឹមត្រូវរវាង Client និង Server។",
    bestFor: "Payment Webhooks (Stripe/GitHub), Financial APIs",
    inspectorDesc: "គណនា <code class=\"text-[var(--success)]\">HMAC-SHA256(Secret, Timestamp + Body)</code> ឡើងវិញដើម្បីធានាថា Payload មិនត្រូវគេកែបន្លំ និងទប់ស្កាត់ Replay attack។",
    matrix: {
      osi: "Layer 7 Integrity",
      state: "Stateless Crypto",
      granularity: "Per Request Payload",
      phishing: "ខ្ពស់ (High)",
      risk: "លឿនយឺតនៃម៉ោង (Clock drift), Shared secret ខ្សោយ",
    },
  },
  {
    id: "mtls",
    num: "១១.",
    title: "Mutual TLS (mTLS)",
    sub: "Layer 4/5 • Cryptographic Handshake",
    badge: "Zero-Trust Hardware",
    group: "cryptographic",
    accent: "danger",
    icon: ShieldCheck,
    desc: "ទាំង Client និង Server ផ្ទៀងផ្ទាត់ X.509 Digital Certificate របស់គ្នាទៅវិញទៅមក ក្នុងអំឡុងពេល TLS Handshake <em>មុនពេលទិន្នន័យ HTTP ត្រូវបានផ្ញើ</em>។",
    trust: "ការពារ Layer បណ្តាញចរាចរណ៍ (Network Transport)។ Request ដែលគ្មានការផ្ទៀងផ្ទាត់ ត្រូវផ្លាច់ចោលនៅត្រឹម Socket Level!",
    code: `ClientCert: CN=payment-service.prod.internal
Status: 200 TLS_AES_256_GCM_SHA384 Established`,
    strength: "កម្រិតសន្តិសុខខ្ពស់បំផុត; ការពារការជ្រុះលេចធ្លាយ Credential នៅកម្រិត Application Layer។",
    risk: "ស្មុគស្មាញក្នុងការគ្រប់គ្រង និងផ្លាស់ប្តូរ Certificate (PKI Certificate rotation)។",
    bestFor: "Banking Mesh, Kubernetes Pod-to-Pod Communications",
    inspectorDesc: "ទាំង Client និង Server ផ្លាស់ប្តូរ Digital X.509 Certificates មុនពេលបញ្ជូនទិន្នន័យ HTTP Application Payload។",
    matrix: {
      osi: "Layer 4/5 Transport",
      state: "Stateless Handshake",
      granularity: "Device / Server Node",
      phishing: "ខ្ពស់បំផុត (Very High)",
      risk: "ការជ្រុះលេចធ្លាយ Private key លើ Server host",
    },
  },
  {
    id: "risk-based",
    num: "១២.",
    title: "Risk-Based Adaptive MFA",
    sub: "AI / Behavioral • Context & Geofencing",
    badge: "Zero-Trust AI",
    group: "biometric",
    accent: "gold",
    icon: Activity,
    desc: "វិភាគសញ្ញាជុំវិញ real time (IP, Geolocation, Device Fingerprint, ល្បឿនធ្វើដំណើរមិនសមហេតុផល) ដើម្បីទាមទារ Step-Up Biometrics នៅពេលកម្រិតហានិភ័យកើនឡើង។",
    trust: "ការពារការលួច Session និងការវាយប្រហារ Credential Stuffing ដោយគណនា Trust Score ឡើងវិញគ្រប់ Request។",
    code: `RiskScore: 0.82 (High - Unknown IP)
Action: Step-Up Prompt WebAuthn Biometric Required`,
    strength: "គ្មានការរំខានសម្រាប់អ្នកប្រើប្រាស់ធម្មតា; ទប់ស្កាត់ Session ដែលត្រូវបានគេលួចភ្លាមៗ។",
    risk: "អាចមាន False Positive ទាមទារឱ្យផ្ទៀងផ្ទាត់ពេលអ្នកប្រើប្រាស់ធ្វើដំណើរ។",
    bestFor: "Fintech, Crypto Exchanges, High Security Apps",
    inspectorDesc: "គណនាកម្រិតហានិភ័យ real-time និងទាមទារឱ្យធ្វើ Step-up biometric authentication ភ្លាមៗបើឃើញភាពមិនប្រក្រតី។",
    matrix: {
      osi: "Layer 7 Behavioral",
      state: "Dynamic Real-time",
      granularity: "Risk Context Score",
      phishing: "១០០% Adaptive",
      risk: "False Step-Up Prompts ពេលធ្វើដំណើរ",
    },
  },
];

type TopoId = "biometric" | "selfie" | "client" | "gateway" | "microservices";

interface TopoNode {
  id: TopoId;
  icon: LucideIcon;
  accent: Accent;
  title: string;
  sub: string;
  boundary: string;
  info: React.ReactNode;
}

const TOPO_NODES: TopoNode[] = [
  {
    id: "biometric",
    icon: ScanFace,
    accent: "gold",
    title: "បន្ទះឈីប Hardware សុវត្ថិភាព",
    sub: "Face ID, ស្នាមម្រាមដៃ, ស្កេនប្រស្រីភ្នែក, TPM",
    boundary: "Hardware ជីវមាត្រ",
    info: (
      <>
        <strong>ដែនកំណត់បន្ទះឈីប Hardware សុវត្ថិភាព៖</strong> ការផ្ទៀងផ្ទាត់ជីវមាត្រ (Face ID, ស្នាមម្រាមដៃ, ស្កេនប្រស្រីភ្នែក) ប្រើប្រាស់ <strong>Passkeys / WebAuthn</strong>។ រូបភាពជីវមាត្រមិនត្រូវបានផ្ញើទៅ server ឡើយ វាផ្ទៀងផ្ទាត់នៅក្នុងបន្ទះឈីប TPM នៃទូរស័ព្ទ! Server ទទួលបានតែ Digital Signature បញ្ជាក់ប៉ុណ្ណោះ។
      </>
    ),
  },
  {
    id: "selfie",
    icon: Camera,
    accent: "danger",
    title: "Meta & Google AI Selfie Vault",
    sub: "Video Liveness, 3D Mesh, eKYC",
    boundary: "AI Identity Vault",
    info: (
      <>
        <strong>ដែនកំណត់ Meta & Google AI Selfie Vault៖</strong> ប្រើប្រាស់សម្រាប់ការស្ដារគណនី (Account Recovery) និង eKYC (NIST IAL2)។ វិភាគការផ្លាស់ប្តូរចលនាទម្រង់មុខ real-time (Liveness detection) និងបង្កើត 512-d facial embeddings ដើម្បីផ្ទៀងផ្ទាត់។
      </>
    ),
  },
  {
    id: "client",
    icon: Smartphone,
    accent: "slate",
    title: "កម្មវិធីអ្នកប្រើប្រាស់ (Public App)",
    sub: "SPA, Mobile App, IoT, Web Browser",
    boundary: "Untrusted Public",
    info: (
      <>
        <strong>ដែនកំណត់កម្មវិធីអ្នកប្រើប្រាស់ (Untrusted Client)៖</strong> ប្រតិបត្តិការលើឧបករណ៍ទូរស័ព្ទ ឬ Browser។ ប្រើប្រាស់ <strong>OAuth 2.0 ជាមួយ PKCE</strong>, <strong>OIDC</strong>, ឬ <strong>Session Cookies</strong> ជាមួយ CSRF Protection។
      </>
    ),
  },
  {
    id: "gateway",
    icon: Network,
    accent: "teal",
    title: "API Gateway / ច្រកទ្វារប្រព័ន្ធ",
    sub: "Reverse Proxy, WAF, Cloudflare",
    boundary: "Edge Perimeter",
    info: (
      <>
        <strong>ដែនកំណត់ច្រកទ្វារ API Gateway៖</strong> ទទួលចរាចរណ៍ពីខាងក្រៅ។ ប្រើប្រាស់ <strong>API Keys</strong> (សម្រាប់កំណត់ quota/billing), <strong>HMAC Signatures</strong> (សម្រាប់ webhook), និងផ្ទៀងផ្ទាត់ <strong>JWT / Bearer Tokens</strong>។
      </>
    ),
  },
  {
    id: "microservices",
    icon: Cpu,
    accent: "slate",
    title: "បណ្តាញ Service Mesh ខាងក្នុង",
    sub: "Microservices, DBs, Message Queues",
    boundary: "Zero-Trust Mesh",
    info: (
      <>
        <strong>ដែនកំណត់បណ្តាញ Microservices ខាងក្នុង៖</strong> ប្រើប្រាស់ <strong>Mutual TLS (mTLS)</strong> សម្រាប់ encrypt ទិន្នន័យរវាង server និង server នៅកម្រិត socket hardware និងប្រើប្រាស់ <strong>JWT</strong> ដើម្បីបញ្ជូន identity របស់អ្នកប្រើប្រាស់។
      </>
    ),
  },
];

const FILTERS: { key: MethodGroup | "all"; labelKm: string }[] = [
  { key: "all", labelKm: "ទាំងអស់ (១៣)" },
  { key: "biometric", labelKm: "ជីវមាត្រ & Passkeys" },
  { key: "selfie", labelKm: "Meta & Google AI Selfie" },
  { key: "identification", labelKm: "API & Web Sessions" },
  { key: "delegation", labelKm: "Delegated & Enterprise SSO" },
  { key: "cryptographic", labelKm: "Crypto, HMAC & mTLS" },
];

const WIZARD_CALLERS = [
  { value: "selfie-recovery", label: "ការស្ដារគណនីឡើងវិញ / eKYC អ្នកប្រើប្រាស់ដែលគ្មាន Passkey ឧបករណ៍" },
  { value: "biometric-user", label: "អ្នកប្រើប្រាស់ Mobile App ឬ Banking App ដែលមាន Hardware ស្កេនជីវមាត្រ" },
  { value: "b2b", label: "ប្រព័ន្ធដៃគូខាងក្រៅ / B2B Developer (Server-to-Server)" },
  { value: "spa", label: "Frontend SPA (React/Vue) ឬ Mobile Web App" },
  { value: "microservice", label: "Microservice ខាងក្នុងបណ្តាញ Kubernetes Cluster" },
  { value: "webhook", label: "ប្រព័ន្ធ Webhook ខាងក្រៅ (ឧទាហរណ៍៖ Stripe, GitHub)" },
  { value: "enterprise", label: "ប្រព័ន្ធ Enterprise ក្រុមហ៊ុន (Active Directory / Okta SSO)" },
];

const WIZARD_REQUIREMENTS = [
  { value: "selfie-proofing", label: "ផ្ទៀងផ្ទាត់អត្តសញ្ញាណកម្រិតខ្ពស់ និងទប់ស្កាត់ Deepfake Anti-Spoofing (NIST IAL2)" },
  { value: "phishing-proof", label: "ការផ្ទៀងផ្ទាត់មិនប្រើ Password ការពារ Phishing ១០០% (Face ID/Fingerprint)" },
  { value: "identification", label: "កំណត់ Rate Limit និងតាមដានការប្រើប្រាស់ (Billing Usage)" },
  { value: "stateless", label: "មិនបាច់សួរ DB នាំឱ្យកកស្ទះ (Stateless High Performance)" },
  { value: "integrity", label: "ធានាថាទិន្នន័យ Payload មិនត្រូវគេកែបន្លំ និងការពារ Replay Attack" },
  { value: "zero-trust", label: "ការ Encrypt សន្តិសុខ Zero-Trust នៅកម្រិត Socket Hardware" },
];

const SURPRISES = [
  {
    icon: Camera,
    accent: "danger" as Accent,
    quote: "\"Meta & Google AI Selfie តម្រូវឱ្យមានចលនាក្បាលពិតប្រាកដ\"",
    preview: "ហេតុអ្វីបានជារូបថត ២D ធម្មតាមិនអាចឆ្លងផុត eKYC ទំនើបបាន។",
    body: (
      <>
        <strong>ចំណុចសំខាន់៖</strong> ជនខិលខូចប្រើប្រាស់រូបថតច្បាស់ ឬវីដេអូ Deepfake ដើម្បីបោកប្រាស់។ Meta និង Google តម្រូវឱ្យមានការងាកក្បាលពិតប្រាកដ (Pitch/Yaw/Blink) ដើម្បីវិភាគចលនាមុខរស់រវើក មុននឹងអនុញ្ញាតឱ្យស្ដារគណនី!
      </>
    ),
  },
  {
    icon: Fingerprint,
    accent: "gold" as Accent,
    quote: "\"Server មិនដែលទទួលបានរូបថត Face ID របស់អ្នកឡើយ\"",
    preview: "ហេតុអ្វីបានជា Face ID, Fingerprint, Iris អាចការពារ Phishing បាន ១០០%។",
    body: (
      <>
        <strong>ចំណុចសំខាន់៖</strong> អ្នកអភិវឌ្ឍន៍ថ្មីៗគិតថា Server ទទួលបានរូបថតមុខ។ តាមពិត Face ID / Fingerprint គ្រាន់តែធ្វើការ Unlock បន្ទះឈីប <em>Secure Enclave TPM</em> ក្នុងទូរស័ព្ទ ដើម្បីចុះហត្ថលេខាឌីជីថល (Private Key Signature) ប៉ុណ្ណោះ។ ទិន្នន័យជីវមាត្រមិនដែលឆ្លងកាត់បណ្តាញឡើយ!
      </>
    ),
  },
  {
    icon: GitFork,
    accent: "slate" as Accent,
    quote: "\"OAuth 2.0 មិនមែនជា Authentication ទេ\"",
    preview: "ហេតុអ្វីបានជាការប្រើ Access Token ដោយផ្ទាល់ជាអត្តសញ្ញាណ នាំឱ្យមានការលួចគណនី។",
    body: (
      <>
        <strong>ចំណុចសំខាន់៖</strong> OAuth 2.0 គឺជា <em>Authorization Framework</em> (&quot;តើកម្មវិធីនេះមានសិទ្ធិមើល Contacts ដែរឬទេ?&quot;)។ វាមិនបានបញ្ជាក់ថានរណាជាអ្នកប្រើប្រាស់នោះទេ។ ការប្រើ Access Token ជាអត្តសញ្ញាណដោយគ្មាន OpenID Connect (OIDC) ធ្វើឱ្យប្រព័ន្ធរងគ្រោះដោយ Confused Deputy Attacks។
      </>
    ),
  },
  {
    icon: Lock,
    accent: "danger" as Accent,
    quote: "\"Base64 គ្រាន់តែជា Encoding មិនមែន Encryption ទេ\"",
    preview: "ហេតុអ្វីបានជា Basic Auth លើ HTTP ផ្ញើលេខសម្ងាត់ជា Plaintext។",
    body: (
      <>
        <strong>ចំណុចសំខាន់៖</strong> Base64 Encoding ចំណាយពេលតែ ១ មិល្លីវិនាទីប៉ុណ្ណោះដើម្បី Decode ត្រឡប់មកជា <code className="text-[var(--ink)]">admin:password</code>។ Basic Auth ពឹងផ្អែកទាំងស្រុងលើការ Encrypt របស់ HTTPS TLS Transport។
      </>
    ),
  },
];

interface SimScores {
  liveness: number;
  mesh: number;
  spoof: number;
}

function SectionCard({
  icon: Icon,
  accent,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  accent: Accent;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const a = ACCENTS[accent];
  return (
    <section className="space-y-5">
      <div className="flex items-start gap-4">
        <div className={`rounded-xl ${a.bg10} ${a.text} p-3`}>
          <Icon size={26} />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold text-[var(--ink)]">{title}</h2>
          <p className="mt-0.5 text-sm text-[var(--ink-dim)]">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-md bg-[#14161c] p-3 font-mono-ui text-xs leading-relaxed text-[#e9e9e7]">
      {code}
    </pre>
  );
}

export default function AuthArchitectureLab() {
  const { text: t } = useLanguage();

  const [topoNode, setTopoNode] = useState<TopoId>("biometric");
  const [filter, setFilter] = useState<MethodGroup | "all">("all");
  const [inspKey, setInspKey] = useState("selfie-ekyc");
  const [openSurprise, setOpenSurprise] = useState<number | null>(null);

  // Wizard
  const [caller, setCaller] = useState("biometric-user");
  const [requirement, setRequirement] = useState("phishing-proof");
  const [wizard, setWizard] = useState<{ title: string; desc: string } | null>(null);

  // Simulator
  const [simRunning, setSimRunning] = useState(false);
  const [simDone, setSimDone] = useState(false);
  const [simEngine, setSimEngine] = useState(t("Engine idle — ready to scan", "ប្រព័ន្ធរង់ចាំ • ត្រៀមស្កេន"));
  const [simPrompt, setSimPrompt] = useState(t("Press start to begin the AI liveness check", "ចុច \"ចាប់ផ្តើមសាកល្បង AI Liveness\" ដើម្បីចាប់ផ្តើម"));
  const [simScores, setSimScores] = useState<SimScores>({ liveness: 0, mesh: 0, spoof: 0 });
  const [simLog, setSimLog] = useState<string[]>([
    "[SYSTEM] Meta/Google eKYC Pipeline Loaded.",
    "[SYSTEM] កំពុងរង់ចាំការចុចចាប់ផ្តើម...",
  ]);
  const simTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const timers = simTimers.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const selectedTopo = TOPO_NODES.find((n) => n.id === topoNode)!;
  const selectedMethod = METHODS.find((m) => m.id === inspKey)!;
  const visibleMethods = filter === "all" ? METHODS : METHODS.filter((m) => m.group === filter);

  function runSimulation() {
    simTimers.current.forEach(clearTimeout);
    simTimers.current = [];
    setSimRunning(true);
    setSimDone(false);
    setSimScores({ liveness: 0, mesh: 0, spoof: 0 });
    setSimLog(["[SYSTEM] កំពុងរៀបចំ Meta/Google Video Stream Pipeline..."]);
    setSimEngine(t("Step 1/3: Motion liveness check", "ជំហាន ១/៣៖ ពិនិត្យចលនាផ្ទៃមុខរស់រវើក (Motion Liveness Check)"));
    setSimPrompt(t("Turn your head slowly left and right", "👉 សកម្មភាព៖ សូមងាកក្បាលសន្សឹមៗទៅឆ្វេង និងស្ដាំ"));

    simTimers.current.push(
      setTimeout(() => {
        setSimLog((log) => [...log, "[AI MODEL] រកឃើញចលនាអុបទិក (Optic Flow Detected)។ Yaw: +24.2 deg."]);
        setSimScores((s) => ({ ...s, liveness: 99.8 }));
        setSimPrompt(t("Blink twice", "👉 សកម្មភាព៖ សូមបិទបើកភ្នែក ២ ដង"));
      }, 1500),
    );
    simTimers.current.push(
      setTimeout(() => {
        setSimLog((log) => [...log, "[AI MODEL] ការបិទបើកភ្នែកត្រឹមត្រូវ។ កំពុងទាញយក 3D Mesh (468 landmarks)..."]);
        setSimEngine(t("Step 2/3: 3D surface landmark mapping", "ជំហាន ២/៣៖ ការវាស់ទម្រង់ផ្ទៃមុខ 3D Surface Landmark Mapping"));
        setSimScores((s) => ({ ...s, mesh: 98.5 }));
        setSimPrompt(t("Stay still for surface-light analysis", "👉 សកម្មភាព៖ សូមនៅស្ងៀមដើម្បីវិភាគចំណាំងផ្លាតពន្លឺផ្ទៃមុខ"));
      }, 3000),
    );
    simTimers.current.push(
      setTimeout(() => {
        setSimLog((log) => [...log, "[AI MODEL] ឆ្លងផុតការពិនិត្យ Anti-Spoofing (មិនមែនជារូបថត ឬអេក្រង់ ២D)។"]);
        setSimEngine(t("Step 3/3: Vector embedding comparison", "ជំហាន ៣/៣៖ ប្រៀបធៀប Vector Embedding ជាមួយ Identity Vault"));
        setSimScores((s) => ({ ...s, spoof: 99.2 }));
        setSimPrompt(t("Building a 512-d face vector assertion…", "✨ កំពុងបង្កើត 512-d Face Vector Assertion..."));
      }, 4500),
    );
    simTimers.current.push(
      setTimeout(() => {
        setSimDone(true);
        setSimRunning(false);
        setSimEngine(t("STATUS 200: NIST IAL2 Verification Success", "STATUS 200: NIST IAL2 Verification Success"));
        setSimPrompt(t("Identity verified in the Meta & Google Identity Vault!", "✅ អត្តសញ្ញាណត្រូវបានផ្ទៀងផ្ទាត់ជោគជ័យក្នុង Meta & Google Identity Vault!"));
        setSimLog((log) => [...log, "[SUCCESS] កម្រិតប្រៀបធៀបត្រូវគ្នា (Match Score): 0.994។ អនុញ្ញាតឱ្យស្ដារគណនី!"]);
      }, 6000),
    );
  }

  function evaluateWizard() {
    let title = "Passkeys (WebAuthn) + Short-lived JWT";
    let desc =
      "ស្តង់ដារមាសសម្រាប់កម្មវិធីធនាគារ និង Mobile Apps ទំនើប។ ប្រើប្រាស់ Hardware ស្កេនជីវមាត្រ (Face ID / Fingerprint / Iris) ដើម្បីផ្ទៀងផ្ទាត់ដោយមិនបាច់ប្រើ Password អមជាមួយ Short-lived JWTs សម្រាប់ Microservices។";
    if (caller === "selfie-recovery" || requirement === "selfie-proofing") {
      title = "Meta & Google AI Selfie Video Liveness Proofing (NIST IAL2)";
      desc =
        "ចាំបាច់នៅពេលអ្នកប្រើប្រាស់បាត់បង់ឧបករណ៍ Hardware ឬ Passkey។ តម្រូវឱ្យមានការស្កេនវីដេអូ Liveness real-time (ងាកក្បាល/បិទបើកភ្នែក) និងប្រៀបធៀប 512-d Facial Vector ជាមួយ Identity Vault។";
    } else if (caller === "b2b" && requirement === "identification") {
      title = "API Keys (Project Level Metering)";
      desc =
        "សមស្របបំផុតសម្រាប់ B2B Developer Portals (ដូចជា Stripe, Twilio)។ ផ្ដល់ Key វែងសម្រាប់កំណត់ Rate limit និងតាមដានការប្រើប្រាស់ (Billing)។";
    } else if (caller === "webhook" || requirement === "integrity") {
      title = "HMAC SHA-256 Signatures";
      desc =
        "ចាំបាច់សម្រាប់ Webhooks និងការបញ្ជូនប្រតិបត្តិការហិរញ្ញវត្ថុ។ Client ចុះហត្ថលេខាលើ Payload timestamp និង body ដោយប្រើ Secret Key ដើម្បីធានាថាទិន្នន័យមិនត្រូវគេកែបន្លំ។";
    } else if (caller === "microservice" || requirement === "zero-trust") {
      title = "Mutual TLS (mTLS) Service Mesh";
      desc =
        "ស្តង់ដារមាសសម្រាប់បណ្តាញ Zero-Trust ខាងក្នុង Kubernetes Cluster (Istio / Linkerd)។ ផ្ទៀងផ្ទាត់ X.509 Certificate របស់ Client នៅត្រឹម Socket Level មុនពេលកូដដំណើរការ។";
    } else if (caller === "enterprise") {
      title = "SAML 2.0 / OpenID Connect Enterprise Federation";
      desc =
        "ប្រគល់សិទ្ធិផ្ទៀងផ្ទាត់ទៅឱ្យប្រព័ន្ធ Enterprise Identity Provider ធំៗ (Okta, Azure Active Directory, Keycloak) សម្រាប់ SSO។";
    }
    setWizard({ title, desc });
  }

  return (
    <ToolShell
      title="Auth Architecture Lab"
      description="Interactive guide comparing 13 authentication and identity mechanisms — passkeys, biometrics, Meta/Google AI selfie liveness, API keys, JWT, OAuth 2.0, OIDC, SAML, HMAC, and mTLS — with a trust-boundary map, live request inspector, comparison matrix, and architecture decision wizard."
    >
      {/* Intro */}
      <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-[var(--gold)]/10 p-2.5 text-[var(--gold)]">
            <Shield size={22} />
          </div>
          <p className="text-sm leading-relaxed text-[var(--ink-dim)]">
            យន្តការផ្ទៀងផ្ទាត់នីមួយៗការពារ <strong className="text-[var(--gold)]">ដែនកំណត់ទំនុកចិត្ត (Trust Boundary)</strong> ផ្សេងៗគ្នា — ចាប់ពីឧបករណ៍ Hardware ស្កេនជីវមាត្រ (Face ID, Fingerprint, Iris) រហូតដល់ប្រព័ន្ធ AI Selfie Liveness របស់ Meta & Google។ ស្វែងយល់ពីយន្តការទាំង ១៣ ដើម្បីសាងសង់ប្រព័ន្ធប្រកបដោយសុវត្ថិភាពខ្ពស់។
          </p>
        </div>
      </div>

      {/* 1. Trust boundaries */}
      <SectionCard
        icon={Layers}
        accent="slate"
        title={t("Trust Boundary Map", "១. ផែនទីដែនកំណត់ទំនុកចិត្ត (Trust Boundaries)")}
        subtitle={t("Where does trust start and end? Click a system to see the protocols that protect it.", "តើទំនុកចិត្តចាប់ផ្តើម និងបញ្ចប់នៅត្រង់ណា? ចុចលើផ្នែកស្ថាបត្យកម្ម ដើម្បីមើលពិធីសារដែលការពារផ្នែកនោះ។")}
      >
        <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {TOPO_NODES.map((node) => {
              const a = ACCENTS[node.accent];
              const active = topoNode === node.id;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setTopoNode(node.id)}
                  className={`rounded-xl border p-3.5 text-center transition ${
                    active
                      ? `border-[var(--gold)] bg-[var(--ground-raised-hi)] ring-1 ring-[var(--gold-dim)]`
                      : `border-[var(--ground-line)] bg-[var(--ground)] hover:border-[var(--gold-dim)]`
                  }`}
                >
                  <div className={`mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-lg ${a.bg10} ${a.text}`}>
                    <node.icon size={20} />
                  </div>
                  <div className="text-xs font-semibold text-[var(--ink)]">{node.title}</div>
                  <div className="mt-1 text-[10px] text-[var(--ink-faint)]">{node.sub}</div>
                  <div className={`mt-2.5 border-t border-[var(--ground-line)] pt-2 font-mono-ui text-[10px] font-medium ${a.text}`}>
                    {node.boundary}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-4 rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-3.5 text-xs leading-relaxed text-[var(--ink-dim)]">
            {selectedTopo.info}
          </div>
        </div>
      </SectionCard>

      {/* 2. Methods */}
      <SectionCard
        icon={BookOpen}
        accent="gold"
        title={t("All 13 Mechanisms", "២. យន្តការផ្ទៀងផ្ទាត់ទាំង ១៣")}
        subtitle={t("Deep dive into every protocol with its trust boundary, wire example, strengths, and risks.", "ព័ត៌មានលម្អិត បច្ចេកវិទ្យាជីវមាត្រ បច្ចេកវិទ្យា AI Selfie របស់ Meta & Google និងហានិភ័យសន្តិសុខ។")}
      >
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                filter === f.key
                  ? "border-[var(--gold)] bg-[var(--gold)] text-[#0a0c0d]"
                  : "border-[var(--ground-line)] bg-[var(--ground-raised)] text-[var(--ink-dim)] hover:text-[var(--ink)]"
              }`}
            >
              {f.labelKm}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {visibleMethods.map((m) => {
            const a = ACCENTS[m.accent];
            const Icon = m.icon;
            return (
              <article key={m.id} className={`flex flex-col rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 ${m.id === "selfie-ekyc" ? "lg:col-span-2" : ""}`}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl ${a.bg10} ${a.text} p-2.5`}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-semibold text-[var(--ink)]">
                        {m.num} {m.title}
                      </h3>
                      <span className="font-mono-ui text-[11px] text-[var(--ink-faint)]">{m.sub}</span>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 font-mono-ui text-[10px] ${a.border} ${a.text}`}>{m.badge}</span>
                </div>

                <p className="mb-3 text-xs leading-relaxed text-[var(--ink-dim)]" dangerouslySetInnerHTML={{ __html: m.desc }} />

                <div className={`mb-3 rounded-lg border p-3 text-xs ${a.border} bg-[var(--ground)]`}>
                  <div className={`mb-1 flex items-center gap-1.5 font-semibold ${a.text}`}>
                    <ShieldCheck size={13} />
                    {t("Trust boundary protected", "ដែនកំណត់ទំនុកចិត្តដែលត្រូវបានការពារ")}
                  </div>
                  <div className="text-[var(--ink-dim)]">{m.trust}</div>
                </div>

                <CodeBlock code={m.code} />

                <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[var(--success)]" />
                    <span className="text-[var(--ink-dim)]">
                      <strong className="text-[var(--ink)]">{t("Strengths:", "ចំណុចខ្លាំង៖")}</strong> {m.strength}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <XCircle size={14} className="mt-0.5 shrink-0 text-[var(--danger)]" />
                    <span className="text-[var(--ink-dim)]">
                      <strong className="text-[var(--ink)]">{t("Risks:", "ហានិភ័យ/ចំណុចកត់សម្គាល់៖")}</strong> {m.risk}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--ground-line)] pt-3 text-[11px]">
                  <span className="text-[var(--ink-faint)]">
                    {t("Best for:", "សមស្របបំផុតសម្រាប់៖")} <span className="font-medium text-[var(--ink-dim)]">{m.bestFor}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setInspKey(m.id);
                      document.getElementById("inspector-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className={`flex items-center gap-1 font-medium ${a.text} hover:underline`}
                  >
                    {t("View wire code", "មើលកូដ Request")} <ChevronRight size={13} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </SectionCard>

      {/* 3. Simulator */}
      <SectionCard
        icon={Camera}
        accent="danger"
        title={t("AI Selfie & Liveness Simulator", "កម្មវិធីក្លែងធ្វើ AI Selfie & Video Liveness (Meta & Google)")}
        subtitle={t("Watch how Meta and Google verify 3D video liveness during account recovery.", "សាកល្បងមើលថាតើប្រព័ន្ធ AI របស់ Meta (Facebook) និង Google ផ្ទៀងផ្ទាត់ Video Selfie 3D Liveness យ៉ាងដូចម្តេច ក្នុងអំឡុងពេល Account Recovery។")}
      >
        <div className="grid grid-cols-1 items-center gap-5 rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5 lg:grid-cols-2">
          <div className="flex min-h-[280px] flex-col items-center justify-center overflow-hidden rounded-xl border border-[var(--ground-line)] bg-[var(--ground)] p-4">
            <div
              className={`relative flex h-52 w-44 flex-col items-center justify-center rounded-[50%] border-2 border-dashed transition-colors duration-500 ${
                simDone ? "border-[var(--success)] bg-[var(--success)]/10" : simRunning ? "border-[var(--danger)] bg-[var(--danger)]/10" : "border-[var(--ground-line)]"
              }`}
            >
              {simRunning && (
                <>
                  <span className="absolute left-6 top-9 h-2 w-2 animate-ping rounded-full bg-[var(--danger)]" />
                  <span className="absolute right-6 top-9 h-2 w-2 animate-ping rounded-full bg-[var(--danger)]" />
                  <span className="absolute left-1/2 top-16 h-2 w-2 -translate-x-1/2 animate-pulse rounded-full bg-[var(--teal)]" />
                  <span className="absolute bottom-10 left-1/2 h-1 w-10 -translate-x-1/2 animate-pulse rounded-full bg-[var(--gold)]" />
                </>
              )}
              <div className="text-center">
                <ScanFace size={40} className={`mx-auto mb-2 ${simDone ? "text-[var(--success)]" : "text-[var(--danger)]/80"}`} />
                <span className={`block font-mono-ui text-[10px] uppercase tracking-widest ${simDone ? "text-[var(--success)]" : "text-[var(--ink-faint)]"}`}>
                  {simDone ? t("Verified!", "ផ្ទៀងផ្ទាត់ជោគជ័យ!") : t("Place face in the oval", "ដាក់ផ្ទៃមុខក្នុងរង្វង់")}
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 font-mono-ui text-xs text-[var(--ink-dim)]">
              <span className={`h-2 w-2 rounded-full ${simRunning ? "animate-pulse bg-[var(--gold)]" : simDone ? "bg-[var(--success)]" : "bg-[var(--ground-line)]"}`} />
              {simPrompt}
            </div>
          </div>

          <div className="space-y-4">
            <div className="border-b border-[var(--ground-line)] pb-3">
              <div className="font-mono-ui text-[10px] uppercase tracking-wider text-[var(--danger)]">{t("AI biometric analytics engine", "ប្រព័ន្ធ AI Biometric Analytics (Meta & Google Engine)")}</div>
              <div className={`mt-0.5 text-sm font-semibold ${simDone ? "text-[var(--success)]" : "text-[var(--ink)]"}`}>{simEngine}</div>
            </div>

            <div className="space-y-3">
              {[
                { key: "liveness" as const, label: t("Motion liveness (head turns)", "Motion Liveness (ចលនាងាកក្បាល)"), color: "from-[var(--danger)] to-[var(--gold)]", value: simScores.liveness },
                { key: "mesh" as const, label: t("3D mesh landmark consistency", "3D Mesh Landmark Consistency"), color: "from-[var(--teal)] to-[var(--slate-accent)]", value: simScores.mesh },
                { key: "spoof" as const, label: t("Deepfake & print spoof rejection", "Deepfake & Print Spoof Rejection"), color: "from-[var(--success)] to-[var(--teal)]", value: simScores.spoof },
              ].map((bar) => (
                <div key={bar.key}>
                  <div className="mb-1 flex justify-between font-mono-ui text-[11px]">
                    <span className="text-[var(--ink-dim)]">{bar.label}</span>
                    <span className="font-bold text-[var(--ink)]">{bar.value}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full border border-[var(--ground-line)] bg-[var(--ground)]">
                    <div className={`h-full bg-gradient-to-r ${bar.color} transition-all duration-300`} style={{ width: `${bar.value}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="h-28 space-y-1 overflow-y-auto rounded-lg border border-[var(--ground-line)] bg-[#14161c] p-3 font-mono-ui text-[11px] leading-relaxed text-[#9a9d9f]">
              {simLog.map((line, i) => (
                <div key={i} className={line.startsWith("[SUCCESS]") ? "font-bold text-[var(--success)]" : ""}>
                  {line}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={runSimulation}
              disabled={simRunning}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--gold)] px-4 py-3 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)] disabled:opacity-50"
            >
              <Play size={15} />
              {simRunning ? t("Scanning…", "កំពុងស្កេន...") : t("Start AI Selfie Verification", "ចាប់ផ្តើមសាកល្បង AI Selfie Verification")}
            </button>
          </div>
        </div>
      </SectionCard>

      {/* 4. Inspector */}
      <section id="inspector-section" className="scroll-mt-20">
        <SectionCard
          icon={Terminal}
          accent="success"
          title={t("HTTP Wire & Biometric Inspector", "៣. កម្មវិធីពិនិត្យកូដ HTTP Wire & Biometric Inspector")}
          subtitle={t("Switch protocols to inspect HTTP wire headers, selfie AI telemetry, and biometric assertions.", "ចុចប្តូរពិធីសារដើម្បីពិនិត្យមើលកូដ HTTP wire headers, selfie AI telemetry, និងសញ្ញាស្កេនជីវមាត្រ។")}
        >
          <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] lg:grid-cols-3">
            <div className="flex flex-col gap-1 border-b border-[var(--ground-line)] p-3 lg:border-b-0 lg:border-r">
              <div className="px-2 py-1 font-mono-ui text-[10px] uppercase text-[var(--ink-faint)]">{t("Select protocol", "ជ្រើសរើសពិធីសារ")}</div>
              {METHODS.map((m) => {
                const a = ACCENTS[m.accent];
                const active = inspKey === m.id;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setInspKey(m.id)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-left font-mono-ui text-xs transition ${
                      active ? `bg-[var(--ground-raised-hi)] ${a.text}` : "text-[var(--ink-dim)] hover:bg-[var(--ground-raised-hi)]"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Icon size={14} />
                      {m.title}
                    </span>
                    <ChevronRight size={14} className={active ? "" : "opacity-50"} />
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col justify-between p-5 lg:col-span-2">
              <div>
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-[var(--ground-line)] pb-3">
                  <span className="text-sm font-bold text-[var(--ink)]">
                    {selectedMethod.num} {selectedMethod.title}
                  </span>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 font-mono-ui text-[10px] ${ACCENTS[selectedMethod.accent].border} ${ACCENTS[selectedMethod.accent].text}`}>
                    {selectedMethod.badge}
                  </span>
                </div>
                <CodeBlock code={selectedMethod.code} />
                <div className="mt-4 rounded-lg border border-[var(--ground-line)] bg-[var(--ground)] p-4 text-xs leading-relaxed text-[var(--ink-dim)]">
                  <strong className="text-[var(--ink)]">{t("How it works:", "បច្ចេកទេស និងគោលការណ៍៖")}</strong>{" "}
                  <span dangerouslySetInnerHTML={{ __html: selectedMethod.inspectorDesc }} />
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </section>

      {/* 5. Matrix */}
      <SectionCard
        icon={Table2}
        accent="slate"
        title={t("Comparison Matrix", "៤. តារាងប្រៀបធៀបបច្ចេកទេសទូលំទូលាយ")}
        subtitle={t("Technical comparison across all 13 protocols and standards.", "ការប្រៀបធៀបបច្ចេកទេសរវាងពិធីសារ និងស្តង់ដារជីវមាត្រទាំង ១៣។")}
      >
        <div className="overflow-x-auto rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)]">
          <table className="w-full border-collapse text-left text-xs text-[var(--ink-dim)]">
            <thead className="border-b border-[var(--ground-line)] font-mono-ui text-[11px] text-[var(--ink-faint)]">
              <tr>
                <th className="p-3 font-medium">{t("Method", "ពិធីសារ")}</th>
                <th className="p-3 font-medium">{t("OSI Layer", "OSI Layer")}</th>
                <th className="p-3 font-medium">{t("Statefulness", "Statefulness")}</th>
                <th className="p-3 font-medium">{t("Granularity", "កម្រិតសិទ្ធិ")}</th>
                <th className="p-3 font-medium">{t("Phishing Resistance", "ការទប់ស្កាត់ Phishing")}</th>
                <th className="p-3 font-medium">{t("Main Risk", "ហានិភ័យចម្បង")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--ground-line)]">
              {METHODS.map((m) => {
                const a = ACCENTS[m.accent];
                const Icon = m.icon;
                return (
                  <tr key={m.id} className="align-top transition-colors hover:bg-[var(--ground-raised-hi)]">
                    <td className="p-3">
                      <span className={`flex items-center gap-1.5 font-semibold ${a.text}`}>
                        <Icon size={14} className="shrink-0" />
                        {m.title}
                      </span>
                    </td>
                    <td className="p-3 font-mono-ui text-[11px]">{m.matrix.osi}</td>
                    <td className="p-3">{m.matrix.state}</td>
                    <td className="p-3">{m.matrix.granularity}</td>
                    <td className={`p-3 font-semibold ${m.matrix.phishing.startsWith("១០០%") || m.matrix.phishing.startsWith("ខ្ពស់") ? "text-[var(--success)]" : "text-[var(--ink-dim)]"}`}>
                      {m.matrix.phishing}
                    </td>
                    <td className="p-3">{m.matrix.risk}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* 6. Wizard */}
      <SectionCard
        icon={Compass}
        accent="slate"
        title={t("Architecture Decision Wizard", "៥. ឧបករណ៍ជួយសម្រេចចិត្តស្ថាបត្យកម្មប្រព័ន្ធ")}
        subtitle={t("Pick your caller type and security goal to get the best-fit architecture recommendation.", "ជ្រើសរើសប្រភេទអ្នកហៅ និងតម្រូវការសន្តិសុខដើម្បីទទួលបានអនុសាសន៍ស្ថាបត្យកម្មសមស្របបំផុត។")}
      >
        <div className="rounded-xl border border-[var(--ground-line)] bg-[var(--ground-raised)] p-5">
          <div className="space-y-5">
            <Field label={t("Q1: Who is calling your API?", "សំណួរទី ១៖ តើអ្នកណា ឬអ្វីដែលកំពុងហៅប្រើប្រាស់ API របស់អ្នក?")}>
              <Select value={caller} onChange={(e) => setCaller(e.target.value)}>
                {WIZARD_CALLERS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("Q2: What is your main security goal?", "សំណួរទី ២៖ តើអ្វីជាគោលដៅសន្តិសុខចម្បង?")}>
              <Select value={requirement} onChange={(e) => setRequirement(e.target.value)}>
                {WIZARD_REQUIREMENTS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </Field>
            <button
              type="button"
              onClick={evaluateWizard}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--gold)] px-4 py-3 text-sm font-semibold text-[#0a0c0d] transition hover:bg-[var(--gold-dim)]"
            >
              <Sparkles size={15} />
              {t("Generate security architecture recommendation", "បង្កើតអនុសាសន៍ស្ថាបត្យកម្មសន្តិសុខ")}
            </button>
          </div>

          {wizard && (
            <div className="mt-5 rounded-xl border border-[var(--slate-accent)]/40 bg-[var(--ground)] p-5">
              <div className="mb-1 font-mono-ui text-[10px] uppercase text-[var(--slate-accent)]">{t("Recommended architecture strategy", "យុទ្ធសាស្ត្រស្ថាបត្យកម្មដែលណែនាំ")}</div>
              <div className="mb-2 text-lg font-bold text-[var(--ink)]">{wizard.title}</div>
              <p className="text-xs leading-relaxed text-[var(--ink-dim)]">{wizard.desc}</p>
            </div>
          )}
        </div>
      </SectionCard>

      {/* 7. Surprises */}
      <SectionCard
        icon={HelpCircle}
        accent="danger"
        title={t("Which One Surprised You?", "៦. តើចំណុចសន្តិសុខមួយណាដែលធ្វើឱ្យអ្នកភ្ញាក់ផ្អើលបំផុត?")}
        subtitle={t("Common misconceptions developers run into.", "ចុចលើប្រអប់ ដើម្បីមើលការយល់ច្រឡំជាទូទៅដែលអ្នកអភិវឌ្ឍន៍ជួបប្រទះ។")}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {SURPRISES.map((s, i) => {
            const a = ACCENTS[s.accent];
            const Icon = s.icon;
            const open = openSurprise === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setOpenSurprise(open ? null : i)}
                className={`rounded-xl border p-4 text-left transition ${open ? "border-[var(--gold-dim)] bg-[var(--ground-raised-hi)]" : "border-[var(--ground-line)] bg-[var(--ground-raised)] hover:border-[var(--gold-dim)]"}`}
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`rounded-lg ${a.bg10} ${a.text} p-2`}>
                      <Icon size={16} />
                    </span>
                    <span className="text-sm font-bold text-[var(--ink)]">{s.quote}</span>
                  </div>
                  <ChevronDown size={16} className={`shrink-0 text-[var(--ink-faint)] transition-transform ${open ? "rotate-180" : ""}`} />
                </div>
                <div className="text-xs text-[var(--ink-faint)]">{s.preview}</div>
                {open && <div className={`mt-3 border-t border-[var(--ground-line)] pt-3 text-xs leading-relaxed ${a.text}`}>{s.body}</div>}
              </button>
            );
          })}
        </div>
      </SectionCard>
    </ToolShell>
  );
}
