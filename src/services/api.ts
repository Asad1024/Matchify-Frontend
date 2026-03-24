/**
 * Base API client for making HTTP requests
 */

import { nanoid } from "nanoid";
import {
  addMockGroupMembership,
  createMockUser,
  getMockData,
  removeMockGroupMembership,
  setCurrentUserId,
} from "@/lib/mockData";

// Get API base URL - use environment variable if set, otherwise relative URLs (for Vite proxy)
function getApiBaseUrl(): string {
  // If VITE_API_URL is set (in any environment), use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Otherwise, use relative URLs (Vite proxy will handle it in dev, or will fail in prod)
  return '';
}

// Helper to build full API URL
export function buildApiUrl(url: string): string {
  // If URL already includes protocol, use it as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  const baseUrl = getApiBaseUrl();
  // Remove trailing slash from baseUrl and leading slash from url to avoid double slashes
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  
  return baseUrl ? `${cleanBase}${cleanUrl}` : cleanUrl;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Handle mock user creation/registration
  if (method === 'POST' && url.includes('/api/auth/register')) {
    const userData = data as any;
    const newUser = createMockUser({
      username: userData.username || userData.email.split('@')[0],
      email: userData.email,
      name: userData.name,
      age: userData.age,
      location: userData.location,
      bio: userData.bio,
      avatar: userData.avatar,
      interests: userData.interests,
    });
    return new Response(JSON.stringify(newUser), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Handle mock login
  if (method === 'POST' && url.includes('/api/auth/login')) {
    const users = getMockData('/api/users') as any[];
    const credentials = data as { email: string; password: string };
    const user = users.find(u => u.email === credentials.email);
    if (user) {
      setCurrentUserId(user.id);
      return new Response(JSON.stringify(user), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    throw new Error('Invalid credentials');
  }

  // Handle mock POST create post (prepend so newest shows first)
  if (method === "POST" && (url === "/api/posts" || url.endsWith("/api/posts"))) {
    const body = data as { userId?: string; content?: string; images?: string[] };
    const posts = getMockData("/api/posts") as any[];
    const users = getMockData("/api/users") as any[];
    const uid = body.userId || users[0]?.id;
    const author = users.find((u: any) => u.id === uid) || users[0];
    const newPost = {
      id: nanoid(),
      userId: uid,
      authorId: uid,
      content: body.content || "",
      imageUrl: body.images?.[0],
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      user: author
        ? { name: author.name, avatar: author.avatar, verified: author.verified }
        : { name: "You", avatar: undefined, verified: false },
    };
    posts.unshift(newPost);
    return new Response(JSON.stringify(newPost), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Handle mock DELETE for posts
  if (method === 'DELETE' && /\/api\/posts\/[^/]+$/.test(url)) {
    const postId = url.split('/api/posts/')[1];
    const posts = getMockData('/api/posts') as any[];
    const index = posts.findIndex((p: any) => p.id === postId);
    if (index !== -1) {
      posts.splice(index, 1);
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Handle mock DELETE for comments
  if (method === 'DELETE' && /\/api\/comments\/[^/]+$/.test(url)) {
    const commentId = url.split('/api/comments/')[1];
    const posts = getMockData('/api/posts') as any[];
    for (const post of posts) {
      if (Array.isArray(post.comments)) {
        const idx = post.comments.findIndex((c: any) => c.id === commentId);
        if (idx !== -1) {
          post.comments.splice(idx, 1);
          break;
        }
      }
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Handle user updates
  if (method === 'PATCH' && url.includes('/api/users/')) {
    const userId = url.split('/api/users/')[1];
    const users = getMockData('/api/users') as any[];
    const user = users.find(u => u.id === userId);
    if (user) {
      const updatedUser = { ...user, ...(data as any) };
      const index = users.findIndex(u => u.id === userId);
      if (index !== -1) {
        users[index] = updatedUser;
      }
      return new Response(JSON.stringify(updatedUser), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    throw new Error('User not found');
  }

  try {
    // Build full URL using buildApiUrl helper
    const fullUrl = buildApiUrl(url);
    const res = await fetch(fullUrl, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    // If backend error, try to use mock data for GET requests
    if (!res.ok && (res.status === 500 || res.status === 503 || res.status === 502)) {
      if (method === 'GET') {
        const mockData = getMockData(url);
        return new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Network error - use mock data for GET requests
    if (method === 'GET') {
      const mockData = getMockData(url);
      return new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Offline / no backend: group join & leave (Community)
    if (method === 'POST' && (url === '/api/memberships' || url.endsWith('/api/memberships'))) {
      const body = data as { userId?: string; groupId?: string };
      const uid = body.userId;
      const gid = body.groupId;
      if (!uid || !gid) {
        return new Response(JSON.stringify({ message: 'Missing fields' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const groups = getMockData('/api/groups') as Array<{ id: string }>;
      if (!groups.some((g) => g.id === gid)) {
        return new Response(JSON.stringify({ message: 'Group not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const row = addMockGroupMembership(uid, gid);
      return new Response(JSON.stringify(row), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (method === 'DELETE' && /^\/api\/memberships\/[^/]+\/[^/]+$/.test(url)) {
      const parts = url.split('/api/memberships/')[1]?.split('/');
      const uid = parts?.[0];
      const gid = parts?.[1];
      if (uid && gid) removeMockGroupMembership(uid, gid);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    throw error;
  }
}

export async function apiRequestJson<T>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<T> {
  const res = await apiRequest(method, url, data);
  return res.json();
}

