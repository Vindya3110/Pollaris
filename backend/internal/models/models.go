package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// User represents a registered user (email/password or Google OAuth)
type User struct {
	ID           primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Email        string             `json:"email" bson:"email"`
	Password     string             `json:"-" bson:"password,omitempty"` // omitted for Google users
	Name         string             `json:"name" bson:"name"`
	AuthProvider string             `json:"authProvider,omitempty" bson:"authProvider,omitempty"` // "email" | "google"
	GoogleID     string             `json:"-" bson:"googleId,omitempty"`
	Picture      string             `json:"picture,omitempty" bson:"picture,omitempty"`
	CreatedAt    time.Time          `json:"createdAt" bson:"createdAt"`
}

// Poll represents a poll
type Poll struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Question  string             `json:"question" bson:"question"`
	Options   []PollOption       `json:"options" bson:"options"`
	CreatedBy primitive.ObjectID `json:"createdBy" bson:"createdBy"`
	CreatedAt time.Time          `json:"createdAt" bson:"createdAt"`
	IsActive  bool               `json:"isActive" bson:"isActive"`
}

// PollOption is an option within a poll
type PollOption struct {
	ID    primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Text  string             `json:"text" bson:"text"`
}

// Vote represents a vote cast by a voter
type Vote struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	PollID    primitive.ObjectID `json:"pollId" bson:"pollId"`
	OptionID  primitive.ObjectID `json:"optionId" bson:"optionId"`
	VoterID   string             `json:"voterId" bson:"voterId"`
	CreatedAt time.Time          `json:"createdAt" bson:"createdAt"`
}

// WSMessage is a WebSocket message
type WSMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}
