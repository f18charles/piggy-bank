package repository

import (
	"errors"

	"github.com/f18charles/piggy-bank/backend/internal/models"
	"github.com/f18charles/piggy-bank/backend/internal/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CategoryRepo struct {
	db *gorm.DB
}

func NewCategoryRepo(db *gorm.DB) *CategoryRepo {
	return &CategoryRepo{
		db: db,
	}
}

func (cr *CategoryRepo) CreateCategory(cat *models.Category) error {
	return cr.db.Create(cat).Error
}

func (cr *CategoryRepo) GetCategoryByID(id uuid.UUID) (*models.Category, error) {
	var cat models.Category
	result := cr.db.Where("id = ?", id).First(&cat)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, utils.ErrNotFound
		}
		return nil, result.Error
	}
	return &cat, nil
}

func (cr *CategoryRepo) UpdateCategory(cat *models.Category) error {
	return cr.db.Save(cat).Error
}

func (cr *CategoryRepo) ListCategory(user_id uuid.UUID) ([]models.Category, error) {
	cats := []models.Category{}
	results := cr.db.Where("is_default = true OR user_id = ?", user_id).Find(&cats)
	if results.Error != nil {
		return nil, results.Error
	}
	return cats, nil
}

func (cr *CategoryRepo) DeleteCategory(id uuid.UUID) error {
	result := cr.db.Delete(&models.Category{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	return nil
}
