package main

import (
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"pollaris/internal/database"
	"pollaris/internal/handlers"
	"pollaris/internal/middleware"
	"pollaris/internal/repository"
	"pollaris/internal/services"
	"pollaris/internal/utils"

	"github.com/gin-gonic/gin"
)

func main() {
	mongoURI := env("MONGO_URI", "mongodb://admin:password@localhost:27017/pollaris?authSource=admin&directConnection=true")
	redisAddr := env("REDIS_ADDR", "localhost:6379")
	redisPass := env("REDIS_PASSWORD", "")
	jwtSecret := env("JWT_SECRET", "")
	port := env("PORT", "8080")

	// Connect MongoDB
	mongoDB, err := database.ConnectMongoDB(mongoURI, "pollaris")
	if err != nil {
		log.Fatalf("MongoDB connection failed: %v", err)
	}
	_ = mongoDB

	// Init indexes
	repository.Init()
	repository.CreateUserIndexes()
	repository.CreatePollIndexes()
	repository.CreateVoteIndexes()

	// Connect Redis
	redisClient, err := database.ConnectRedis(redisAddr, redisPass, 0)
	if err != nil {
		log.Fatalf("Redis connection failed: %v", err)
	}
	defer database.GetRedis().Close()
	services.InitRedis(redisClient)

	// Init JWT
	utils.InitJWT(jwtSecret)

	// Router
	r := gin.Default()
	r.Use(middleware.CORSMiddleware())

	// Public auth
	auth := r.Group("/api/auth")
	{
		auth.POST("/register", registerHandler)
		auth.POST("/login", loginHandler)
		auth.POST("/google", googleAuthHandler)
		auth.GET("/me", middleware.AuthMiddleware(), meHandler)
	}

	// Public poll routes
	polls := r.Group("/api/polls")
	{
		polls.GET("", getAllPollsHandler)
		polls.GET("/:id", getPollHandler)
		polls.POST("/vote", voteHandler)
	}

	// Authenticated poll routes
	authPolls := r.Group("/api/polls")
	authPolls.Use(middleware.AuthMiddleware())
	{
		authPolls.POST("", createPollHandler)
		authPolls.GET("/my", getMyPollsHandler)
		authPolls.PUT("/:id/toggle", togglePollHandler)
	}

	// WebSocket
	r.GET("/ws", serveWSHandler)

	// Health
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Start
	go func() {
		log.Printf("Pollaris server starting on :%s", port)
		if err := r.Run(":" + port); err != nil {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down...")
}

func env(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

// Handler wrappers that cast to gin.HandlerFunc
var (
	registerHandler    = gin.HandlerFunc(handlers.Register)
	loginHandler       = gin.HandlerFunc(handlers.Login)
	googleAuthHandler   = gin.HandlerFunc(handlers.GoogleAuth)
	meHandler          = gin.HandlerFunc(handlers.Me)
	createPollHandler = gin.HandlerFunc(handlers.CreatePoll)
	getPollHandler   = gin.HandlerFunc(handlers.GetPoll)
	getAllPollsHandler = gin.HandlerFunc(handlers.GetAllPolls)
	getMyPollsHandler = gin.HandlerFunc(handlers.GetMyPolls)
	voteHandler      = gin.HandlerFunc(handlers.Vote)
	togglePollHandler = gin.HandlerFunc(handlers.TogglePoll)
	serveWSHandler   = gin.HandlerFunc(handlers.ServeWS)
)
