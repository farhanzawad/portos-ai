import asyncio
from collections import deque
from datetime import datetime
from typing import List, Optional, AsyncGenerator, Set
from app.schemas.events import EventMessage, EventType
from app.db.base import DataStatusEnum


class InMemoryEventBus:
    """Thread-safe, asynchronous in-memory event broker with ring-buffer history."""

    def __init__(self, max_history: int = 200):
        self.max_history = max_history
        self._history: deque[EventMessage] = deque(maxlen=max_history)
        self._subscribers: Set[asyncio.Queue[EventMessage]] = set()
        self._counter: int = 0
        self._lock = asyncio.Lock()

    def generate_event_id(self) -> str:
        self._counter += 1
        ts = int(datetime.now().timestamp() * 1000)
        return f"evt_{ts}_{self._counter:04d}"

    async def publish(self, event: EventMessage) -> EventMessage:
        """Publishes an event to all connected subscriber queues and records in history."""
        # Append to circular ring buffer
        self._history.append(event)

        # Distribute to all active subscriber queues
        dead_queues = []
        for q in list(self._subscribers):
            try:
                q.put_nowait(event)
            except asyncio.QueueFull:
                dead_queues.append(q)
            except Exception:
                dead_queues.append(q)

        for dq in dead_queues:
            self._subscribers.discard(dq)

        return event

    def publish_sync(self, event: EventMessage) -> EventMessage:
        """Synchronous wrapper to publish from standard FastAPI thread pools."""
        self._history.append(event)
        dead_queues = []
        for q in list(self._subscribers):
            try:
                q.put_nowait(event)
            except asyncio.QueueFull:
                dead_queues.append(q)
            except Exception:
                dead_queues.append(q)

        for dq in dead_queues:
            self._subscribers.discard(dq)

        return event

    async def subscribe(self, since_id: Optional[str] = None) -> AsyncGenerator[EventMessage, None]:
        """Async generator yielding events. First replays history if since_id is provided, then streams live events."""
        q: asyncio.Queue[EventMessage] = asyncio.Queue(maxsize=100)
        self._subscribers.add(q)

        try:
            # Catch up from history if since_id is specified
            if since_id:
                history = self.get_history(since_id=since_id)
                for item in history:
                    yield item

            # Stream live events
            while True:
                event = await q.get()
                yield event
        finally:
            self._subscribers.discard(q)

    def get_history(self, limit: int = 50, since_id: Optional[str] = None) -> List[EventMessage]:
        """Retrieves events from ring buffer, optionally filtered after since_id."""
        events = list(self._history)
        if since_id:
            found_idx = -1
            for idx, e in enumerate(events):
                if e.id == since_id:
                    found_idx = idx
                    break
            if found_idx != -1:
                events = events[found_idx + 1:]

        return events[-limit:] if limit > 0 else events

    def get_last_event_id(self) -> Optional[str]:
        if self._history:
            return self._history[-1].id
        return None

    @property
    def active_subscribers_count(self) -> int:
        return len(self._subscribers)

    @property
    def history_count(self) -> int:
        return len(self._history)

    def clear(self):
        self._history.clear()


# Global Event Bus Singleton
event_bus = InMemoryEventBus()

