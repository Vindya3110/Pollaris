package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"pollaris/internal/database"
	"pollaris/internal/models"
	"pollaris/internal/repository"
	"pollaris/internal/services"
	"pollaris/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// --- Auth Handlers ---

// Register creates a new user account
func Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{Error: "Invalid input: " + err.Error()})
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))

	// Check if user exists
	_, err := repository.FindUserByEmail(c, email)
	if err == nil {
		c.JSON(http.StatusConflict, models.APIError{Error: "Email already registered"})
		return
	}

	// Hash password
	hashed, err := utils.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{Error: "Internal error"})
		return
	}

	user := models.User{
		Email:     email,
		Password:  hashed,
		Name:      strings.TrimSpace(req.Name),
		CreatedAt: time.Now(),
	}

	if err := repository.CreateUser(c, &user); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{Error: "Failed to create account"})
		return
	}

	token, _ := utils.GenerateToken(user.ID.Hex(), user.Email, user.Name)

	c.JSON(http.StatusCreated, models.AuthResponse{
		Token: token,
		User: models.UserInfo{
			ID:    user.ID.Hex(),
			Email: user.Email,
			Name:  user.Name,
		},
	})
}

// Login authenticates a user
func Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{Error: "Invalid input: " + err.Error()})
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	user, err := repository.FindUserByEmail(c, email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.APIError{Error: "Invalid email or password"})
		return
	}

	if err := utils.CheckPassword(user.Password, req.Password); err != nil {
		c.JSON(http.StatusUnauthorized, models.APIError{Error: "Invalid email or password"})
		return
	}

	token, _ := utils.GenerateToken(user.ID.Hex(), user.Email, user.Name)

	c.JSON(http.StatusOK, models.AuthResponse{
		Token: token,
		User: models.UserInfo{
			ID:    user.ID.Hex(),
			Email: user.Email,
			Name:  user.Name,
		},
	})
}

