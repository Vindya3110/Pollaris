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
	// Unique index on googleId (sparse so it only applies to Google users)
	_, _ = database.GetDB().Collection("users").Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "googleId", Value: 1}},
		Options: options.Index().SetUnique(true).SetSparse(true),
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

// FindUserByGoogleID finds a user by their Google sub claim
func FindUserByGoogleID(ctx context.Context, googleID string) (*models.User, error) {
	var user models.User
	if err := database.GetDB().Collection("users").FindOne(ctx, bson.M{"googleId": googleID}).Decode(&user); err != nil {
		return nil, err
	}
	return &user, nil
}

// UpdateUserGoogleInfo attaches google identity fields to an existing email/password user
func UpdateUserGoogleInfo(ctx context.Context, userID, googleID, picture string) error {
	oid, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}
	_, err = database.GetDB().Collection("users").UpdateOne(ctx,
		bson.M{"_id": oid},
		bson.M{"$set": bson.M{"googleId": googleID, "picture": picture}})
	return err
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

// FindPollsVotedBy returns all polls that a specific voter has voted on
func FindPollsVotedBy(ctx context.Context, voterID string) ([]models.Poll, error) {
	cursor, err := database.GetDB().Collection("votes").Find(ctx, bson.M{"voterId": voterID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var votes []models.Vote
	if err := cursor.All(ctx, &votes); err != nil {
		return nil, err
	}

	// Dedupe poll IDs
	seen := make(map[primitive.ObjectID]bool)
	pollIDs := []primitive.ObjectID{}
	for _, v := range votes {
		if !seen[v.PollID] {
			seen[v.PollID] = true
			pollIDs = append(pollIDs, v.PollID)
		}
	}

	if len(pollIDs) == 0 {
		return []models.Poll{}, nil
	}

	pollsCursor, err := database.GetDB().Collection("polls").Find(ctx, bson.M{"_id": bson.M{"$in": pollIDs}})
	if err != nil {
		return nil, err
	}
	defer pollsCursor.Close(ctx)

	var polls []models.Poll
	if err := pollsCursor.All(ctx, &polls); err != nil {
		return nil, err
	}
	return polls, nil
}

// GetVotesForPoll returns all votes for a given poll (used to rebuild Redis on restart)
func GetVotesForPoll(ctx context.Context, pollID string) ([]models.Vote, error) {
	pollOID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		return nil, err
	}
	cursor, err := database.GetDB().Collection("votes").Find(ctx, bson.M{"pollId": pollOID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var votes []models.Vote
	if err := cursor.All(ctx, &votes); err != nil {
		return nil, err
	}
	return votes, nil
}

// GetAllPollIDs returns IDs of all polls
func GetAllPollIDs(ctx context.Context) ([]string, error) {
	cursor, err := database.GetDB().Collection("polls").Find(ctx, bson.M{}, options.Find().SetProjection(bson.M{"_id": 1}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []struct {
		ID primitive.ObjectID `bson:"_id"`
	}
	if err := cursor.All(ctx, &results); err != nil {
		return nil, err
	}

	ids := make([]string, len(results))
	for i, r := range results {
		ids[i] = r.ID.Hex()
	}
	return ids, nil
}
