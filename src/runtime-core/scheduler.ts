const p = Promise.resolve();

export const nextTick = (fn) => {
  return fn ? p.then(fn) : p;
};

const queue: any[] = [];
let isFlushPending = false;

export const queueJobs = (job) => {
  if (!queue.includes(job)) {
    queue.push(job);
  }

  queueFlush();
};

const queueFlush = () => {
  if (isFlushPending) return;
  isFlushPending = true;
  nextTick(flushJobs);
};

const flushJobs = () => {
  isFlushPending = false;
  let job;

  while ((job = queue.shift())) {
    job && job();
  }
};
