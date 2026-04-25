// Package cache provides a simple in-memory cache with TTL for reducing
// database round-trips on frequently accessed, read-heavy endpoints.
package cache

import (
	"sync"
	"time"
)

// entry holds a cached value with its expiration time.
type entry struct {
	value     interface{}
	expiresAt time.Time
}

// Cache is a thread-safe, TTL-based in-memory cache.
type Cache struct {
	mu      sync.RWMutex
	items   map[string]entry
	defaultTTL time.Duration
}

// New creates a new Cache with the given default TTL.
func New(defaultTTL time.Duration) *Cache {
	c := &Cache{
		items:      make(map[string]entry),
		defaultTTL: defaultTTL,
	}

	// Background cleanup every 2 minutes
	go func() {
		ticker := time.NewTicker(2 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			c.cleanup()
		}
	}()

	return c
}

// Get retrieves a value from the cache. Returns nil and false if not found or expired.
func (c *Cache) Get(key string) (interface{}, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	item, exists := c.items[key]
	if !exists || time.Now().After(item.expiresAt) {
		return nil, false
	}

	return item.value, true
}

// Set stores a value in the cache with the default TTL.
func (c *Cache) Set(key string, value interface{}) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items[key] = entry{
		value:     value,
		expiresAt: time.Now().Add(c.defaultTTL),
	}
}

// SetWithTTL stores a value in the cache with a custom TTL.
func (c *Cache) SetWithTTL(key string, value interface{}, ttl time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items[key] = entry{
		value:     value,
		expiresAt: time.Now().Add(ttl),
	}
}

// Delete removes a specific key from the cache.
func (c *Cache) Delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.items, key)
}

// InvalidatePrefix removes all keys that start with the given prefix.
// Useful for invalidating related cache entries (e.g., all "courses:*" entries).
func (c *Cache) InvalidatePrefix(prefix string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	for key := range c.items {
		if len(key) >= len(prefix) && key[:len(prefix)] == prefix {
			delete(c.items, key)
		}
	}
}

// cleanup removes expired entries.
func (c *Cache) cleanup() {
	c.mu.Lock()
	defer c.mu.Unlock()

	now := time.Now()
	for key, item := range c.items {
		if now.After(item.expiresAt) {
			delete(c.items, key)
		}
	}
}
