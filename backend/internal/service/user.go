package service

import (
	"errors"

	"backend/internal/dto"
	"backend/internal/model"
	"backend/pkg/database"
	"golang.org/x/crypto/bcrypt"
)

func GetAllUsers(roleFilter string) ([]model.User, error) {
	var users []model.User
	query := database.DB.Model(&model.User{})
	if roleFilter != "" {
		query = query.Where("role = ?", roleFilter)
	}
	if err := query.Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

func CreateUser(req dto.CreateUserRequest) (*model.User, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := model.User{
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Role:         req.Role,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

func UpdateUser(id string, req dto.UpdateUserRequest) (*model.User, error) {
	var user model.User
	if err := database.DB.First(&user, "id = ?", id).Error; err != nil {
		return nil, errors.New("user not found")
	}

	updates := map[string]interface{}{}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Email != "" {
		updates["email"] = req.Email
	}
	if req.Role != "" {
		updates["role"] = req.Role
	}

	if err := database.DB.Model(&user).Updates(updates).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

func DeleteUser(id string) error {
	var user model.User
	if err := database.DB.First(&user, "id = ?", id).Error; err != nil {
		return errors.New("user not found")
	}

	if err := database.DB.Delete(&user).Error; err != nil {
		return err
	}

	return nil
}
