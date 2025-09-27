export function withEnv<T>(vars: Record<string, string>, fn: () => Promise<T> | T) {
  const original = { ...process.env };
  Object.assign(process.env, vars);

  return Promise.resolve()
    .then(fn)
    .finally(() => {
      process.env = original;
    });
}

