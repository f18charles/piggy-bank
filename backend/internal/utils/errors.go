package utils

import "errors"

var (
	ErrNotFound              = errors.New("resource not found")
	ErrUnauthorized          = errors.New("unauthorized")
	ErrForbidden             = errors.New("forbidden")
	ErrBadRequest            = errors.New("bad request")
	ErrAlreadyExists         = errors.New("resource already exists")
	ErrGoalNotReached        = errors.New("goal has not reached its target amount yet")
	ErrInsufficientGoalFunds = errors.New("withdrawal amount exceeds the goal's current amount")
)
