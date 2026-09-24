package database

import (
	"context"
	"fmt"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	once sync.Once
	DB   *mongo.Database
)

// ConnectMongoDB establishes a MongoDB connection
func ConnectMongoDB(uri, dbName string) (*mongo.Database, error) {
	var err error
	once.Do(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		client, cErr := mongo.Connect(ctx, options.Client().ApplyURI(uri))
		if cErr != nil {
			err = fmt.Errorf("mongo connect: %w", cErr)
			return
		}

		pingCtx, pingCancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer pingCancel()
		if cErr = client.Ping(pingCtx, nil); cErr != nil {
			err = fmt.Errorf("mongo ping: %w", cErr)
			return
		}

		DB = client.Database(dbName)
		fmt.Printf("Connected to MongoDB: %s\n", dbName)
	})
	return DB, err
}

// GetDB returns the MongoDB database instance
func GetDB() *mongo.Database {
	return DB
}
