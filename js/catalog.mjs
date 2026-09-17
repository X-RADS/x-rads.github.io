/** @typedef {{query: string, anatomy: string, modality: string, status: string}} CatalogFilters */

const text = (value) => (value == null ? "" : String(value));

/** Normalize user-facing and searchable text consistently across locales. */
export function normalizeText(value) {
  return text(value).normalize("NFKC").toLowerCase();
}

const localizedValues = (value) => {
  if (!value || typeof value !== "object") return [text(value)];
  return [value.zh, value.en].filter((item) => item != null).map(text);
};

const searchableRecordText = (record) => {
  const values = [
    record.acronym,
    ...localizedValues(record.name),
    ...localizedValues(record.summary),
    record.organization,
    record.version,
    ...(record.modalities || []),
    ...localizedValues(record.domain),
    record.categoryRange,
    ...(record.categories || []).flatMap((category) => [
      category.code,
      category.original,
      ...localizedValues(category.meaning),
    ]),
    ...(record.originalTerms || []).flatMap((term) =>
      typeof term === "object"
        ? [term.term, ...localizedValues(term.explanation)]
        : [term]
    ),
  ];
  return normalizeText(values.join(" "));
};

export function searchAndFilter(records, filters) {
  const query = normalizeText(filters?.query);
  const anatomy = normalizeText(filters?.anatomy);
  const modality = normalizeText(filters?.modality);
  const status = normalizeText(filters?.status);
  return records.filter((record) => {
    if (query && !searchableRecordText(record).includes(query)) return false;
    if (anatomy && normalizeText(record.anatomy) !== anatomy) return false;
    if (status && normalizeText(record.status) !== status) return false;
    if (modality && !(record.modalities || []).some((item) => normalizeText(item) === modality)) return false;
    return true;
  });
}

export function getRecordById(records, id) {
  return records.find((record) => record.id === id) || null;
}

export function localizeRecord(record, language) {
  const lang = language === "en" ? "en" : "zh";
  return {
    ...record,
    displayName: record.name?.[lang] || "",
    englishName: record.name?.en || record.acronym,
    displaySummary: record.summary?.[lang] || "",
    englishSummary: record.summary?.en || "",
    displayDomain: record.domain?.[lang] || "",
    categories: (record.categories || []).map((category) => ({
      ...category,
      displayMeaning: category.meaning?.[lang] || "",
    })),
    originalTerms: (record.originalTerms || []).map((term) => ({
      ...term,
      displayExplanation: term.explanation?.[lang] || "",
    })),
  };
}

const stateKeys = ["query", "anatomy", "modality", "status", "lang", "rads"];

export function readState(url) {
  const language = url.searchParams.get("lang");
  return {
    lang: language === "en" ? "en" : "zh",
    query: url.searchParams.get("query") || "",
    anatomy: url.searchParams.get("anatomy") || "",
    modality: url.searchParams.get("modality") || "",
    status: url.searchParams.get("status") || "",
    rads: url.searchParams.get("rads") || "",
  };
}

export function writeState(url, patch) {
  const next = new URL(url.href);
  for (const key of stateKeys) {
    if (!Object.prototype.hasOwnProperty.call(patch || {}, key)) continue;
    const value = patch[key];
    if (value == null || value === "") next.searchParams.delete(key);
    else if (key === "lang") next.searchParams.set(key, value === "en" ? "en" : "zh");
    else next.searchParams.set(key, String(value));
  }
  return next;
}
