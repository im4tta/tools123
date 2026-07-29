"use client";

import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { Download, RotateCcw, RotateCw } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/Output";
import { Field, ToolShell } from "@/components/ui/Shell";

function cameraErrorMessage(error: unknown) {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Camera permission was denied. Allow access in browser settings or choose an image file. / ការអនុញ្ញាតប្រើកាមេរ៉ាត្រូវបានបដិសេធ។ សូមអនុញ្ញាតក្នុងការកំណត់កម្មវិធីរុករក ឬជ្រើសរើសឯកសាររូបភាព។";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "No compatible camera was found. Choose an image file instead. / រកមិនឃើញកាមេរ៉ាដែលអាចប្រើបានទេ។ សូមជ្រើសរើសឯកសាររូបភាពជំនួស។";
  }
  if (name === "NotReadableError" || name === "AbortError") {
    return "The camera is unavailable or already in use. Close other camera apps or choose a file. / កាមេរ៉ាមិនអាចប្រើបាន ឬកំពុងត្រូវបានប្រើ។ សូមបិទកម្មវិធីកាមេរ៉ាផ្សេង ឬជ្រើសរើសឯកសារ។";
  }
  return "Could not start the camera. Choose an image file instead. / មិនអាចបើកកាមេរ៉ាបានទេ។ សូមជ្រើសរើសឯកសាររូបភាពជំនួស។";
}

function canvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG encoding failed")), "image/png");
  });
}

