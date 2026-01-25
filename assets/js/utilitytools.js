function debounceFx(fx, delay = 1000, { leading = false } = {}) {
    let timeout, // handle for the scheduled trailing call (or leading cooldown unlock)
        pending = false, // true while we're inside the debounce window
        lastArgs, lastThis; // latest call's args/this (used by trailing & flush)

    // The debounced function returned to the caller
    function wrapper(...args) {
        // Capture the latest call context & arguments whether fx has been fired or not
        lastArgs = args;
        lastThis = this;

        // Leading mode: fire immediately on the first call in a quiet period
        if (leading && !pending) {
            pending = true;

            // Call fx right away with the current context/args
            const result = fx.apply(lastThis, lastArgs);

            // Start a cooldown timer that simply unlocks the next leading call
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                pending = false;
            }, delay);

            return result;
        }

        // Trailing mode (default): schedule call for after `delay` ms
        clearTimeout(timeout);
        pending = true;
        timeout = setTimeout(invoke, delay);
    }

    // Cancel any pending execution and clear stored state
    wrapper.cancel = function () {
        clearTimeout(timeout);
        timeout = undefined;
        pending = false;
        lastArgs = lastThis = undefined;
    };

    // Immediately run the pending call (if any) with the latest args/this
    wrapper.flush = function () {
        if (pending) {
            clearTimeout(timeout);
            return invoke();
        }
    };

    // Actually call fx with the latest captured args/this, then clear state
    function invoke() {
        pending = false;
        const r = fx.apply(lastThis, lastArgs);
        lastArgs = lastThis = undefined;
        return r;
    }

    return wrapper;
}