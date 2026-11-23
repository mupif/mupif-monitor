import { defineStore } from "pinia";

/*
 * Statistics of the workflow schedulers (GET <api>/scheduler-status2/).
 *
 * The API returns a list with one entry per scheduler registered in the MuPIF nameserver (metadata
 * "type:scheduler"); see SchedulerInfo in mupif/monitor.py. Each entry:
 *
 *   {
 *     ns: {name, uri, metadata},
 *     available: bool, error: str|null,   // newer API: a scheduler which did not answer
 *     numTasks: {running, scheduled, processed, finished, failed, currentLoad,
 *                waiting, pending, dbRunning, capacity, draining},  // last five: newer schedulers
 *     history: {pooledTasks48, processedTasks48, finishedTasks48, failedTasks48, load48,
 *               running48, waiting48, running120m, waiting120m,     // newer schedulers
 *               periodStart48, periodLength48, periodStart120m, periodLength120m},
 *     lastExecutions: [{weid, wid, status, started, finished,
 *                       modelServers}],  // {model: model server}; newer schedulers
 *     modelServerJobs: {modelServer: n},  // running executions per model server; newer schedulers
 *   }
 *
 * Older APIs return null for a scheduler which did not answer, and older schedulers do not report
 * the load fields (waiting, pending, ..., running48, ...). The store normalises every entry to the
 * same shape (normaliseScheduler below), using null for values which are not known, so that the
 * pages can show "unknown" instead of a misleading 0.
 *
 * Only one scheduler per deployment is supported by mupifDB at the moment, but nothing here
 * assumes it: the pages show the selected scheduler (Scheduler tab) or the totals over all
 * available ones (Overview tab, getter "summary").
 */

/** Value of an optional numeric field: null if missing (unknown). */
function opt(v) {
  return v === undefined || v === null ? null : v;
}

/** Start of the period containing `nowSec` for periods of `lengthSec` seconds (fallback time axis). */
function periodStartAt(nowSec, lengthSec) {
  return Math.floor(nowSec / lengthSec) * lengthSec;
}

/**
 * Convert one entry of the API answer to the shape used by the pages.
 *
 * @param entry  SchedulerInfo from the API, or null (older API: scheduler did not answer)
 * @param index  position in the answer (names the scheduler if the entry is null)
 * @returns {{name, uri, available, error, stat, history, lastExecutions, modelServerJobs}}
 */
function normaliseScheduler(entry, index) {
  const nowSec = Date.now() / 1000;
  if (!entry) {
    return {
      name: `scheduler #${index + 1}`,
      uri: "",
      available: false,
      error: "did not answer",
      stat: null,
      history: null,
      lastExecutions: [],
      modelServerJobs: null,
    };
  }
  const n = entry.numTasks || {};
  const h = entry.history || {};
  // the capacity (executions which can run at once) is reported by newer schedulers; for older
  // ones it can be derived from the load, if anything is running
  let capacity = opt(n.capacity);
  if (capacity === null && n.currentLoad > 0) {
    capacity = Math.round((100 * n.running) / n.currentLoad);
  }
  const periodLength48 = h.periodLength48 || 3600;
  const periodLength120m = h.periodLength120m || 60;
  return {
    name: entry.ns ? entry.ns.name : `scheduler #${index + 1}`,
    uri: entry.ns ? entry.ns.uri : "",
    available: entry.available !== false,
    error: opt(entry.error),
    stat: {
      running: n.running || 0,
      scheduled: n.scheduled || 0,
      processed: n.processed || 0,
      finished: n.finished || 0,
      failed: n.failed || 0,
      currentLoad: n.currentLoad || 0,
      // load fields of newer schedulers; null = not reported
      waiting: opt(n.waiting),
      pending: opt(n.pending),
      dbRunning: opt(n.dbRunning),
      capacity: capacity,
      draining: !!n.draining,
    },
    history: {
      pooledTasks48: h.pooledTasks48 || [],
      processedTasks48: h.processedTasks48 || [],
      finishedTasks48: h.finishedTasks48 || [],
      failedTasks48: h.failedTasks48 || [],
      load48: h.load48 || [],
      running48: h.running48 || [],
      waiting48: h.waiting48 || [],
      running120m: h.running120m || [],
      waiting120m: h.waiting120m || [],
      // time axis: start of the last (current) period and the period length, in seconds; older
      // schedulers do not report it, then the current period is assumed
      periodStart48:
        opt(h.periodStart48) ?? periodStartAt(nowSec, periodLength48),
      periodLength48: periodLength48,
      periodStart120m:
        opt(h.periodStart120m) ?? periodStartAt(nowSec, periodLength120m),
      periodLength120m: periodLength120m,
    },
    // modelServers of an execution: null = not reported (older scheduler), {} = not known yet
    lastExecutions: (entry.lastExecutions || []).map((e) => ({
      ...e,
      modelServers: opt(e.modelServers),
    })),
    // running executions per model server (registered name); null = not reported
    modelServerJobs: opt(entry.modelServerJobs),
  };
}

/**
 * Add up series of several schedulers element by element, aligned at their last (current) period.
 *
 * @param lists  arrays of numbers (possibly of different lengths)
 * @param combine  how to combine two values (default: sum)
 */
