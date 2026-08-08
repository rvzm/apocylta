// test/helpers/tmux.js - thin wrapper for driving a TUI process inside a
// detached tmux session (start / sendKeys / capture / waitFor / kill).
import { execFileSync } from "node:child_process";

export function uniqueSessionName(prefix) {
  return `${prefix}-${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
}

export function tmuxSession(name) {
  function run(args) {
    return execFileSync("tmux", args, { encoding: "utf8" });
  }

  return {
    name,

    // command is a single shell command string (tmux hands it to the
    // default shell), e.g. "env DB_PATH=/tmp/x.sqlite node main.js". cwd is
    // explicit (not inherited) since tmux's session cwd otherwise depends on
    // where the tmux server itself first started, not this process's cwd.
    start(command, { width = 120, height = 40, cwd } = {}) {
      const args = ["new-session", "-d", "-s", name, "-x", String(width), "-y", String(height)];
      if (cwd) args.push("-c", cwd);
      args.push(command);
      run(args);
    },

    sendKeys(...keys) {
      run(["send-keys", "-t", name, ...keys]);
    },

    capture() {
      return run(["capture-pane", "-t", name, "-p"]);
    },

    // Polls capture() until pattern (string or RegExp) matches, or throws
    // with the last captured pane content for debuggability.
    async waitFor(pattern, timeoutMs = 5000) {
      const matches = (text) => (pattern instanceof RegExp ? pattern.test(text) : text.includes(pattern));
      const start = Date.now();
      let last = "";
      while (Date.now() - start < timeoutMs) {
        last = this.capture();
        if (matches(last)) return last;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      throw new Error(`Timed out waiting for ${pattern} in tmux session "${name}". Last capture:\n${last}`);
    },

    kill() {
      try {
        run(["kill-session", "-t", name]);
      } catch {
        // already gone - fine
      }
    },
  };
}
