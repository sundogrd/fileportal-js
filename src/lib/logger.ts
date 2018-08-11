

export default class Logger {
    static levels = ["error", "warn", "log", "info"];
    level: string = "warn";
    ns: string;
    constructor(ns) {
        this.ns = ns;
    }
    setLevel(newLevel) {
        this.level = newLevel
    }

    log(...args) {
        if (Logger.levels.indexOf('log') <= Logger.levels.indexOf(this.level)) {
            console.log(this.ns, ...args);
        }
    }
    info(...args) {
        if (Logger.levels.indexOf('info') <= Logger.levels.indexOf(this.level)) {
            console.info(this.ns, ...args);
        }
    }
    error(...args) {
        if (Logger.levels.indexOf('error') <= Logger.levels.indexOf(this.level)) {
            console.error(this.ns, ...args);
        }
    }
    warn(...args) {
        if (Logger.levels.indexOf('warn') <= Logger.levels.indexOf(this.level)) {
            console.warn(this.ns, ...args);
        }
    }
}
