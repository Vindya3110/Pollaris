package models

// RegisterRequest for user signup
type RegisterRequest struct {
	Name     string `json:"name" binding:"required,min=2,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6,max=100"`
}

// LoginRequest for user login
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// AuthResponse returned after login/register
type AuthResponse struct {
	Token string   `json:"token"`
	User  UserInfo `json:"user"`
}

// UserInfo is safe user info for responses
type UserInfo struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

// CreatePollRequest for creating a new poll
type CreatePollRequest struct {
	Question string   `json:"question" binding:"required,min=3,max=200"`
	Options  []string `json:"options" binding:"required,min=2,max=10,dive,required,min=1,max=100"`
}

// VoteRequest for casting a vote
type VoteRequest struct {
	PollID   string `json:"pollId" binding:"required"`
	OptionID string `json:"optionId" binding:"required"`
}

// VoteResult is an option with its vote count
type VoteResult struct {
	ID        string `json:"id"`
	Text      string `json:"text"`
	VoteCount int64  `json:"voteCount"`
}

// PollResult is the full poll with live results
type PollResult struct {
	PollID    string       `json:"pollId"`
	Question  string       `json:"question"`
	TotalVotes int64       `json:"totalVotes"`
	Options   []VoteResult `json:"options"`
}

// APIError is a standard error response
type APIError struct {
	Error   string `json:"error"`
	Success bool   `json:"success"`
}
