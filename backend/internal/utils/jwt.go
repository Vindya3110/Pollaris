package utils

import (
	"crypto/md5"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

const VOTER_COOKIE_NAME = "pollaris_voter"

var jwtSecretKey []byte

// InitJWT sets the JWT signing key
func InitJWT(secret string) {
	if secret == "" {
		secret = "pollaris-jwt-secret-change-in-production"
	}
	jwtSecretKey = []byte(secret)
}

// Claims represents JWT claims
type Claims struct {
	UserID string `json:"userId"`
	Email  string `json:"email"`
	Name   string `json:"name"`
	jwt.RegisteredClaims
}

// GenerateToken creates a signed JWT
func GenerateToken(userID, email, name string) (string, error) {
	claims := &Claims{
		UserID: userID,
		Email:  email,
		Name:   name,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "pollaris",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecretKey)
}

// ValidateToken validates a JWT token
func ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		return jwtSecretKey, nil
	})
	if err != nil {
		return nil, err
	}
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}
	return nil, fmt.Errorf("invalid token")
}

// HashPassword hashes a password
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// CheckPassword checks a password against its hash
func CheckPassword(hashed, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashed), []byte(password))
}

// GenerateVoterID creates a voter ID from IP + User-Agent (kept for backward compat)
func GenerateVoterID(ip, userAgent string) string {
	raw := strings.TrimSpace(ip) + "|" + strings.TrimSpace(userAgent)
	hash := md5.Sum([]byte(raw))
	return fmt.Sprintf("voter_%x", hash[:8])
}

// GenerateRandomVoterID creates a random voter ID for cookie-based tracking
func GenerateRandomVoterID() string {
	return fmt.Sprintf("voter_%x", md5.Sum([]byte(fmt.Sprintf("%d", time.Now().UnixNano()))))
}
