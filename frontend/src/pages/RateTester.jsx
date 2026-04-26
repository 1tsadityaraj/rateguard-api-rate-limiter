import { useState, useRef, useCallback } from "react";
import { testSlidingWindow, testTokenBucket } from "../services/api";
import toast from "react-hot-toast";

/**
 * Rate Tester page — fire N requests to test endpoints and observe throttle behavior live.
 */
export default function RateTester() {
  const [config, setConfig] = useState({
    count: 20,
    algorithm: "sliding-window",
    delay: 50,
  });
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const abortRef = useRef(false);

  const runTest = useCallback(async () => {
    setRunning(true);
    setResults([]);
    setSummary(null);
    abortRef.current = false;

    const testFn =
      config.algorithm === "token-bucket" ? testTokenBucket : testSlidingWindow;

    const allResults = [];
    let successCount = 0;
    let rateLimitedCount = 0;

    toast(`Firing ${config.count} requests...`, { icon: "🚀" });

    for (let i = 0; i < config.count; i++) {
      if (abortRef.current) break;

      const start = performance.now();
      let result;

      try {
        const response = await testFn();
        const latency = Math.round(performance.now() - start);
        result = {
          id: i + 1,
          status: 200,
          latency,
          message: "OK",
          remaining: null,
        };
        successCount++;
      } catch (err) {
        const latency = Math.round(performance.now() - start);
        const status = err.response?.status || 500;
        const remaining = err.response?.headers?.["x-ratelimit-remaining"];
        result = {
          id: i + 1,
          status,
          latency,
          message:
            status === 429
              ? "Rate Limited"
              : err.response?.data?.error || "Error",
          remaining,
        };
        if (status === 429) rateLimitedCount++;
      }

      allResults.push(result);
      setResults([...allResults]);

      // Delay between requests
      if (config.delay > 0 && i < config.count - 1) {
        await new Promise((r) => setTimeout(r, config.delay));
      }
    }

    setSummary({
      total: allResults.length,
      success: successCount,
      rateLimited: rateLimitedCount,
      avgLatency: Math.round(
        allResults.reduce((s, r) => s + r.latency, 0) / allResults.length
      ),
    });

    setRunning(false);
    toast.success("Test complete!");
  }, [config]);

  const stopTest = () => {
    abortRef.current = true;
    setRunning(false);
  };

  const getStatusColor = (status) => {
    if (status === 200) return "text-success";
    if (status === 429) return "text-warning";
    return "text-danger";
  };

  const getStatusBg = (status) => {
    if (status === 200) return "bg-success/15 text-success";
    if (status === 429) return "bg-warning/15 text-warning";
    return "bg-danger/15 text-danger";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Rate Tester
        </h1>
        <p className="text-sm text-dark-400 mt-0.5">
          Fire requests to test rate limiting behavior in real time
        </p>
      </div>

      {/* Config Panel */}
      <div className="glass rounded-2xl border border-white/[0.06] p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-[10px] text-dark-400 uppercase tracking-wider font-semibold mb-1.5 block">
              Number of Requests
            </label>
            <input
              type="number"
              min="1"
              max="500"
              value={config.count}
              onChange={(e) =>
                setConfig({ ...config, count: parseInt(e.target.value) || 1 })
              }
              className="w-full px-3 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-accent-indigo/40 transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] text-dark-400 uppercase tracking-wider font-semibold mb-1.5 block">
              Algorithm
            </label>
            <select
              value={config.algorithm}
              onChange={(e) =>
                setConfig({ ...config, algorithm: e.target.value })
              }
              className="w-full px-3 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-sm text-white focus:outline-none focus:border-accent-indigo/40 transition-colors cursor-pointer"
            >
              <option value="sliding-window">Sliding Window</option>
              <option value="token-bucket">Token Bucket</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-dark-400 uppercase tracking-wider font-semibold mb-1.5 block">
              Delay (ms)
            </label>
            <input
              type="number"
              min="0"
              max="5000"
              value={config.delay}
              onChange={(e) =>
                setConfig({ ...config, delay: parseInt(e.target.value) || 0 })
              }
              className="w-full px-3 py-2.5 rounded-xl bg-dark-800 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-accent-indigo/40 transition-colors"
            />
          </div>
          <div>
            {running ? (
              <button
                onClick={stopTest}
                className="w-full px-4 py-2.5 rounded-xl bg-danger/20 hover:bg-danger/30 border border-danger/30 text-danger text-xs font-semibold transition-all cursor-pointer"
              >
                ⏹ Stop Test
              </button>
            ) : (
              <button
                onClick={runTest}
                className="w-full px-4 py-2.5 rounded-xl bg-accent-indigo hover:bg-accent-indigo/90 text-white text-xs font-semibold transition-all cursor-pointer"
              >
                ▶ Run Test
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {running && (
          <div className="mt-4">
            <div className="w-full bg-dark-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-accent-indigo rounded-full transition-all duration-200"
                style={{
                  width: `${(results.length / config.count) * 100}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-dark-400 mt-1 font-mono">
              {results.length} / {config.count} requests sent
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-slide-up">
          <div className="glass rounded-xl border border-white/[0.06] p-4 text-center">
            <p className="text-[10px] text-dark-400 uppercase tracking-wider font-semibold">
              Total
            </p>
            <p className="text-2xl font-bold font-mono text-white mt-1">
              {summary.total}
            </p>
          </div>
          <div className="glass rounded-xl border border-success/20 p-4 text-center">
            <p className="text-[10px] text-success uppercase tracking-wider font-semibold">
              Success
            </p>
            <p className="text-2xl font-bold font-mono text-success mt-1">
              {summary.success}
            </p>
          </div>
          <div className="glass rounded-xl border border-warning/20 p-4 text-center">
            <p className="text-[10px] text-warning uppercase tracking-wider font-semibold">
              Rate Limited
            </p>
            <p className="text-2xl font-bold font-mono text-warning mt-1">
              {summary.rateLimited}
            </p>
          </div>
          <div className="glass rounded-xl border border-white/[0.06] p-4 text-center">
            <p className="text-[10px] text-dark-400 uppercase tracking-wider font-semibold">
              Avg Latency
            </p>
            <p className="text-2xl font-bold font-mono text-white mt-1">
              {summary.avgLatency}ms
            </p>
          </div>
        </div>
      )}

      {/* Results Feed */}
      {results.length > 0 && (
        <div className="glass rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">
              Response Log
            </h3>
            <span className="text-[10px] text-dark-400 font-mono">
              {results.length} responses
            </span>
          </div>
          <div className="max-h-[400px] overflow-y-auto divide-y divide-white/[0.03]">
            {results.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-4 px-5 py-2 hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-[10px] text-dark-500 font-mono w-8">
                  #{r.id}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${getStatusBg(
                    r.status
                  )}`}
                >
                  {r.status}
                </span>
                <span className={`text-xs font-medium ${getStatusColor(r.status)}`}>
                  {r.message}
                </span>
                <span className="text-[10px] text-dark-500 font-mono ml-auto">
                  {r.latency}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
