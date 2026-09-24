package database

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

var Rdb *redis.Client

// ConnectRedis establishes a Redis connection
func ConnectRedis(addr, password string, db int) (*redis.Client, error) {
	Rdb = redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})

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
