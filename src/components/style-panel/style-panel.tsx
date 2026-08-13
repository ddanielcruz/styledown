import type { ReactNode } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  ACCENT_SWATCHES,
  CODE_THEME_OPTIONS,
  FONT_OPTIONS,
  FONT_SIZE_RANGE,
  FONT_STACKS,
  MARGIN_OPTIONS,
  PAGE_SIZE_OPTIONS,
  type DocumentStyles,
} from '@/lib/styles';

interface StylePanelProps {
  styles: DocumentStyles;
  onChange: (styles: DocumentStyles) => void;
}

/**
 * A `fieldset` rather than a label and an id: three of these controls are a group of
 * buttons rather than one field, and a `legend` names a group natively — no generated ids
 * to keep in sync, and the name is announced on the way in.
 *
 * A `legend` names the group and not the control inside it, though. That is right for the
 * button groups, whose buttons say what they are, and wrong for a select, which is one
 * unnamed button announced as "combobox" — so those two carry the name themselves.
 */
function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <fieldset className="space-y-2">
      <legend className="flex w-full items-baseline justify-between text-sm font-medium select-none">
        {label}
      </legend>
      {children}
    </fieldset>
  );
}

/**
 * The five settings, and nothing else.
 *
 * `docs/DESIGN.md` is emphatic that these exist to *adjust* a document that already looks
 * good, so every one of them is a short list of choices that all work rather than an open
 * field — the exception is the accent, where a colour picker is the only honest answer to
 * "our brand is this one".
 */
export function StylePanel({ styles, onChange }: StylePanelProps) {
  const set = (patch: Partial<DocumentStyles>) => onChange({ ...styles, ...patch });
  const isCustom = !ACCENT_SWATCHES.some((swatch) => swatch.value === styles.accent);

  return (
    <aside className="no-print w-72 shrink-0 space-y-6 overflow-y-auto border-l p-4">
      <Field label="Document font">
        <Select
          items={FONT_OPTIONS}
          value={styles.bodyFont}
          onValueChange={(bodyFont) => bodyFont && set({ bodyFont })}
        >
          {/* Set in the face it names. A font menu that shows every option in the same
              typeface is asking the reader to choose from memory. */}
          <SelectTrigger
            aria-label="Document font"
            className="w-full"
            style={{ fontFamily: FONT_STACKS[styles.bodyFont] }}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                style={{ fontFamily: FONT_STACKS[option.value] }}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field
        label={
          <>
            Base size
            <span className="text-muted-foreground text-xs tabular-nums">{styles.fontSize} px</span>
          </>
        }
      >
        {/* An array of one. The wrapper reads the value's shape to decide how many thumbs
            to draw, and a bare number gets it a range slider with two. */}
        <Slider
          className="py-1"
          min={FONT_SIZE_RANGE.min}
          max={FONT_SIZE_RANGE.max}
          step={FONT_SIZE_RANGE.step}
          value={[styles.fontSize]}
          onValueChange={(value) => set({ fontSize: Array.isArray(value) ? value[0]! : value })}
        />
      </Field>

      <Field label="Accent colour">
        <div className="flex items-center gap-2">
          {ACCENT_SWATCHES.map((swatch) => (
            <button
              key={swatch.value}
              type="button"
              title={swatch.label}
              aria-label={swatch.label}
              aria-pressed={styles.accent === swatch.value}
              onClick={() => set({ accent: swatch.value })}
              className="ring-ring size-6 rounded-full transition-shadow aria-pressed:ring-2 aria-pressed:ring-offset-2"
              style={{ backgroundColor: swatch.value }}
            />
          ))}

          {/*
           * The picker wears every colour rather than the current one. A native colour
           * input paints itself with its value, which put a seventh circle at the end of
           * six swatches that looked exactly like a swatch — the one control here that
           * opens onto everything, disguised as one more preset.
           */}
          <label
            title="Custom colour"
            data-chosen={isCustom || undefined}
            className="ring-ring relative ml-1 size-6 cursor-pointer rounded-full focus-within:ring-2 focus-within:ring-offset-2 data-chosen:ring-2 data-chosen:ring-offset-2"
            style={{
              background:
                'conic-gradient(from 90deg, #be123c, #b45309, #15803d, #0f766e, #1d4ed8, #6d28d9, #be123c)',
            }}
          >
            <input
              type="color"
              aria-label="Custom accent colour"
              value={styles.accent}
              onChange={(event) => set({ accent: event.target.value })}
              className="sr-only"
            />
          </label>
        </div>
      </Field>

      <Field label="Paper">
        <ToggleGroup
          variant="outline"
          spacing={0}
          className="w-full *:flex-1"
          value={[styles.page.size]}
          onValueChange={([size]) =>
            size && set({ page: { ...styles.page, size: size as DocumentStyles['page']['size'] } })
          }
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <ToggleGroupItem key={option.value} value={option.value}>
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>

      <Field label="Margins">
        <ToggleGroup
          variant="outline"
          spacing={0}
          className="w-full *:flex-1"
          value={[styles.page.margins]}
          onValueChange={([margins]) =>
            margins &&
            set({
              page: { ...styles.page, margins: margins as DocumentStyles['page']['margins'] },
            })
          }
        >
          {MARGIN_OPTIONS.map((option) => (
            <ToggleGroupItem key={option.value} value={option.value}>
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>

      <Field label="Code theme">
        <Select
          items={CODE_THEME_OPTIONS}
          value={styles.codeTheme}
          onValueChange={(codeTheme) => codeTheme && set({ codeTheme })}
        >
          <SelectTrigger aria-label="Code theme" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CODE_THEME_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </aside>
  );
}
