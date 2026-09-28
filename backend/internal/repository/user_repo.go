package repository

import (
	"errors"

	"github.com/f18charles/piggy-bank/backend/internal/models"
	"github.com/f18charles/piggy-bank/backend/internal/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{
		db: db,
	}
}

// CreateUser inserts a new user record into the database.
func (ur *UserRepository) CreateUser(user *models.User) error {
	result := ur.db.Create(user)
	return result.Error
}

// GetUserByEmail looks up a user by email. Returns utils.ErrNotFound when
// the user does not exist.
func (ur *UserRepository) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	result := ur.db.Where("email = ?", email).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, utils.ErrNotFound
		}
		return nil, result.Error
	}
	return &user, nil
}

// GetUserByID retrieves a user by UUID, returning utils.ErrNotFound when
// not present.
func (ur *UserRepository) GetUserByID(id uuid.UUID) (*models.User, error) {
	var user models.User
	result := ur.db.Where("id = ?", id).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, utils.ErrNotFound
		}
		return nil, result.Error
	}
	return &user, nil
}

// UpdateUser updates an existing user record in the database.
func (ur *UserRepository) UpdateUser(user *models.User) error {
	result := ur.db.Save(user)
	return result.Error
}

// ListUsers returns every user. Used only by the background scheduler to
// iterate snapshots/recurring jobs; never expose this over the API.
func (ur *UserRepository) ListUsers() ([]models.User, error) {
	users := []models.User{}
	if err := ur.db.Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}
