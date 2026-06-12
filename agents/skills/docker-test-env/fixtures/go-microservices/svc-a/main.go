package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	svcBURL := os.Getenv("SVC_B_URL")
	if svcBURL == "" {
		svcBURL = "http://svc-b:8081"
	}

	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"status":"ok","service":"svc-a"}`)
	})

	// Calls svc-b and returns combined response — tests inter-service DNS
	mux.HandleFunc("/ping-b", func(w http.ResponseWriter, r *http.Request) {
		resp, err := http.Get(svcBURL + "/health")
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			http.Error(w, fmt.Sprintf(`{"error":"%s"}`, err.Error()), http.StatusServiceUnavailable)
			return
		}
		defer resp.Body.Close()
		body, _ := io.ReadAll(resp.Body)
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"svc_a":"ok","svc_b":%s}`, string(body))
	})

	log.Printf("svc-a listening on :%s (SVC_B_URL=%s)", port, svcBURL)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
