const sanitizeKey = (key: string): string => key.replace('-', '_');

export const sanitize = (algodRes: Record<string, unknown>): Record<string, unknown> => {
  if (Array.isArray(algodRes)) {
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error,@typescript-eslint/ban-ts-comment
    // @ts-ignore
    return algodRes.map(sanitize);
  }
  return Object.entries(algodRes).reduce((acc, [key, value]) => {
    const sanitizedValue = typeof value === 'object' ? sanitize(value as Record<string, unknown>) : value;
    return { ...acc, [sanitizeKey(key)]: sanitizedValue };
  }, {});
};

export const typed = <T>() => (res: Record<string, unknown>): T => sanitize(res) as T;
