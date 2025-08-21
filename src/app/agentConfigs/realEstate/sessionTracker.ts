// Session tracker for managing AI agent usage limits
interface SessionData {
  searchCount: number;
  lastSearchTime: number;
  sessionId: string;
}

class SessionTracker {
  private sessions: Map<string, SessionData> = new Map();
  private readonly MAX_SEARCHES = 2;
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

  generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getSession(sessionId: string): SessionData | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Check if session has expired
    if (Date.now() - session.lastSearchTime > this.SESSION_TIMEOUT) {
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  createSession(sessionId: string): SessionData {
    const session: SessionData = {
      searchCount: 0,
      lastSearchTime: Date.now(),
      sessionId
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  incrementSearchCount(sessionId: string): { canSearch: boolean; remainingSearches: number } {
    let session = this.getSession(sessionId);
    
    if (!session) {
      session = this.createSession(sessionId);
    }

    session.searchCount++;
    session.lastSearchTime = Date.now();
    this.sessions.set(sessionId, session);

    const remainingSearches = Math.max(0, this.MAX_SEARCHES - session.searchCount);
    const canSearch = session.searchCount < this.MAX_SEARCHES;

    return { canSearch, remainingSearches };
  }

  getRemainingSearches(sessionId: string): number {
    const session = this.getSession(sessionId);
    if (!session) return this.MAX_SEARCHES;
    return Math.max(0, this.MAX_SEARCHES - session.searchCount);
  }

  resetSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastSearchTime > this.SESSION_TIMEOUT) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

export const sessionTracker = new SessionTracker();

// Clean up expired sessions every hour
setInterval(() => {
  sessionTracker.cleanupExpiredSessions();
}, 60 * 60 * 1000);
