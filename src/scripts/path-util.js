export const join = (...segments) => {
  if (!segments.length) return '';

  const parts = [];

  segments.forEach((segment, index) => {
    if (segment == null) {
      return;
    }

    let part = String(segment);
    if (!part) {
      return;
    }

    if (index > 0) {
      part = part.replace(/^\/+/, '');
    }

    if (index < segments.length - 1) {
      part = part.replace(/\/+$/, '');
    }

    if (part) {
      parts.push(part);
    }
  });

  if (!parts.length) {
    return '';
  }

  return parts.join('/').replace(/\/{2,}/g, '/');
};

export default { join };
