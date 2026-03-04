"use client";
import { useState, useEffect, useRef } from "react";
import { Combobox, useCombobox, TextInput, ScrollArea } from "@mantine/core";
import { IconSearch, IconX } from "@tabler/icons-react";
import {
  SYSTEM_FONTS,
  ensureFont,
  loadGoogleFontPreview,
} from "@src/lib/fonts";
import { GOOGLE_FONTS, type GoogleFontMeta } from "@src/lib/googleFontsList";

const CATEGORY_LABELS: Record<GoogleFontMeta["category"], string> = {
  "sans-serif": "Sans-serif",
  serif: "Serif",
  display: "Display",
  handwriting: "Handwriting",
  monospace: "Monospace",
};

/** Maximum Google Font results to show at once (prevents an overwhelming list). */
const MAX_RESULTS = 20;

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

  // Debounce the search so we don't re-filter on every keystroke
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 180);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // ── Compute filtered lists ──────────────────────────────────────────────
  const q = debouncedSearch.trim().toLowerCase();

  const systemMatches = q
    ? [...SYSTEM_FONTS].filter((f) => f.toLowerCase().includes(q)).sort()
    : [...SYSTEM_FONTS].sort();

  const googleMatches = q
    ? GOOGLE_FONTS.filter((f) => f.family.toLowerCase().includes(q)).slice(
        0,
        MAX_RESULTS,
      )
    : GOOGLE_FONTS.slice(0, MAX_RESULTS);

  // ── Lazy-load preview glyphs for visible Google fonts ─────────────────────
  useEffect(() => {
    if (!combobox.dropdownOpened) return;
    googleMatches.forEach((f) => loadGoogleFontPreview(f.family));
    // Also show a preview for the currently selected font if it's not in the
    // first page of results (e.g. user already had a niche font selected)
    if (value && !SYSTEM_FONTS.has(value)) {
      loadGoogleFontPreview(value);
    }
  }, [debouncedSearch, combobox.dropdownOpened, value]);

  // ── Event handlers ────────────────────────────────────────────────────────
  const handleSelect = (v: string) => {
    ensureFont(v);
    onChange(v);
    setSearch(v);
    setDebouncedSearch(v);
    combobox.closeDropdown();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault(); // keep dropdown from closing via blur
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

  // ── Group Google results by category ─────────────────────────────────────
  const byCategory = new Map<GoogleFontMeta["category"], string[]>();
  for (const f of googleMatches) {
    const arr = byCategory.get(f.category) ?? [];
    arr.push(f.family);
    byCategory.set(f.category, arr);
  }

  const hasResults = systemMatches.length + googleMatches.length > 0;

  return (
    <Combobox store={combobox} onOptionSubmit={handleSelect} withinPortal>
      <Combobox.Target>
        <TextInput
          placeholder="Font family…"
          value={search}
          onChange={handleSearchChange}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => {
            // Blur — if user typed something partial but didn't pick, revert to last confirmed value
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
            {!hasResults && (
              <Combobox.Empty>
                No fonts match &ldquo;{debouncedSearch}&rdquo;
              </Combobox.Empty>
            )}

            {/* ── System fonts ─────────────────────────── */}
            {systemMatches.length > 0 && (
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

            {/* ── Google fonts grouped by category ─────── */}
            {[...byCategory.entries()].map(([cat, families]) => (
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
            {q && googleMatches.length === MAX_RESULTS && (
              <Combobox.Empty
                style={{
                  fontSize: 11,
                  color: "var(--mantine-color-dimmed)",
                  padding: "4px 10px",
                  fontStyle: "italic",
                }}
              >
                Showing first {MAX_RESULTS} — type more to narrow
              </Combobox.Empty>
            )}
          </ScrollArea.Autosize>
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
