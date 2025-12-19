# Watch History Integration Guide

This guide explains how to integrate the Watch History feature into video and podcast players.

## Overview

The Watch History feature tracks user viewing and listening progress, allowing users to:
- Resume where they left off
- View their watch/listen history
- See progress percentages for content
- Mark content as completed

## Database Schema

The `watch_history` table stores:
```prisma
model watch_history {
  id            String   @id @default(uuid())
  userId        String
  contentType   String   // 'video' or 'podcast'
  contentId     String
  contentTitle  String
  contentUrl    String
  thumbnail     String?
  duration      Int?     // Total duration in seconds
  position      Int      @default(0) // Current position in seconds
  completed     Boolean  @default(false)
  lastWatchedAt DateTime @default(now())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([userId, contentType, contentId])
}
```

## API Endpoints

### 1. Save/Update Watch Progress
**Endpoint:** `POST /api/watch-history/update`

**Body:**
```json
{
  "contentType": "video",  // or "podcast"
  "contentId": "video-123",
  "contentTitle": "How to Build a Startup",
  "contentUrl": "/video/how-to-build-a-startup",
  "thumbnail": "https://example.com/thumb.jpg",
  "duration": 1800,  // Total duration in seconds
  "position": 450,   // Current position in seconds
  "completed": false
}
```

**Response:**
```json
{
  "message": "Watch progress saved",
  "watchHistory": { /* watch history object */ }
}
```

### 2. Get User's Watch History
**Endpoint:** `GET /api/watch-history`

**Query Parameters:**
- `contentType` (optional): Filter by "video" or "podcast"
- `limit` (optional): Number of results (default: 20)
- `onlyInProgress` (optional): "true" to show only incomplete content

**Response:**
```json
{
  "watchHistory": [
    {
      "id": "uuid",
      "contentType": "video",
      "contentId": "video-123",
      "contentTitle": "How to Build a Startup",
      "progressPercent": 25
      // ... other fields
    }
  ],
  "total": 10
}
```

### 3. Get Specific Watch History Item
**Endpoint:** `GET /api/watch-history/[contentType]/[contentId]`

**Example:** `GET /api/watch-history/video/video-123`

**Response:**
```json
{
  "id": "uuid",
  "userId": "user-123",
  "contentType": "video",
  "contentId": "video-123",
  "position": 450,
  "progressPercent": 25,
  // ... other fields
}
```

### 4. Delete Watch History Item
**Endpoint:** `DELETE /api/watch-history/[contentType]/[contentId]`

## Integration Examples

### React Video Player Integration

```typescript
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export function VideoPlayer({ videoId, videoTitle, videoUrl, thumbnail, duration }) {
  const { data: session } = useSession();
  const [currentTime, setCurrentTime] = useState(0);
  const [savedPosition, setSavedPosition] = useState(0);

  // Load saved progress when component mounts
  useEffect(() => {
    if (session) {
      loadSavedProgress();
    }
  }, [session, videoId]);

  const loadSavedProgress = async () => {
    try {
      const res = await fetch(`/api/watch-history/video/${videoId}`);
      if (res.ok) {
        const data = await res.json();
        setSavedPosition(data.position);
        // Seek video player to saved position
        if (videoRef.current) {
          videoRef.current.currentTime = data.position;
        }
      }
    } catch (error) {
      console.log('No saved progress found');
    }
  };

  // Save progress periodically (every 10 seconds)
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      if (currentTime > 0) {
        saveProgress(currentTime);
      }
    }, 10000); // Save every 10 seconds

    return () => clearInterval(interval);
  }, [session, currentTime]);

  const saveProgress = async (position: number) => {
    const completed = position >= duration * 0.9; // Mark as completed if 90% watched

    try {
      await fetch('/api/watch-history/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: 'video',
          contentId: videoId,
          contentTitle: videoTitle,
          contentUrl: videoUrl,
          thumbnail,
          duration,
          position: Math.floor(position),
          completed,
        }),
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setCurrentTime(e.currentTarget.currentTime);
  };

  const handleEnded = () => {
    // Mark as completed when video ends
    saveProgress(duration);
  };

  return (
    <video
      ref={videoRef}
      onTimeUpdate={handleTimeUpdate}
      onEnded={handleEnded}
      controls
    >
      <source src={videoUrl} type="video/mp4" />
    </video>
  );
}
```

### Podcast Player Integration

```typescript
export function PodcastPlayer({ podcastId, podcastTitle, audioUrl, thumbnail, duration }) {
  const { data: session } = useSession();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);

  // Similar to video player, but use 'podcast' as contentType
  useEffect(() => {
    if (session) {
      loadSavedProgress();
    }
  }, [session, podcastId]);

  const loadSavedProgress = async () => {
    try {
      const res = await fetch(`/api/watch-history/podcast/${podcastId}`);
      if (res.ok) {
        const data = await res.json();
        if (audioRef.current) {
          audioRef.current.currentTime = data.position;
        }
      }
    } catch (error) {
      console.log('No saved progress found');
    }
  };

  const saveProgress = async (position: number) => {
    const completed = position >= duration * 0.9;

    try {
      await fetch('/api/watch-history/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: 'podcast',
          contentId: podcastId,
          contentTitle: podcastTitle,
          contentUrl: audioUrl,
          thumbnail,
          duration,
          position: Math.floor(position),
          completed,
        }),
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  // Rest of implementation similar to video player
}
```

## Best Practices

1. **Save Progress Periodically**: Save every 10-15 seconds during playback to avoid excessive API calls
2. **Save on Pause**: Always save when user pauses the player
3. **Save on Close**: Save progress when user navigates away (use `beforeunload` event)
4. **Mark as Completed**: Consider content "completed" when 90% or more has been watched
5. **Resume Prompt**: Show a prompt asking if user wants to resume from saved position
6. **Error Handling**: Gracefully handle cases where watch history isn't available (not logged in, API errors)

## User Interface

The watch history page is available at `/account/watch-history` and displays:
- All watched videos and podcasts
- Progress bars showing completion percentage
- Filters for videos, podcasts, and in-progress content
- Continue/Watch Again buttons
- Option to remove items from history

## Future Enhancements

Potential additions to consider:
- Watch history sync across devices
- Recommendations based on watch history
- Automatic cleanup of old watch history (>90 days)
- Analytics for content creators
- Watch time tracking and statistics
