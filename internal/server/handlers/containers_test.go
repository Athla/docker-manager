package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"mineServers/internal/service"

	"github.com/labstack/echo/v4"
)

func TestListContainersHandler_ReturnsErrorWithoutDocker(t *testing.T) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/containers", nil)
	rec := httptest.NewRecorder()
	ctx := e.NewContext(req, rec)

	handler := &ContainerHandler{svc: service.NewContainerService(nil)}

	err := handler.ListContainersHandler(ctx)
	if err == nil {
		t.Errorf("expected error when Docker is not available, got nil")
	}
	if rec.Code != http.StatusInternalServerError {
		t.Errorf("expected status 500, got %d", rec.Code)
	}
}
