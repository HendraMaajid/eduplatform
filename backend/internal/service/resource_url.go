package service

import (
	"net/url"
	"path"
	"strings"
)

func isSafeResourceURL(raw string) bool {
	if raw == "" {
		return true
	}
	if strings.HasPrefix(raw, "/uploads/") {
		cleaned := path.Clean(raw)
		return strings.HasPrefix(cleaned, "/uploads/") && !strings.Contains(raw, "..")
	}
	parsed, err := url.Parse(raw)
	if err != nil || parsed.Host == "" || parsed.User != nil {
		return false
	}
	return parsed.Scheme == "https" || parsed.Scheme == "http"
}
