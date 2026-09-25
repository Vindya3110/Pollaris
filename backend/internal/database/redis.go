package database

import (
	"context"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

var Rdb *redis.Client

// ConnectRedis establishes a Redis connection.
// If addr is a full URL (redis:// or rediss://), it parses it
// manually and configures TLS for rediss://.
// Otherwise it uses addr/password/db separately.
func ConnectRedis(addr, password string, db int) (*redis.Client, error) {
	opts := &redis.Options{}

	if strings.HasPrefix(addr, "redis://") || strings.HasPrefix(addr, "rediss://") {
		parsed, err := url.Parse(addr)
		if err != nil {
			return nil, fmt.Errorf("redis url parse: %w", err)
		}
		opts.Addr = parsed.Host
		if parsed.User != nil {
			opts.Password, _ = parsed.User.Password()
		}
		path := strings.TrimPrefix(parsed.Path, "/")
		if path != "" {
			var dbNum int
			if _, err := fmt.Sscanf(path, "%d", &dbNum); err == nil {
				opts.DB = dbNum
			}
		}
	} else {
		opts.Addr = addr
		opts.Password = password
		opts.DB = db
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
