export function slugify(value: string) {
  const input = value || 'video';
  const extensionMatch = input.toLowerCase().match(/\.(mp4|mov|webm)$/);
  const extension = extensionMatch ? extensionMatch[1] : '';
  const baseValue = extension ? input.slice(0, -(extension.length + 1)) : input;
  const slug = baseValue
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'video';

  return extension ? `${slug}.${extension}` : slug;
}

export function makeId(value: string) {
  return `${slugify(value)}-${Date.now().toString(36)}`;
}