export default function DocumentScanner() {
  const { text } = useLanguage();
  const [consented, setConsented] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [grayscale, setGrayscale] = useState(false);
  const [contrast, setContrast] = useState(100);
  const [error, setError] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const outputRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const currentUrl = useRef<string | null>(null);
  const requestId = useRef(0);
  const mounted = useRef(true);

  const stopCamera = useCallback(() => {
    requestId.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setStarting(false);
  }, []);

  const replaceSource = useCallback((url: string | null) => {
    if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    currentUrl.current = url;
    setSourceUrl(url);
    setRotation(0);
    setGrayscale(false);
    setContrast(100);
  }, []);

  useEffect(() => () => {
    mounted.current = false;
    requestId.current += 1;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
  }, []);

  useEffect(() => {
    const canvas = outputRef.current;
    if (!canvas || !sourceUrl) return;
    const image = new Image();
    let cancelled = false;
    image.onload = () => {
      if (cancelled) return;
      const quarterTurn = rotation % 180 !== 0;
      canvas.width = quarterTurn ? image.naturalHeight : image.naturalWidth;
      canvas.height = quarterTurn ? image.naturalWidth : image.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.filter = `${grayscale ? "grayscale(100%) " : ""}contrast(${contrast}%)`;
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate((rotation * Math.PI) / 180);
      context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.filter = "none";
    };
    image.onerror = () => {
      if (!cancelled) setError("Could not read this image. / មិនអាចអានរូបភាពនេះបានទេ។");
    };
    image.src = sourceUrl;
    return () => { cancelled = true; };
  }, [contrast, grayscale, rotation, sourceUrl]);

  async function startCamera() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera capture is not supported by this browser. Choose an image file instead. / កម្មវិធីរុករកនេះមិនគាំទ្រការថតដោយកាមេរ៉ាទេ។ សូមជ្រើសរើសឯកសាររូបភាពជំនួស។");
      return;
    }
    stopCamera();
    const id = ++requestId.current;
    setStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" } },
      });
      if (!mounted.current || id !== requestId.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (caught) {
      if (mounted.current && id === requestId.current) setError(cameraErrorMessage(caught));
      stopCamera();
    } finally {
      if (mounted.current && id === requestId.current) setStarting(false);
    }
  }

  async function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError("The camera is not ready yet. / កាមេរ៉ាមិនទាន់រួចរាល់ទេ។");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0);
    try {
      replaceSource(URL.createObjectURL(await canvasBlob(canvas)));
      setError("");
      stopCamera();
    } catch {
      setError("Could not create the captured image. / មិនអាចបង្កើតរូបភាពដែលបានថតបានទេ។");
    }
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    replaceSource(URL.createObjectURL(file));
    setError("");
    stopCamera();
    event.target.value = "";
  }

  async function downloadPng() {
    const canvas = outputRef.current;
    if (!canvas || !sourceUrl) return;
    try {
      const url = URL.createObjectURL(await canvasBlob(canvas));
      const link = document.createElement("a");
      link.href = url;
      link.download = "scanned-document.png";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      setError("Could not export the PNG. / មិនអាចនាំចេញ PNG បានទេ។");
    }
  }

  if (!consented) {
    return (
      <ToolShell title="Document Scanner" khmerTitle="ម៉ាស៊ីនស្កេនឯកសារ" description="Capture or choose a document image and adjust it entirely on your device." descriptionKm="ថត ឬជ្រើសរើសរូបភាពឯកសារ ហើយកែសម្រួលទាំងស្រុងនៅលើឧបករណ៍របស់អ្នក។">
        <div className="rounded-md border border-[var(--gold)]/60 bg-[var(--gold)]/10 p-5">
          <h2 className="font-medium text-[var(--ink)]">{text("Your camera, your choice", "កាមេរ៉ារបស់អ្នក ជម្រើសរបស់អ្នក")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--ink-dim)]">{text("If you continue, you may explicitly start your camera. Frames and selected files are processed only in this browser tab—nothing is uploaded, saved, or kept as history. Camera access stops when you close it or leave the tool.", "ប្រសិនបើអ្នកបន្ត អ្នកអាចបើកកាមេរ៉ាដោយផ្ទាល់។ ស៊ុម និងឯកសារដែលបានជ្រើសត្រូវបានដំណើរការតែក្នុងផ្ទាំងកម្មវិធីរុករកនេះ—គ្មានអ្វីត្រូវបានបង្ហោះ រក្សាទុក ឬទុកជាប្រវត្តិទេ។ កាមេរ៉ានឹងឈប់នៅពេលអ្នកបិទ ឬចាកចេញពីឧបករណ៍។")}</p>
          <Button type="button" className="mt-4" onClick={() => setConsented(true)}>{text("I understand — continue", "ខ្ញុំយល់ព្រម — បន្ត")}</Button>
        </div>
      </ToolShell>
    );
  }

  return (
    <ToolShell title="Document Scanner" khmerTitle="ម៉ាស៊ីនស្កេនឯកសារ" description="Capture or choose a document image and adjust it entirely on your device." descriptionKm="ថត ឬជ្រើសរើសរូបភាពឯកសារ ហើយកែសម្រួលទាំងស្រុងនៅលើឧបករណ៍របស់អ្នក។">
      <div className="rounded-md border border-[var(--gold)]/50 bg-[var(--gold)]/10 p-4 text-sm text-[var(--ink)]" role="note">
        <strong>{text("Local and temporary:", "មូលដ្ឋាន និងបណ្ដោះអាសន្ន៖")}</strong>{" "}
        {text("No upload, storage, or scan history. Images exist only in this tab until you replace them, clear them, refresh, or close it.", "គ្មានការបង្ហោះ ការរក្សាទុក ឬប្រវត្តិស្កេនទេ។ រូបភាពមានតែក្នុងផ្ទាំងនេះ រហូតដល់អ្នកជំនួស លុប ផ្ទុកឡើងវិញ ឬបិទវា។")}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
          <h2 className="text-sm font-medium text-[var(--ink)]">{text("Camera", "កាមេរ៉ា")}</h2>
          <video ref={videoRef} autoPlay muted playsInline className={`max-h-80 w-full rounded-md bg-black object-contain ${cameraActive ? "block" : "hidden"}`} />
          {!cameraActive && <div className="flex min-h-36 items-center justify-center rounded-md bg-[var(--ground-raised)] text-center text-sm text-[var(--ink-faint)]">{text("Camera remains off until you start it.", "កាមេរ៉ានៅតែបិទ រហូតដល់អ្នកបើកវា។")}</div>}
          <div className="flex flex-wrap gap-2">
            {!cameraActive ? <Button type="button" disabled={starting} onClick={startCamera}>{starting ? text("Starting…", "កំពុងបើក…") : text("Start camera", "បើកកាមេរ៉ា")}</Button> : <Button type="button" onClick={capture}>{text("Capture document", "ថតឯកសារ")}</Button>}
            {(cameraActive || starting) && <Button type="button" onClick={stopCamera} className="!bg-[var(--ground-raised)] !text-[var(--ink)]">{text("Close camera", "បិទកាមេរ៉ា")}</Button>}
          </div>
        </section>

        <section className="space-y-3 rounded-md border border-[var(--ground-line)] p-4">
          <h2 className="text-sm font-medium text-[var(--ink)]">{text("File fallback", "ជម្រើសឯកសារជំនួស")}</h2>
          <label className="flex min-h-36 cursor-pointer items-center justify-center rounded-md border border-dashed border-[var(--ground-line)] bg-[var(--ground-raised)] p-4 text-center text-sm text-[var(--ink-dim)] hover:border-[var(--gold-dim)]">
            {text("Choose a document image from this device", "ជ្រើសរើសរូបភាពឯកសារពីឧបករណ៍នេះ")}
            <input type="file" accept="image/*" className="hidden" onChange={chooseFile} />
          </label>
          <p className="text-xs text-[var(--ink-faint)]">{text("The selected file is read locally and is never uploaded.", "ឯកសារដែលបានជ្រើសត្រូវបានអានក្នុងឧបករណ៍ ហើយមិនត្រូវបានបង្ហោះទេ។")}</p>
        </section>
      </div>

      {error && <p role="alert" className="rounded-md border border-[var(--danger)]/40 bg-[var(--danger)]/10 p-3 text-sm text-[var(--danger)]">{error}</p>}

      {sourceUrl && (
        <section className="space-y-4 rounded-md border border-[var(--ground-line)] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setRotation((value) => (value + 270) % 360)} className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs text-[var(--ink-dim)]"><RotateCcw size={14} />{text("Rotate left", "បង្វិលឆ្វេង")}</button>
            <button type="button" onClick={() => setRotation((value) => (value + 90) % 360)} className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs text-[var(--ink-dim)]"><RotateCw size={14} />{text("Rotate right", "បង្វិលស្តាំ")}</button>
            <label className="inline-flex items-center gap-2 rounded-md border border-[var(--ground-line)] bg-[var(--ground-raised)] px-3 py-2 text-xs text-[var(--ink-dim)]"><input type="checkbox" checked={grayscale} onChange={(event) => setGrayscale(event.target.checked)} />{text("Grayscale", "សខ្មៅ")}</label>
          </div>
          <Field label="Contrast" labelKm="កម្រិតភាពផ្ទុយ" hint={`${contrast}%`}>
            <input className="w-full accent-[var(--gold)]" type="range" min="50" max="200" value={contrast} onChange={(event) => setContrast(Number(event.target.value))} />
          </Field>
          <canvas ref={outputRef} className="max-h-[32rem] w-full rounded-md border border-[var(--ground-line)] bg-white object-contain" />
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={downloadPng}><span className="inline-flex items-center gap-1.5"><Download size={14} />{text("Download PNG", "ទាញយក PNG")}</span></Button>
            <Button type="button" onClick={() => replaceSource(null)} className="!bg-[var(--ground-raised)] !text-[var(--danger)]">{text("Clear image", "លុបរូបភាព")}</Button>
          </div>
        </section>
      )}
    </ToolShell>
  );
}
