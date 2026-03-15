"""
In-memory SSE event bus. Maps user_id → set of asyncio.Queue.
Supports multiple tabs/devices per user (each gets its own queue).
"""

import asyncio
import json
from typing import Dict, Set
from utils.logging_config import error_logger


class EventBus:
    def __init__(self):
        self._subscribers: Dict[str, Set[asyncio.Queue]] = {}

    def subscribe(self, user_id: str) -> asyncio.Queue:
        """Register a new SSE listener for a user. Returns a Queue to await on."""
        q: asyncio.Queue = asyncio.Queue(maxsize=50)
        if user_id not in self._subscribers:
            self._subscribers[user_id] = set()
        self._subscribers[user_id].add(q)
        return q

    def unsubscribe(self, user_id: str, q: asyncio.Queue):
        """Remove a listener when the SSE connection closes."""
        subs = self._subscribers.get(user_id)
        if subs:
            subs.discard(q)
            if not subs:
                del self._subscribers[user_id]

    def publish(self, user_id: str, event_type: str, payload: dict = None):
        """Push an event to all connected listeners for a user. Non-blocking, fire-and-forget."""
        subs = self._subscribers.get(user_id)
        if not subs:
            return  # No one listening — skip
        message = json.dumps({"type": event_type, "payload": payload or {}})
        dead: list[asyncio.Queue] = []
        for q in subs:
            try:
                q.put_nowait(message)
            except asyncio.QueueFull:
                dead.append(q)
        # Drop slow consumers
        for q in dead:
            subs.discard(q)
            error_logger.warning(f"SSE queue full for user {user_id[:8]}…, dropped")

    def connected_count(self) -> int:
        return sum(len(s) for s in self._subscribers.values())


# Singleton — import this from anywhere
event_bus = EventBus()
