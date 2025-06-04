package models

type ErrorResponse struct {
	Code    string `json:"code" example:"CONTAINER_NOT_FOUND"`
	Message string `json:"Message" example:"Container with ID aal12345 not found."`
	Details any    `json:"details"`
}

type SuccessResponse struct {
	Message string `json:"message" example:"Operation completed successfully"`
}
