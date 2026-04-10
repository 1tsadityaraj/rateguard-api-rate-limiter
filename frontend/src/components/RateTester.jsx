import { useState } from "react";
import {
  HiOutlineLightningBolt,
  HiOutlineBeaker,
  HiOutlinePlay,
  HiOutlineStop,
  HiOutlineCheck,
  HiOutlineX,
} from "react-icons/hi";
import toast from "react-hot-toast";
import { testSlidingWindow, testTokenBucket } from "../services/api";

/**
 * Interactive rate limiter tester — lets users fire requests at both
 * sliding-window and token-bucket endpoints to see rate limiting in action.
 */
export default function RateTester() {
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);
  const [burstCount, setBurstCount] = useState(10);
  const [algorithm, setAlgorithm] = useState("sliding-window");

  const addResult = (entry) => {
    setResults((prev) => [entry, ...prev].slice(0, 100));
  };

  const fireRequest = async (algo) => {
    const start = Date.now();
    try {
      const fn = algo === "token-bucket" ? testTokenBucket : testSlidingWindow;
      await fn();
      addResult({
        id: Date.now(),
        algorithm: algo,
        status: 200,
        time: Date.now() - start,
        success: true,
      });
    } catch (err) {
      const status = err.response?.status || 500;
      addResult({
        id: Date.now(),
        algorithm: algo,
        status,
        time: Date.now() - start,
        success: false,
        message: err.response?.data?.message || err.message,
      });
    }
  };

  const handleBurst = async () => {
    setRunning(true);
    toast(`Firing ${burstCount} requests via ${algorithm}...`, { icon: "🚀" });

    const promises = [];
    for (let i = 0; i < burstCount; i++) {
      // Stagger requests slightly to avoid browser throttling
      promises.push(
        new Promise((resolve) => {
          setTimeout(async () => {
            await fireRequest(algorithm);
            resolve();
          }, i * 50);
        })
      );
    }

    await Promise.all(promises);
    setRunning(false);
    toast.success("Burst complete");
  };

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="glass rounded-2xl border border-white/5 p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <HiOutlineBeaker className="w-4 h-4 text-accent-purple" />
          Rate Limiter Tester
        </h3>
        <p className="text-xs text-dark-400 mb-4">
          Fire rapid requests at the rate-limited endpoints to see the limiter in action.
          Watch the dashboard update in real-time.
        </p>

        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-dark-400 mb-1.5">Algorithm</label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-sm text-white focus:outline-none focus:border-accent-cyan/40 transition-all cursor-pointer"
            >
              <option value="sliding-window">Sliding Window</option>
              <option value="token-bucket">Token Bucket</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-dark-400 mb-1.5">Burst Size</label>
            <select
              value={burstCount}
              onChange={(e) => setBurstCount(Number(e.target.value))}
              className="px-4 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-sm text-white focus:outline-none focus:border-accent-cyan/40 transition-all cursor-pointer"
            >
              <option value={5}>5 requests</option>
              <option value={10}>10 requests</option>
              <option value={25}>25 requests</option>
              <option value={50}>50 requests</option>
              <option value={100}>100 requests</option>
            </select>
          </div>
          <button
            onClick={handleBurst}
            disabled={running}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-blue text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer"
          >
            {running ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Firing...
              </>
            ) : (
              <>
                <HiOutlinePlay className="w-4 h-4" />
                Fire Burst
              </>
            )}
          </button>
          <button
            onClick={() => fireRequest(algorithm)}
            disabled={running}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-dark-700 border border-white/10 text-white text-sm font-medium hover:bg-dark-600 disabled:opacity-40 transition-all cursor-pointer"
          >
            <HiOutlineLightningBolt className="w-4 h-4" />
            Single
          </button>
          {results.length > 0 && (
            <button
              onClick={() => setResults([])}
              className="flex items-center gap-1 px-3 py-2.5 text-xs text-dark-400 hover:text-white transition-colors cursor-pointer"
            >
              <HiOutlineStop className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      {results.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="glass rounded-2xl border border-white/5 p-4 text-center">
            <p className="text-2xl font-bold text-white">{results.length}</p>
            <p className="text-xs text-dark-400 mt-0.5">Total Sent</p>
          </div>
          <div className="glass rounded-2xl border border-success/20 p-4 text-center">
            <p className="text-2xl font-bold text-success">{successCount}</p>
            <p className="text-xs text-dark-400 mt-0.5">Allowed</p>
          </div>
          <div className="glass rounded-2xl border border-danger/20 p-4 text-center">
            <p className="text-2xl font-bold text-danger">{failCount}</p>
            <p className="text-xs text-dark-400 mt-0.5">Rate Limited</p>
          </div>
        </div>
      )}

      {/* Results Feed */}
      {results.length > 0 && (
        <div className="glass rounded-2xl border border-white/5 p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Request Log</h3>
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {results.map((r) => (
              <div
                key={r.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-colors ${
                  r.success
                    ? "bg-success/5 hover:bg-success/10"
                    : "bg-danger/5 hover:bg-danger/10"
                }`}
              >
                {r.success ? (
                  <HiOutlineCheck className="w-3.5 h-3.5 text-success shrink-0" />
                ) : (
                  <HiOutlineX className="w-3.5 h-3.5 text-danger shrink-0" />
                )}
                <span
                  className={`font-mono font-semibold ${
                    r.success ? "text-success" : "text-danger"
                  }`}
                >
                  {r.status}
                </span>
                <span className="text-dark-300 capitalize">{r.algorithm}</span>
                <span className="text-dark-500 ml-auto tabular-nums">{r.time}ms</span>
                {r.message && (
                  <span className="text-dark-400 truncate max-w-[200px]">
                    {r.message}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
