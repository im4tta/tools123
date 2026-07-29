import JSZip from "jszip";

export type KhmerLetterDocument = {
  royalHeader: boolean;
  sender: string;
  subject: string;
  reference: string;
  recipient: string;
  honorific: string;
  body: string;
  location: string;
  dateLines: string[];
  role: string;
  signatureMode: "single" | "witnesses";
  witnesses: string;
};

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const escapeXml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");

function run(text: string, bold = false) {
  return `<w:r><w:rPr><w:rFonts w:ascii="Kantumruy Pro" w:hAnsi="Kantumruy Pro" w:eastAsia="Kantumruy Pro" w:cs="Kantumruy Pro"/><w:lang w:val="km-KH" w:eastAsia="km-KH"/>${bold ? "<w:b/>" : ""}</w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
}

function paragraph(text: string, options: { align?: "left" | "center" | "right" | "both"; bold?: boolean; style?: string; after?: number } = {}) {
  const lines = text.split("\n");
  const content = lines.map((line, index) => `${index ? "<w:r><w:br/></w:r>" : ""}${run(line, options.bold)}`).join("");
  return `<w:p><w:pPr>${options.style ? `<w:pStyle w:val="${options.style}"/>` : ""}<w:jc w:val="${options.align ?? "left"}"/><w:spacing w:line="420" w:lineRule="auto" w:after="${options.after ?? 120}"/></w:pPr>${content}</w:p>`;
}

function documentXml(letter: KhmerLetterDocument) {
  const content: string[] = [];
  if (letter.royalHeader) {
    content.push(paragraph("ព្រះរាជាណាចក្រកម្ពុជា", { align: "center", bold: true, style: "RoyalTitle", after: 0 }));
    content.push(paragraph("ជាតិ សាសនា ព្រះមហាក្សត្រ", { align: "center", bold: true, style: "RoyalSubtitle", after: 360 }));
  }
  content.push(paragraph(letter.sender || "—", { align: "center", bold: true, style: "Sender", after: 360 }));
  content.push(paragraph(`កម្មវត្ថុ៖ ${letter.subject || "—"}`, { bold: true }));
  if (letter.reference) content.push(paragraph(`យោង៖ ${letter.reference}`));
  content.push(paragraph(`${letter.recipient} ${letter.honorific}`.trim(), { align: "center", bold: true, after: 200 }));
  letter.body.split(/\n\s*\n/).filter(Boolean).forEach((block) => content.push(paragraph(block, { align: "both", after: 180 })));
  content.push(...letter.dateLines.map((line) => paragraph(`${letter.location}${line ? `, ${line}` : ""}`, { align: "right", after: 0 })));
  if (letter.signatureMode === "witnesses") content.push(paragraph(`សាក្សី៖ ${letter.witnesses || "________________"}`, { align: "left", after: 0 }));
  content.push(paragraph(letter.role || "អ្នកចុះហត្ថលេខា", { align: "right", bold: true, after: 600 }));
  content.push(paragraph("________________", { align: "right" }));
  return `${XML_HEADER}<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${content.join("")}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>`;
}

const CONTENT_TYPES = `${XML_HEADER}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`;
const ROOT_RELS = `${XML_HEADER}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`;
const DOCUMENT_RELS = `${XML_HEADER}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
const STYLES = `${XML_HEADER}<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Kantumruy Pro" w:hAnsi="Kantumruy Pro" w:eastAsia="Kantumruy Pro" w:cs="Kantumruy Pro"/><w:sz w:val="24"/><w:lang w:val="km-KH" w:eastAsia="km-KH"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:line="420" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="RoyalTitle"><w:name w:val="Royal Title"/><w:rPr><w:rFonts w:ascii="Moul" w:hAnsi="Moul" w:eastAsia="Moul"/><w:sz w:val="28"/><w:b/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="RoyalSubtitle"><w:name w:val="Royal Subtitle"/><w:rPr><w:rFonts w:ascii="Moul" w:hAnsi="Moul" w:eastAsia="Moul"/><w:sz w:val="22"/><w:b/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Sender"><w:name w:val="Sender"/><w:rPr><w:sz w:val="26"/><w:b/></w:rPr></w:style></w:styles>`;
const APP_PROPS = `${XML_HEADER}<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Toolbox123</Application><AppVersion>1.0</AppVersion></Properties>`;

export async function createKhmerLetterDocx(letter: KhmerLetterDocument) {
  const zip = new JSZip();
  const timestamp = new Date().toISOString();
  const core = `${XML_HEADER}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${escapeXml(letter.subject || "Khmer administrative letter")}</dc:title><dc:creator>Toolbox123</dc:creator><cp:lastModifiedBy>Toolbox123</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${timestamp}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${timestamp}</dcterms:modified></cp:coreProperties>`;
  zip.file("[Content_Types].xml", CONTENT_TYPES);
  zip.file("_rels/.rels", ROOT_RELS);
  zip.file("word/document.xml", documentXml(letter));
  zip.file("word/styles.xml", STYLES);
  zip.file("word/_rels/document.xml.rels", DOCUMENT_RELS);
  zip.file("docProps/core.xml", core);
  zip.file("docProps/app.xml", APP_PROPS);
  return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", compression: "DEFLATE" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}