function combineSeries(lists, combine = (a, b) => a + b) {
  const nonEmpty = lists.filter((l) => l && l.length);
  if (!nonEmpty.length) return [];
  const len = Math.max(...nonEmpty.map((l) => l.length));
  const out = Array(len).fill(null);
  for (const l of nonEmpty) {
    const shift = len - l.length;
    l.forEach((v, i) => {
      out[i + shift] = out[i + shift] === null ? v : combine(out[i + shift], v);
    });
  }
  return out.map((v) => (v === null ? 0 : v));
}

export const useSchedulerStatStore = defineStore("schedulerStat", {
  state: () => ({
    /** all schedulers of the last answer, normalised (see normaliseScheduler) */
    schedulers: [],
    /** name of the scheduler chosen on the Scheduler tab (null: the first available one) */
    selected: null,
    /** why the last update failed (null if it succeeded) */
    error: null,
    /** time of the last successful update (Date) */
    lastUpdate: null,
    /** an update is in progress (overlapping requests are skipped) */
    updating: false,
  }),

  getters: {
    /** Schedulers which answered. */
    availableSchedulers(state) {
      return state.schedulers.filter((s) => s.available);
    },
    availableCount() {
      return this.availableSchedulers.length;
    },
    totalCount(state) {
      return state.schedulers.length;
    },
    /** The scheduler shown in detail: the selected one, else the first available, else the first. */
    current(state) {
      return (
        state.schedulers.find((s) => s.name === state.selected) ||
        this.availableSchedulers[0] ||
        state.schedulers[0] ||
        null
      );
    },
    /** Function returning the scheduler with the given nameserver name (or undefined). */
    byName(state) {
      return (name) => state.schedulers.find((s) => s.name === name);
    },
    /**
     * Running executions per model server (registered name), summed over the available schedulers.
     *
     * @returns null if no available scheduler reports it (older schedulers)
     */
    modelServerJobs() {
      const reported = this.availableSchedulers.filter(
        (s) => s.modelServerJobs !== null
      );
      if (!reported.length) return null;
      const total = {};
      for (const s of reported) {
        for (const [server, n] of Object.entries(s.modelServerJobs)) {
          total[server] = (total[server] || 0) + n;
        }
      }
      return total;
    },
    /**
     * Totals over the available schedulers, for the overview.
     *
     * Executions run and taken by the schedulers (running, scheduled) and their capacities add
     * up. The database queue (pending) and the database count of Running executions are shared
     * by the whole deployment, every scheduler reports the same numbers, so they are taken once
     * (the highest reported, the samples may be a few seconds apart). Waiting = queue + taken.
     * The waiting history is combined the same way (approximately: the highest per period).
     *
     * @returns null if no scheduler is available
     */
    summary() {
      const av = this.availableSchedulers;
      if (!av.length) return null;
      const sum = (f) => av.reduce((acc, s) => acc + f(s), 0);
      const known = (f) => av.map(f).filter((v) => v !== null);
      const pendings = known((s) => s.stat.pending);
      const dbRunnings = known((s) => s.stat.dbRunning);
      const capacities = known((s) => s.stat.capacity);
      const running = sum((s) => s.stat.running);
      const scheduled = sum((s) => s.stat.scheduled);
      const pending = pendings.length ? Math.max(...pendings) : null;
      // capacity is known only if every scheduler reports it
      const capacity =
        capacities.length === av.length
          ? capacities.reduce((a, b) => a + b, 0)
          : null;
      return {
        running,
        scheduled,
        pending,
        waiting: pending === null ? null : pending + scheduled,
        dbRunning: dbRunnings.length ? Math.max(...dbRunnings) : null,
        capacity,
        load: capacity
          ? Math.round((100 * running) / capacity)
          : Math.max(...av.map((s) => s.stat.currentLoad)),
        processed: sum((s) => s.stat.processed),
        finished: sum((s) => s.stat.finished),
        failed: sum((s) => s.stat.failed),
        draining: av.filter((s) => s.stat.draining).length,
        history: {
          running120m: combineSeries(av.map((s) => s.history.running120m)),
          waiting120m: combineSeries(
            av.map((s) => s.history.waiting120m),
            Math.max
          ),
          periodStart120m: Math.max(
            ...av.map((s) => s.history.periodStart120m)
          ),
          periodLength120m: av[0].history.periodLength120m,
        },
      };
    },
  },

  actions: {
    /** Fetch the statistics of all schedulers; never throws (the reason of a failure goes to `error`). */
    async update() {
      if (this.updating) return; // the previous request has not finished yet
      this.updating = true;
      try {
        const response = await fetch(
          process.env.MUPIF_API_URL + "/scheduler-status2/"
        );
        if (response.status != 200) {
          this.error = `scheduler-status2: HTTP ${response.status}`;
          return;
        }
        const answer = await response.json();
        if (!Array.isArray(answer)) {
          this.error = "scheduler-status2: unexpected answer";
          return;
        }
        this.schedulers = answer.map(normaliseScheduler);
        this.error = null;
        this.lastUpdate = new Date();
      } catch (e) {
        this.error = `scheduler-status2: ${e}`;
      } finally {
        this.updating = false;
      }
    },
    /** Choose the scheduler shown in detail (by its nameserver name). */
    select(name) {
      this.selected = name;
    },
  },
});
