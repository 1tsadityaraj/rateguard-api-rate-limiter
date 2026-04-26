import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchStats,
  fetchTopUsers,
  fetchBlockedUsers,
  fetchAlerts,
  fetchHealth,
} from "../services/api";
import { getSocket } from "../services/socket";

/**
 * Custom hook that manages all dashboard data.
 * Polls REST endpoints every 10s and listens for Socket.io events
 * for real-time updates between polls.
 */
export function useDashboardData() {
  const [stats, setStats] = useState(null);
  const [topUsers, setTopUsers] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [health, setHealth] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  const maxRecentLogs = 50;
  const pollInterval = 10_000;
  const intervalRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const [statsData, topData, blockedData, alertsData, healthData] =
        await Promise.allSettled([
          fetchStats(),
          fetchTopUsers(),
          fetchBlockedUsers(),
          fetchAlerts(),
          fetchHealth(),
        ]);

      if (statsData.status === "fulfilled") setStats(statsData.value);
      if (topData.status === "fulfilled") setTopUsers(topData.value);
      if (blockedData.status === "fulfilled")
        setBlockedUsers(blockedData.value);
      if (alertsData.status === "fulfilled") setAlerts(alertsData.value);
      if (healthData.status === "fulfilled") setHealth(healthData.value);

      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Socket.io real-time listeners
  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    const handleNewRequest = (log) => {
      setRecentLogs((prev) => [log, ...prev].slice(0, maxRecentLogs));

      // Update stats counters in real-time
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          rpm: (prev.rpm || 0) + 1,
          rph: (prev.rph || 0) + 1,
          blocked: log.blocked ? (prev.blocked || 0) + 1 : prev.blocked,
        };
      });
    };

    const handleStatsUpdate = (data) => {
      setStats((prev) => ({
        ...prev,
        ...data,
      }));
    };

    const handleAlert = (alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 50));
    };

    const handleUserBlocked = () => {
      fetchBlockedUsers().then(setBlockedUsers).catch(() => {});
    };

    const handleUserUnblocked = () => {
      fetchBlockedUsers().then(setBlockedUsers).catch(() => {});
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("new-request", handleNewRequest);
    socket.on("stats-update", handleStatsUpdate);
    socket.on("alert", handleAlert);
    socket.on("user-blocked", handleUserBlocked);
    socket.on("user-unblocked", handleUserUnblocked);

    if (socket.connected) setConnected(true);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("new-request", handleNewRequest);
      socket.off("stats-update", handleStatsUpdate);
      socket.off("alert", handleAlert);
      socket.off("user-blocked", handleUserBlocked);
      socket.off("user-unblocked", handleUserUnblocked);
    };
  }, []);

  // Polling
  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, pollInterval);
    return () => clearInterval(intervalRef.current);
  }, [refresh]);

  return {
    stats,
    topUsers,
    blockedUsers,
    alerts,
    health,
    recentLogs,
    loading,
    error,
    connected,
    refresh,
  };
}
