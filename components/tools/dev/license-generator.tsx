"use client";
import { useMemo, useState } from "react";
import { ToolShell, Field, TextInput, Select } from "@/components/ui/Shell";
import { Output } from "@/components/ui/Output";
import { useToolState } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageProvider";

const LICENSES: Record<string, string> = {
  MIT: `MIT License

Copyright (c) {year} {author}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`,
  Apache2: `Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

Copyright {year} {author}

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.`,
  GPL3: `GNU GENERAL PUBLIC LICENSE
Version 3, 29 June 2007

Copyright (C) {year} {author}

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.`,
  BSD3: `BSD 3-Clause License

Copyright (c) {year}, {author}
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
1. Redistributions of source code must retain the above copyright notice,
   this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors
   may be used to endorse or promote products derived from this software
   without specific prior written permission.`,
};

export default function LicenseGenerator() {
  const { text: t } = useLanguage();
  const [license, setLicense] = useState("MIT");
  const [author, setAuthor] = useToolState("license:author", "Your Name");
  const [year, setYear] = useToolState("license:year", String(new Date().getFullYear()));

  const content = useMemo(
    () => (LICENSES[license] ?? "").replace(/\{author\}/g, author).replace(/\{year\}/g, year),
    [license, author, year],
  );

  return (
    <ToolShell
      title="License Generator"
      khmerTitle="បង្កើតអាជ្ញាបណ្ណ"
      description="Generate MIT, Apache-2.0, GPL-3.0, or BSD-3 license text with your name."
      descriptionKm="បង្កើតអត្ថបទអាជ្ញាបណ្ណ MIT, Apache-2.0, GPL-3.0 ឬ BSD-3 ជាមួយឈ្មោះរបស់អ្នក។"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t("License", "អាជ្ញាបណ្ណ")}>
          <Select value={license} onChange={(e) => setLicense(e.target.value)}>
            {Object.keys(LICENSES).map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("Author / copyright holder", "អ្នកនិពន្ធ / ម្ចាស់កម្មសិទ្ធិ")}>
          <TextInput value={author} onChange={(e) => setAuthor(e.target.value)} />
        </Field>
        <Field label={t("Year", "ឆ្នាំ")}>
          <TextInput value={year} onChange={(e) => setYear(e.target.value)} />
        </Field>
      </div>
      <Output label={t("License text", "អត្ថបទអាជ្ញាបណ្ណ")} value={content} />
    </ToolShell>
  );
}