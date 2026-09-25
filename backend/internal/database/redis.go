package database

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

var Rdb *redis.Client

// ConnectRedis establishes a Redis connection.
// If addr is a full URL (redis:// or rediss://), it parses it
// using redis.ParseURL which handles TLS for rediss://.
// Otherwise it uses addr/password/db separately.
func ConnectRedis(addr, password string, db int) (*redis.Client, error) {
	var opts *redis.Options
	var err error

	// Check if addr is a full URL
	if len(addr) > 8 && (addr[:8] == "rediss://" || addr[:7] == "redis://") {
		opts, err = redis.ParseURL(addr)
		if err != nil {
			return nil, fmt.Errorf("redis url parse: %w", err)
		}
	} else {
		opts = &redis.Options{
			Addr:     addr,
			Password: password,
			DB:       db,
		}
	}

	Rdb = redis.NewClient(opts)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := Rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("redis connect: %w", err)
	}

	fmt.Printf("Connected to Redis: %s\n", addr)
	return Rdb, nil
}

// GetRedis returns the Redis client
func GetRedis() *redis.Client {
	return Rdb
}
