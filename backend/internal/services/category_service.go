package services

import (
	"github.com/f18charles/piggy-bank/backend/internal/models"
	"github.com/f18charles/piggy-bank/backend/internal/repository"
	"github.com/f18charles/piggy-bank/backend/internal/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CategoryService struct {
	category_repo *repository.CategoryRepo
}

func NewCategoryService(db *gorm.DB) *CategoryService {
	return &CategoryService{
		category_repo: repository.NewCategoryRepo(db),
	}
}

type CategoryCreateRequest struct {
	Name  string `json:"name" binding:"required"`
	Type  string `json:"type" binding:"required"`
	Color string `json:"color" binding:"required"`
	Icon  string `json:"icon" binding:"required"`
}

type CategoryUpdateRequest struct {
	Name  string `json:"name"`
	Type  string `json:"type"`
	Color string `json:"color"`
	Icon  string `json:"icon"`
}

func (cs *CategoryService) CategoryCreate(user_id uuid.UUID, req CategoryCreateRequest) (*models.Category, error) {
	cat := &models.Category{
		UserID:    user_id,
		Name:      req.Name,
		Type:      req.Type,
		Color:     req.Color,
		Icon:      req.Icon,
		IsDefault: false,
	}
	if err := cs.category_repo.CreateCategory(cat); err != nil {
		return nil, err
	}
	return cat, nil
}

func (cs *CategoryService) CategoryUpdate(user_id, cat_id uuid.UUID, req CategoryUpdateRequest) (*models.Category, error) {
	cat, err := cs.category_repo.GetCategoryByID(cat_id)
	if err != nil {
		return nil, err
	}
	if cat.UserID != user_id {
		return nil, utils.ErrForbidden
	}
	if req.Name != "" {
		cat.Name = req.Name
	}
	if req.Type != "" {
		cat.Type = req.Type
	}
	if req.Color != "" {
		cat.Color = req.Color
	}
	if req.Icon != "" {
		cat.Icon = req.Icon
	}

	if err := cs.category_repo.UpdateCategory(cat); err != nil {
		return nil, err
	}
	return cat, nil
}

func (cs *CategoryService) CategoryDelete(user_id, cat_id uuid.UUID) error {
	cat, err := cs.category_repo.GetCategoryByID(cat_id)
	if err != nil {
		return err
	}
	if cat.UserID != user_id {
		return utils.ErrForbidden
	}
	return cs.category_repo.DeleteCategory(cat_id)
}

func (cs *CategoryService) CategoryList(user_id uuid.UUID) ([]models.Category, error) {
	cats, err := cs.category_repo.ListCategory(user_id)
	if err != nil {
		return nil, err
	}
	return cats, nil
}

func (cs *CategoryService) CategoryGet(user_id, cat_id uuid.UUID) (*models.Category, error) {
	cat, err := cs.category_repo.GetCategoryByID(cat_id)
	if err != nil {
		return nil, err
	}
	if !cat.IsDefault && cat.UserID != user_id {
		return nil, utils.ErrForbidden
	}
	return cat, nil
}
