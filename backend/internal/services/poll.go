package services

import (
	"context"
	"encoding/json"
	"sync"
	"time"

	"pollaris/internal/models"
	"pollaris/internal/repository"

	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
)

var Rdb *redis.Client

// InitRedis sets the Redis client
func InitRedis(client *redis.Client) {
	Rdb = client
}

// WebSocket hub
type WSClient struct {
	Conn   *websocket.Conn
	PollID string
}

var clients = make(map[*websocket.Conn]string)
var mutex sync.Mutex

// RegisterWS registers a WebSocket connection
func RegisterWS(conn *websocket.Conn, pollID string) {
	mutex.Lock()
	clients[conn] = pollID
	mutex.Unlock()
}

// UnregisterWS removes a WebSocket connection
func UnregisterWS(conn *websocket.Conn) {
	mutex.Lock()
	delete(clients, conn)
	conn.Close()
	mutex.Unlock()
}

// BroadcastUpdate sends a message to all clients watching a specific poll
func BroadcastUpdate(pollID string, payload interface{}) {
	data, _ := json.Marshal(payload)
	msg := models.WSMessage{Type: "poll_update", Payload: json.RawMessage(data)}
	msgData, _ := json.Marshal(msg)

	mutex.Lock()
	defer mutex.Unlock()
	for conn, pid := range clients {
		if pid == pollID {
			if err := conn.WriteMessage(websocket.TextMessage, msgData); err != nil {
				conn.Close()
				delete(clients, conn)
			}
		}
	}
}

// RecordVote atomically records a vote in Redis
func RecordVote(pollID, optionID string) error {
	key := "poll:" + pollID + ":opt:" + optionID
	ctx := context.Background()
	pipe := Rdb.Pipeline()
	pipe.Incr(ctx, key)
	pipe.Expire(ctx, key, 24*time.Hour)
	_, err := pipe.Exec(ctx)
	return err
}

// HasVoted checks if a voter has already voted
func HasVoted(pollID, voterID string) (bool, error) {
	key := "poll:" + pollID + ":voters"
	ctx := context.Background()
	return Rdb.SIsMember(ctx, key, voterID).Result()
}

// MarkVoted marks a voter as having voted
func MarkVoted(pollID, voterID string) error {
	key := "poll:" + pollID + ":voters"
	ctx := context.Background()
	pipe := Rdb.Pipeline()
	pipe.SAdd(ctx, key, voterID)
	pipe.Expire(ctx, key, 24*time.Hour)
	_, err := pipe.Exec(ctx)
	return err
}

// GetPollResults gets live vote counts from Redis
func GetPollResults(pollID string, options []models.PollOption) ([]models.VoteResult, int64) {
	results := make([]models.VoteResult, len(options))
	var total int64
	ctx := context.Background()

	for i, opt := range options {
		key := "poll:" + pollID + ":opt:" + opt.ID.Hex()
		count, err := Rdb.Get(ctx, key).Int64()
		if err != nil {
			count = 0
		}
		results[i] = models.VoteResult{
			ID:        opt.ID.Hex(),
			Text:      opt.Text,
			VoteCount: count,
		}
		total += count
	}

	return results, total
}

// RebuildRedisFromMongo rebuilds Redis vote counters from MongoDB.
// Call this on startup after connecting to both MongoDB and Redis.
// This ensures live counts survive Redis restarts / container recreations.
func RebuildRedisFromMongo() error {
	ctx := context.Background()

	// Get all poll IDs
	pollIDs, err := repository.GetAllPollIDs(ctx)
	if err != nil {
		return err
	}

	rebuilt := 0
	for _, pollID := range pollIDs {
		// Load all votes for this poll from MongoDB
		votes, err := repository.GetVotesForPoll(ctx, pollID)
		if err != nil {
			continue
		}

		if len(votes) == 0 {
			continue
		}

		// Count votes per option
		optionCounts := make(map[string]int64)
		voterSet := make(map[string]bool)
		for _, v := range votes {
			optionCounts[v.OptionID.Hex()]++
			voterSet[v.VoterID] = true
		}

		// Write to Redis with a pipeline for speed
		pipe := Rdb.Pipeline()
		for optID, count := range optionCounts {
			key := "poll:" + pollID + ":opt:" + optID
			pipe.Set(ctx, key, count, 0) // no expiry — persistent
		}

		// Restore voter set
		voterKey := "poll:" + pollID + ":voters"
		for voterID := range voterSet {
			pipe.SAdd(ctx, voterKey, voterID)
		}
		pipe.Expire(ctx, voterKey, 0) // no expiry

		_, _ = pipe.Exec(ctx)
		rebuilt++
	}

	if rebuilt > 0 {
		println("[Redis] Rebuilt vote counts from MongoDB for", rebuilt, "poll(s)")
	}

	return nil
}
