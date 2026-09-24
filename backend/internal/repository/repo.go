package repository

import (
	"context"
	"time"

	"pollaris/internal/database"
	"pollaris/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Init is a no-op
func Init() {}

// CreateUserIndexes creates indexes on the users collection
func CreateUserIndexes() {
	ctx := context.Background()
	_, _ = database.GetDB().Collection("users").Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
}

// CreatePollIndexes creates indexes on the polls collection
func CreatePollIndexes() {
	ctx := context.Background()
	_, _ = database.GetDB().Collection("polls").Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "createdBy", Value: 1}},
	})
}

// CreateVoteIndexes creates indexes on the votes collection
func CreateVoteIndexes() {
	ctx := context.Background()
	_, _ = database.GetDB().Collection("votes").Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "pollId", Value: 1}, {Key: "voterId", Value: 1}},
	})
}

// CreateUser inserts a new user
func CreateUser(ctx context.Context, user *models.User) error {
	user.CreatedAt = time.Now()
	result, err := database.GetDB().Collection("users").InsertOne(ctx, user)
	if err != nil {
		return err
	}
	user.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

// FindUserByEmail finds a user by email
func FindUserByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	if err := database.GetDB().Collection("users").FindOne(ctx, bson.M{"email": email}).Decode(&user); err != nil {
		return nil, err
	}
	return &user, nil
}

// FindUserByID finds a user by ID
func FindUserByID(ctx context.Context, id string) (*models.User, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	var user models.User
	if err := database.GetDB().Collection("users").FindOne(ctx, bson.M{"_id": oid}).Decode(&user); err != nil {
		return nil, err
	}
	return &user, nil
}

// CreatePoll inserts a new poll
func CreatePoll(ctx context.Context, poll *models.Poll) error {
	poll.CreatedAt = time.Now()
	result, err := database.GetDB().Collection("polls").InsertOne(ctx, poll)
	if err != nil {
		return err
	}
	poll.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

// FindPollByID finds a poll by ID
func FindPollByID(ctx context.Context, id string) (*models.Poll, error) {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	var poll models.Poll
	if err := database.GetDB().Collection("polls").FindOne(ctx, bson.M{"_id": oid}).Decode(&poll); err != nil {
		return nil, err
	}
	return &poll, nil
}

// FindPollsByUser finds all polls created by a user
func FindPollsByUser(ctx context.Context, userID string) ([]models.Poll, error) {
	oid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}
	cursor, err := database.GetDB().Collection("polls").Find(ctx, bson.M{"createdBy": oid})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var polls []models.Poll
	if err := cursor.All(ctx, &polls); err != nil {
		return nil, err
	}
	return polls, nil
}

// FindAllActivePolls finds all active polls
func FindAllActivePolls(ctx context.Context) ([]models.Poll, error) {
	cursor, err := database.GetDB().Collection("polls").Find(ctx, bson.M{"isActive": true})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var polls []models.Poll
	if err := cursor.All(ctx, &polls); err != nil {
		return nil, err
	}
	return polls, nil
}

// UpdatePollActive updates the isActive field of a poll
func UpdatePollActive(ctx context.Context, id string, active bool) error {
	oid, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	_, err = database.GetDB().Collection("polls").UpdateOne(ctx, bson.M{"_id": oid}, bson.M{"$set": bson.M{"isActive": active}})
	return err
}

// HasUserVoted checks if a voter has already voted on a poll
func HasUserVoted(ctx context.Context, pollID, voterID string) (bool, error) {
	pollOID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		return false, err
	}
	count, err := database.GetDB().Collection("votes").CountDocuments(ctx, bson.M{"pollId": pollOID, "voterId": voterID})
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// CreateVote inserts a new vote
func CreateVote(ctx context.Context, vote *models.Vote) error {
	result, err := database.GetDB().Collection("votes").InsertOne(ctx, vote)
	if err != nil {
		return err
	}
	vote.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}
