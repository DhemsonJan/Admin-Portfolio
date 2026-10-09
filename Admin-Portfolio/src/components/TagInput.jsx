import { useState } from 'react';

/**
 * Chip-style multi-value input used for technologies and key features.
 * Enter or comma commits a tag; Backspace on an empty field removes the last.
 */
export default function TagInput({
  value = [],
  onChange,
  placeholder = 'Type and press Enter',
  suggestions = [],
  id,
  invalid = false,
}) {
  const [draft, setDraft] = useState('');

  const commit = (raw) => {
    const next = raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item) => !value.some((existing) => existing.toLowerCase() === item.toLowerCase()));

    if (next.length > 0) onChange([...value, ...next]);
    setDraft('');
  };

  const remove = (tag) => onChange(value.filter((item) => item !== tag));

  const onKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commit(draft);
      return;
    }
    if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      remove(value[value.length - 1]);
    }
  };

  const available = suggestions
    .filter(
      (suggestion) =>
        !value.some((existing) => existing.toLowerCase() === suggestion.toLowerCase()),
    )
    .slice(0, 14);

  return (
    <div>
      <div className="tag-input" style={invalid ? { borderColor: 'rgba(248,113,113,0.6)' } : undefined}>
        {value.map((tag) => (
          <span className="tag-chip" key={tag}>
            {tag}
            <button type="button" onClick={() => remove(tag)} aria-label={`Remove ${tag}`}>
              ×
            </button>
          </span>
        ))}

        <input
          id={id}
          type="text"
          value={draft}
          placeholder={value.length === 0 ? placeholder : 'Add another…'}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => draft && commit(draft)}
        />
      </div>

      {available.length > 0 ? (
        <div className="suggestions">
          {available.map((suggestion) => (
            <button
              type="button"
              className="suggestion"
              key={suggestion}
              onClick={() => commit(suggestion)}
            >
              + {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}