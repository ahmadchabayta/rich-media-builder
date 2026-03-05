"use client";
import { useState, useEffect, useRef } from "react";
import {
  Combobox,
  useCombobox,
  TextInput,
  ScrollArea,
  Text,
  Group,
  ActionIcon,
} from "@mantine/core";
import { IconSearch, IconX, IconLink, IconUpload, IconTrash } from "@tabler/icons-react";
import {
  SYSTEM_FONTS,
  ensureFont,
  loadGoogleFontPreview,
  injectCustomFontFace,
} from "@src/lib/fonts";
import { GOOGLE_FONTS, type GoogleFontMeta } from "@src/lib/googleFontsList";
import { useQuizStore } from "@src/store/quizStore";
import type { CustomFontEntry } from "@src/store/types";

const CATEGORY_LABELS: Record<GoogleFontMeta["category"], string> = {
  "sans-serif": "Sans-serif",
  serif: "Serif",
  display: "Display",
  handwriting: "Handwriting",
  monospace: "Monospace",
};

const MAX_RESULTS = 20;
const UPLOAD_SENTINEL = "__upload__";
const LOAD_URL_SENTINEL = "__load_url__";

function extractFamiliesFromUrl(raw: string): string[] {
  try {
    const url = new URL(raw);
    const families = url.searchParams.getAll("family");
    if (families.length > 0) {
      return families.map((f) => f.split(":")[0].replace(/\+/g, " "));
    }
  } catch {}
  return [];
}

interface Props {
  value: string | null;
  onChange: (family: string | null) => void;
}

