package auth

import (
	"errors"
	"time"

	"gorm.io/gorm"
)

type BlacklistedToken struct {
	JTI       string    `gorm:"primaryKey"`
	ExpiresAt time.Time `gorm:"index"`
}

var blacklist *gorm.DB

func InitRevocation(db *gorm.DB) {
	blacklist = db
	db.AutoMigrate(&BlacklistedToken{})
}

func RevokeRefreshToken(tokenString string) error {
	if blacklist == nil {
		return errors.New("revocation store not initialized")
	}

	claims, err := ValidateRefreshToken(tokenString)
	if err != nil {
		return nil
	}

	jti := claims.ID
	if jti == "" {
		return errors.New("token missing jti claim")
	}

	entry := &BlacklistedToken{
		JTI:       jti,
		ExpiresAt: claims.ExpiresAt.Time,
	}

	return blacklist.Create(entry).Error
}

func IsRevocked(jti string) bool {
	if blacklist == nil || jti == "" {
		return false
	}
	var count int64
	blacklist.Model(&BlacklistedToken{}).Where("jti = ? AND expires_at > ?", jti, time.Now()).Count(&count)
	return count > 0
}

func StartBlacklistPruner() {
	go func() {
		ticker := time.NewTicker(time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			if blacklist != nil {
				blacklist.Where("expires_at < ?", time.Now()).Delete(&BlacklistedToken{})
			}
		}
	}()
}