// GoogleAuthRequest body for Google OAuth
type googleIDTokenPayload struct {
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	EmailVerified string `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	Aud           string `json:"aud"`
	Iss           string `json:"iss"`
	Exp           string `json:"exp"`
}

// GoogleAuth verifies a Google ID token and logs in / registers the user.
// Uses Google's public tokeninfo endpoint to verify token signature & claims.
// In production, switch to JWT verification via Google's public keys (googleidtoken verifier)
// but tokeninfo is simple and works for this scope.
func GoogleAuth(c *gin.Context) {
	var req models.GoogleAuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{Error: "Invalid request: " + err.Error()})
		return
	}

	idToken := strings.TrimSpace(req.IDToken)
	if idToken == "" {
		c.JSON(http.StatusBadRequest, models.APIError{Error: "Missing idToken"})
		return
	}

	// Verify token with Google tokeninfo endpoint
	httpClient := &http.Client{Timeout: 6 * time.Second}
	resp, err := httpClient.Get("https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.APIError{Error: "Failed to verify Google token"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		c.JSON(http.StatusUnauthorized, models.APIError{Error: "Invalid Google token"})
		return
	}

	var payload googleIDTokenPayload
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{Error: "Failed to parse Google token"})
		return
	}

	if payload.Email == "" || payload.Sub == "" {
		c.JSON(http.StatusUnauthorized, models.APIError{Error: "Google token missing required fields"})
		return
	}

	// Strict checks
	if payload.Iss != "https://accounts.google.com" && payload.Iss != "accounts.google.com" {
		c.JSON(http.StatusUnauthorized, models.APIError{Error: "Invalid token issuer"})
		return
	}
	if payload.EmailVerified != "true" {
		c.JSON(http.StatusUnauthorized, models.APIError{Error: "Google email not verified"})
		return
	}

	email := strings.ToLower(strings.TrimSpace(payload.Email))
	name := strings.TrimSpace(payload.Name)
	if name == "" {
		name = strings.Split(email, "@")[0]
	}

	// Find or create user (link by email)
	user, err := repository.FindUserByEmail(c, email)
	if err != nil {
		// user doesn't exist - create with random password (they'll use Google to login)
		newUser := models.User{
			Email:        email,
			Password:     "", // empty — google-only account
			Name:         name,
			AuthProvider: "google",
			GoogleID:     payload.Sub,
			Picture:      payload.Picture,
			CreatedAt:    time.Now(),
		}
		if err := repository.CreateUser(c, &newUser); err != nil {
			// race: another request created between find-and-create
			user, err = repository.FindUserByEmail(c, email)
			if err != nil {
				c.JSON(http.StatusInternalServerError, models.APIError{Error: "Failed to create user"})
				return
			}
		} else {
			user = &newUser
		}
	} else {
		// Update google info if not present
		if user.GoogleID == "" {
			repository.UpdateUserGoogleInfo(c, user.ID.Hex(), payload.Sub, payload.Picture)
			user.GoogleID = payload.Sub
			user.Picture = payload.Picture
		}
	}

	token, _ := utils.GenerateToken(user.ID.Hex(), user.Email, user.Name)
	c.JSON(http.StatusOK, models.GoogleAuthResponse{
		Token: token,
		User: models.UserInfo{
			ID:    user.ID.Hex(),
			Email: user.Email,
			Name:  user.Name,
		},
	})
}

// Me returns the current user's info
func Me(c *gin.Context) {
	userID := c.GetString("userId")
	email := c.GetString("email")
	name := c.GetString("userName")

	c.JSON(http.StatusOK, models.UserInfo{
		ID:    userID,
		Email: email,
		Name:  name,
	})
}

// --- Poll Handlers ---

// CreatePoll creates a new poll
func CreatePoll(c *gin.Context) {
	var req models.CreatePollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{Error: "Invalid input: " + err.Error()})
		return
	}

	userID := c.GetString("userId")
	creatorOID, _ := primitive.ObjectIDFromHex(userID)

	question := strings.TrimSpace(req.Question)
	if len(question) < 3 || len(question) > 200 {
		c.JSON(http.StatusBadRequest, models.APIError{Error: "Question must be 3-200 characters"})
		return
	}

	if len(req.Options) < 2 {
		c.JSON(http.StatusBadRequest, models.APIError{Error: "At least 2 options required"})
		return
	}
	if len(req.Options) > 10 {
		c.JSON(http.StatusBadRequest, models.APIError{Error: "Maximum 10 options allowed"})
		return
	}

	options := make([]models.PollOption, len(req.Options))
	for i, text := range req.Options {
		trimmed := strings.TrimSpace(text)
		if trimmed == "" {
			c.JSON(http.StatusBadRequest, models.APIError{Error: "Options cannot be empty"})
			return
		}
		options[i] = models.PollOption{
			ID:    primitive.NewObjectID(),
			Text:  trimmed,
		}
	}

	poll := models.Poll{
		Question:  question,
		Options:   options,
		CreatedBy: creatorOID,
		CreatedAt: time.Now(),
		IsActive:  true,
	}

	if err := repository.CreatePoll(c, &poll); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{Error: "Failed to create poll"})
		return
	}

	// Initialize Redis counters for each option
	ctx := context.Background()
	for _, opt := range options {
		key := "poll:" + poll.ID.Hex() + ":opt:" + opt.ID.Hex()
		database.GetRedis().Set(ctx, key, "0", 0)
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":        poll.ID.Hex(),
		"question":  poll.Question,
		"options":   options,
		"createdAt": poll.CreatedAt,
		"isActive":  poll.IsActive,
	})
}

// GetPoll returns a single poll with live results
func GetPoll(c *gin.Context) {
	id := c.Param("id")
	poll, err := repository.FindPollByID(c, id)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIError{Error: "Poll not found"})
		return
	}

	results, total := services.GetPollResults(poll.ID.Hex(), poll.Options)

	// Check if THIS viewer has already voted
	voterID := c.GetHeader("X-Voter-Id")
	if voterID == "" {
		if cookieVal, err := c.Cookie(utils.VOTER_COOKIE_NAME); err == nil && cookieVal != "" {
			voterID = cookieVal
		}
	}

	userVoted := false
	if voterID != "" {
		userVoted, _ = services.HasVoted(poll.ID.Hex(), voterID)
	}

	// Hide results from viewers who haven't voted yet
	showResults := userVoted || total == 0
	displayResults := results
	if !showResults {
		// Return zeroed-out results so the UI shows nothing
		displayResults = make([]models.VoteResult, len(results))
		for i := range displayResults {
			displayResults[i] = models.VoteResult{
				ID:        results[i].ID,
				Text:      results[i].Text,
				VoteCount: 0,
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"pollId":        poll.ID.Hex(),
		"question":      poll.Question,
		"totalVotes":    total,
		"userVoted":     userVoted,
		"showResults":   showResults,
		"options":       displayResults,
		"isActive":      poll.IsActive,
		"createdAt":     poll.CreatedAt,
	})
}

// GetAllPolls returns all active polls with live results
func GetAllPolls(c *gin.Context) {
	polls, err := repository.FindAllActivePolls(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{Error: "Failed to fetch polls"})
		return
	}

	response := make([]models.PollResult, len(polls))
	for i, poll := range polls {
		results, total := services.GetPollResults(poll.ID.Hex(), poll.Options)
		response[i] = models.PollResult{
			PollID:     poll.ID.Hex(),
			Question:   poll.Question,
			IsActive:   poll.IsActive,
			TotalVotes: total,
			CreatedAt:  poll.CreatedAt,
			Options:    results,
		}
	}

	c.JSON(http.StatusOK, gin.H{"polls": response})
}

// GetMyPolls returns the current user's polls
func GetMyPolls(c *gin.Context) {
	userID := c.GetString("userId")
	polls, err := repository.FindPollsByUser(c, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{Error: "Failed to fetch polls"})
		return
	}

	response := make([]models.PollResult, len(polls))
	for i, poll := range polls {
		results, total := services.GetPollResults(poll.ID.Hex(), poll.Options)
		response[i] = models.PollResult{
			PollID:     poll.ID.Hex(),
			Question:   poll.Question,
			IsActive:   poll.IsActive,
			TotalVotes: total,
			CreatedAt:  poll.CreatedAt,
			Options:    results,
		}
	}

	c.JSON(http.StatusOK, gin.H{"polls": response})
}

// GetMyVotes returns polls that the current user has voted on
func GetMyVotes(c *gin.Context) {
	userID := c.GetString("userId")
	polls, err := repository.FindPollsVotedBy(c, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{Error: "Failed to fetch voted polls"})
		return
	}

	response := make([]models.PollResult, len(polls))
	for i, poll := range polls {
		results, total := services.GetPollResults(poll.ID.Hex(), poll.Options)
		response[i] = models.PollResult{
			PollID:     poll.ID.Hex(),
			Question:   poll.Question,
			IsActive:   poll.IsActive,
			TotalVotes: total,
			CreatedAt:  poll.CreatedAt,
			Options:    results,
		}
	}

	c.JSON(http.StatusOK, gin.H{"polls": response})
}

// Vote casts a vote on a poll
func Vote(c *gin.Context) {
	var req models.VoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{Error: "Invalid request"})
		return
	}

	pollID := strings.TrimSpace(req.PollID)
	optionID := strings.TrimSpace(req.OptionID)

	pollOID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{Error: "Invalid poll ID"})
		return
	}

	optOID, err := primitive.ObjectIDFromHex(optionID)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIError{Error: "Invalid option ID"})
		return
	}

	// Get and validate poll
	poll, err := repository.FindPollByID(c, pollID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIError{Error: "Poll not found"})
		return
	}
	if !poll.IsActive {
		c.JSON(http.StatusBadRequest, models.APIError{Error: "Poll is not active"})
		return
	}

	// Validate option belongs to poll
	validOption := false
	for _, opt := range poll.Options {
		if opt.ID == optOID {
			validOption = true
			break
		}
	}
	if !validOption {
		c.JSON(http.StatusBadRequest, models.APIError{Error: "Invalid option"})
		return
	}

	// Get voter ID from: X-Voter-Id header > cookie > IP+UA fallback
	voterID := c.GetHeader("X-Voter-Id")
	if voterID == "" {
		if cookieVal, err := c.Cookie(utils.VOTER_COOKIE_NAME); err == nil && cookieVal != "" {
			voterID = cookieVal
		} else {
			// Fallback: generate from IP + User-Agent
			ip := c.ClientIP()
			userAgent := c.GetHeader("User-Agent")
			voterID = utils.GenerateVoterID(ip, userAgent)
		}
	}

	// Check for duplicate vote
	hasVoted, _ := repository.HasUserVoted(c, pollID, voterID)
	if hasVoted {
		c.JSON(http.StatusConflict, models.APIError{Error: "You have already voted on this poll"})
		return
	}

	// Save vote to MongoDB
	vote := models.Vote{
		PollID:    pollOID,
		OptionID:  optOID,
		VoterID:   voterID,
		CreatedAt: time.Now(),
	}
	if err := repository.CreateVote(c, &vote); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{Error: "Failed to record vote"})
		return
	}

	// Record in Redis
	if err := services.RecordVote(pollID, optionID); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{Error: "Failed to record vote"})
		return
	}

	// Mark voter in Redis set
	if err := services.MarkVoted(pollID, voterID); err != nil {
		// Non-critical, continue
	}

	// Get updated results from Redis (live!)
	results, total := services.GetPollResults(pollID, poll.Options)

	// Broadcast to WebSocket clients
	services.BroadcastUpdate(pollID, gin.H{
		"pollId":     pollID,
		"totalVotes": total,
		"options":    results,
	})

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"totalVotes": total,
		"options":    results,
	})
}

// TogglePoll toggles a poll's active status
func TogglePoll(c *gin.Context) {
	pollID := c.Param("id")
	userID := c.GetString("userId")

	poll, err := repository.FindPollByID(c, pollID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIError{Error: "Poll not found"})
		return
	}

	creatorOID, _ := primitive.ObjectIDFromHex(userID)
	if poll.CreatedBy != creatorOID {
		c.JSON(http.StatusForbidden, models.APIError{Error: "You can only manage your own polls"})
		return
	}

	newStatus := !poll.IsActive
	if err := repository.UpdatePollActive(c, pollID, newStatus); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{Error: "Failed to update poll"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "isActive": newStatus})
}

// DeletePoll deletes a poll and all its votes (only by the creator)
func DeletePoll(c *gin.Context) {
	pollID := c.Param("id")
	userID := c.GetString("userId")

	poll, err := repository.FindPollByID(c, pollID)
	if err != nil {
		c.JSON(http.StatusNotFound, models.APIError{Error: "Poll not found"})
		return
	}

	creatorOID, _ := primitive.ObjectIDFromHex(userID)
	if poll.CreatedBy != creatorOID {
		c.JSON(http.StatusForbidden, models.APIError{Error: "You can only delete your own polls"})
		return
	}

	// Delete all votes for this poll from MongoDB
	pollOID, _ := primitive.ObjectIDFromHex(pollID)
	_, _ = database.GetDB().Collection("votes").DeleteMany(c, bson.M{"pollId": pollOID})

	// Delete the poll from MongoDB
	_, err = database.GetDB().Collection("polls").DeleteOne(c, bson.M{"_id": pollOID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIError{Error: "Failed to delete poll"})
		return
	}

	// Delete Redis counters and voter sets
	ctx := context.Background()
	optionKeys, _ := database.GetRedis().Keys(ctx, "poll:"+pollID+":opt:*").Result()
	if len(optionKeys) > 0 {
		_ = database.GetRedis().Del(ctx, optionKeys...)
	}
	_ = database.GetRedis().Del(ctx, "poll:"+pollID+":voters")

	// Notify all WebSocket clients watching this poll that it's gone
	services.BroadcastUpdate(pollID, gin.H{
		"type":      "poll_deleted",
		"pollId":    pollID,
		"success":   true,
		"message":   "This poll has been deleted",
		"totalVotes": 0,
		"options":   []models.VoteResult{},
	})

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Poll deleted"})
}

// --- WebSocket Handler ---

// ServeWS handles WebSocket connections for live updates
func ServeWS(c *gin.Context) {
	pollID := c.Query("pollId")
	if pollID == "" {
		c.JSON(http.StatusBadRequest, models.APIError{Error: "pollId query parameter required"})
		return
	}

	username := c.Query("username")
	if username == "" {
		if name, exists := c.Get("userName"); exists {
			username = name.(string)
		} else {
			username = "Anonymous"
		}
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	services.RegisterWS(conn, pollID)

	// Send welcome message
	conn.WriteJSON(models.WSMessage{Type: "welcome", Payload: "Connected to poll live updates"})

	// Keep connection alive - read messages
	go func() {
		defer services.UnregisterWS(conn)
		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				break
			}
		}
	}()
}
