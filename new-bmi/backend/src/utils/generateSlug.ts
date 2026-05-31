import slugify from 'slugify';

export const generateSlug = (text: string): string => {
  const base = slugify(text, { lower: true, strict: true });
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
};