export function FontFamilySelect({ value, onChange }: Props) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    onDropdownOpen: () => combobox.updateSelectedOptionIndex("active"),
  });

  const [search, setSearch] = useState(value ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(value ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const customFonts = useQuizStore((s) => s.customFonts);
  const addCustomFont = useQuizStore((s) => s.addCustomFont);
  const removeCustomFont = useQuizStore((s) => s.removeCustomFont);

  // Debounce the search so we don't re-filter on every keystroke
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 180);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // -- Compute filtered lists
  const q = debouncedSearch.trim().toLowerCase();
  const isUrl = q.startsWith("http");

  const systemMatches = isUrl
    ? []
    : q
    ? [...SYSTEM_FONTS].filter((f) => f.toLowerCase().includes(q)).sort()
    : [...SYSTEM_FONTS].sort();

  const googleMatches = isUrl
    ? []
    : q
    ? GOOGLE_FONTS.filter((f) => f.family.toLowerCase().includes(q)).slice(0, MAX_RESULTS)
    : GOOGLE_FONTS.slice(0, MAX_RESULTS);

  const customMatches: CustomFontEntry[] = isUrl
    ? []
    : q
    ? customFonts.filter((cf) => cf.family.toLowerCase().includes(q))
    : customFonts;

  // -- Lazy-load preview glyphs for visible Google fonts
  useEffect(() => {
    if (!combobox.dropdownOpened) return;
    googleMatches.forEach((f) => loadGoogleFontPreview(f.family));
    if (value && !SYSTEM_FONTS.has(value)) loadGoogleFontPreview(value);
  }, [debouncedSearch, combobox.dropdownOpened, value]);

  // -- Event handlers
  const handleLoadUrl = (raw: string) => {
    const families = extractFamiliesFromUrl(raw);
    if (families.length === 0) return;
    const linkId = `gfont-url-${Date.now()}`;
    const link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    link.href = raw;
    document.head.appendChild(link);
    families.forEach((family) => {
      if (!customFonts.find((cf) => cf.family === family)) {
        addCustomFont({ id: `url-${family}`, family, src: "", addedAt: Date.now() });
      }
    });
    const first = families[0];
    onChange(first);
    setSearch(first);
    setDebouncedSearch(first);
    combobox.closeDropdown();
  };

  const handleSelect = (v: string) => {
    if (v === UPLOAD_SENTINEL) {
      fileInputRef.current?.click();
      return;
    }
    if (v === LOAD_URL_SENTINEL) {
      handleLoadUrl(search.trim());
      return;
    }
    ensureFont(v);
    onChange(v);
    setSearch(v);
    setDebouncedSearch(v);
    combobox.closeDropdown();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    onChange(null);
    setSearch("");
    setDebouncedSearch("");
    combobox.openDropdown();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.currentTarget.value);
    combobox.openDropdown();
    combobox.updateSelectedOptionIndex();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const family = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      injectCustomFontFace(family, src);
      addCustomFont({ id: `upload-${Date.now()}`, family, src, addedAt: Date.now() });
      onChange(family);
      setSearch(family);
      setDebouncedSearch(family);
    };
    reader.readAsDataURL(file);
  };

  // -- Group Google results by category
  const byCategory = new Map<GoogleFontMeta["category"], string[]>();
  for (const f of googleMatches) {
    const arr = byCategory.get(f.category) ?? [];
    arr.push(f.family);
    byCategory.set(f.category, arr);
  }

  const hasResults =
    isUrl ||
    systemMatches.length + googleMatches.length + customMatches.length > 0;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".ttf,.otf,.woff,.woff2"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <Combobox store={combobox} onOptionSubmit={handleSelect} withinPortal>
        <Combobox.Target>
          <TextInput
            size="xs"
            placeholder="Font family or paste Google Fonts URL..."
            value={search}
            onChange={handleSearchChange}
            onFocus={() => combobox.openDropdown()}
            onBlur={() => {
              combobox.closeDropdown();
              if (search !== (value ?? "")) {
                setSearch(value ?? "");
                setDebouncedSearch(value ?? "");
              }
            }}
            rightSection={
              value ? (
                <IconX
                  size={14}
                  style={{ cursor: "pointer", opacity: 0.55 }}
                  onMouseDown={handleClear}
                />
              ) : (
                <IconSearch size={14} style={{ opacity: 0.35 }} />
              )
            }
            styles={{
              input: { fontFamily: value ?? "inherit" },
            }}
          />
        </Combobox.Target>

        <Combobox.Dropdown>
          <Combobox.Options>
            <ScrollArea.Autosize mah={300} scrollbarSize={4}>
              {/* URL mode -- single action item */}
              {isUrl && (
                <Combobox.Option value={LOAD_URL_SENTINEL}>
                  <Group gap={6}>
                    <IconLink size={13} />
                    <Text size="xs">Load from Google Fonts URL</Text>
                  </Group>
                </Combobox.Option>
              )}

              {/* No results fallback */}
              {!isUrl && !hasResults && (
                <Combobox.Empty>
                  No fonts match &ldquo;{debouncedSearch}&rdquo;
                </Combobox.Empty>
              )}

              {/* System fonts */}
              {!isUrl && systemMatches.length > 0 && (
                <Combobox.Group label="System">
                  {systemMatches.map((f) => (
                    <Combobox.Option
                      key={f}
                      value={f}
                      active={f === value}
                      style={{ fontFamily: f }}
                    >
                      {f}
                    </Combobox.Option>
                  ))}
                </Combobox.Group>
              )}

              {/* Google fonts grouped by category */}
              {!isUrl &&
                [...byCategory.entries()].map(([cat, families]) => (
                  <Combobox.Group key={cat} label={CATEGORY_LABELS[cat]}>
                    {families.map((f) => (
                      <Combobox.Option
                        key={f}
                        value={f}
                        active={f === value}
                        style={{ fontFamily: f }}
                      >
                        {f}
                      </Combobox.Option>
                    ))}
                  </Combobox.Group>
                ))}

              {/* Hint when results are capped */}
              {q && !isUrl && googleMatches.length === MAX_RESULTS && (
                <Combobox.Empty
                  style={{
                    fontSize: 11,
                    color: "var(--mantine-color-dimmed)",
                    padding: "4px 10px",
                    fontStyle: "italic",
                  }}
                >
                  Showing first {MAX_RESULTS} -- type more to narrow
                </Combobox.Empty>
              )}

              {/* Custom fonts (URL-loaded + uploaded) */}
              {!isUrl && customMatches.length > 0 && (
                <Combobox.Group label="Custom">
                  {customMatches.map((cf) => (
                    <Combobox.Option
                      key={cf.id}
                      value={cf.family}
                      active={cf.family === value}
                      style={{ fontFamily: cf.family }}
                    >
                      <Group justify="space-between" gap={4}>
                        <Text size="xs" style={{ fontFamily: cf.family }}>
                          {cf.family}
                        </Text>
                        <ActionIcon
                          size={16}
                          variant="subtle"
                          color="red"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            removeCustomFont(cf.id);
                            if (value === cf.family) onChange(null);
                          }}
                        >
                          <IconTrash size={11} />
                        </ActionIcon>
                      </Group>
                    </Combobox.Option>
                  ))}
                </Combobox.Group>
              )}

              {/* Upload font file (always at bottom) */}
              {!isUrl && (
                <Combobox.Option value={UPLOAD_SENTINEL}>
                  <Group gap={6}>
                    <IconUpload size={13} />
                    <Text size="xs" c="dimmed">Upload font file...</Text>
                  </Group>
                </Combobox.Option>
              )}
            </ScrollArea.Autosize>
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    </>
  );
}
