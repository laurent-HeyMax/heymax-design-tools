export function pLimit(concurrency: number) {
  let active = 0;
  const queue: (() => void)[] = [];

  const next = () => {
    active--;
    const fn = queue.shift();
    if (fn) fn();
  };

  return function run<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const attempt = () => {
        active++;
        fn().then(
          (v) => {
            resolve(v);
            next();
          },
          (e) => {
            reject(e);
            next();
          },
        );
      };
      if (active < concurrency) attempt();
      else queue.push(attempt);
    });
  };
}
