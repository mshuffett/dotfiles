// fetch-contacts.go
// Fetches contact info for batch members from WhatsApp servers
// Uses the existing wacli session

package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	_ "github.com/mattn/go-sqlite3"
	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	waLog "go.mau.fi/whatsmeow/util/log"
)

var presenceResults = make(map[string]string)

func main() {
	// Read phone numbers from founders.txt
	data, err := os.ReadFile("/Users/michael/clawd-founders/founders.txt")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error reading founders.txt: %v\n", err)
		os.Exit(1)
	}

	var phones []string
	for _, line := range strings.Split(string(data), "\n") {
		phone := strings.TrimSpace(strings.ReplaceAll(line, "+", ""))
		if phone != "" {
			phones = append(phones, phone)
		}
	}
	fmt.Printf("Loaded %d phone numbers\n", len(phones))

	// Open the wacli session database
	ctx := context.Background()
	dbLog := waLog.Stdout("Database", "ERROR", true)
	container, err := sqlstore.New(ctx, "sqlite3", "file:/Users/michael/.wacli/session.db?_foreign_keys=on", dbLog)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error opening session: %v\n", err)
		os.Exit(1)
	}

	deviceStore, err := container.GetFirstDevice(ctx)
	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Fprintf(os.Stderr, "No device found - run wacli auth first\n")
			os.Exit(1)
		}
		fmt.Fprintf(os.Stderr, "Error getting device: %v\n", err)
		os.Exit(1)
	}

	logger := waLog.Stdout("Client", "ERROR", true)
	client := whatsmeow.NewClient(deviceStore, logger)

	// Add event handler for presence and contact updates
	client.AddEventHandler(func(evt interface{}) {
		switch v := evt.(type) {
		case *events.Presence:
			// Presence event received - usually has LID, not useful for names
			// fmt.Printf("  [Presence] %s\n", v.From.User)
		case *events.PushName:
			// Push name update - this is what we want!
			if v.JID.User != "" && v.NewPushName != "" {
				fmt.Printf("  [PushName] %s -> %s\n", v.JID.User, v.NewPushName)
				presenceResults[v.JID.User] = v.NewPushName
			}
		case *events.Contact:
			// Contact update
			if v.JID.User != "" {
				fmt.Printf("  [Contact] %s -> %+v\n", v.JID.User, v.Action)
			}
		}
	})

	// Connect
	fmt.Println("Connecting to WhatsApp...")
	if err := client.Connect(); err != nil {
		fmt.Fprintf(os.Stderr, "Error connecting: %v\n", err)
		os.Exit(1)
	}
	defer client.Disconnect()

	// Wait for connection
	time.Sleep(2 * time.Second)

	if !client.IsConnected() {
		fmt.Fprintf(os.Stderr, "Failed to connect\n")
		os.Exit(1)
	}
	fmt.Println("Connected!")

	// Build JIDs for all phones
	var jids []types.JID
	for _, phone := range phones {
		jid := types.JID{User: phone, Server: types.DefaultUserServer}
		jids = append(jids, jid)
	}

	// Try GetUserInfo to fetch contact info from server
	fmt.Printf("Fetching user info for %d contacts...\n", len(jids))

	// Process in batches of 50 to avoid rate limits
	batchSize := 50
	results := make(map[string]string) // phone -> name

	for i := 0; i < len(jids); i += batchSize {
		end := i + batchSize
		if end > len(jids) {
			end = len(jids)
		}
		batch := jids[i:end]

		fmt.Printf("Processing batch %d-%d...\n", i+1, end)

		// GetUserInfo fetches from server
		infos, err := client.GetUserInfo(ctx, batch)
		if err != nil {
			fmt.Printf("  Error: %v\n", err)
		} else {
			for jid, info := range infos {
				name := ""
				if info.VerifiedName != nil {
					name = info.VerifiedName.Details.GetVerifiedName()
				}
				if name == "" {
					// Try to get from contact store
					contact, _ := client.Store.Contacts.GetContact(ctx, jid)
					if contact.Found {
						if contact.PushName != "" {
							name = contact.PushName
						} else if contact.FullName != "" {
							name = contact.FullName
						}
					}
				}
				if name != "" {
					results[jid.User] = name
					fmt.Printf("  %s -> %s\n", jid.User, name)
				}
			}
		}

		// Small delay between batches
		time.Sleep(500 * time.Millisecond)
	}

	// Send our own presence first (required to receive presence from others)
	fmt.Println("\nSending own presence...")
	_ = client.SendPresence(ctx, types.PresenceAvailable)

	// Subscribe to presence for unknowns
	unknownCount := 0
	for _, jid := range jids {
		if _, ok := results[jid.User]; !ok {
			unknownCount++
		}
	}
	fmt.Printf("Subscribing to presence for %d unknowns...\n", unknownCount)

	for _, jid := range jids {
		if _, ok := results[jid.User]; !ok {
			// Only subscribe if we don't already have info
			_ = client.SubscribePresence(ctx, jid)
			time.Sleep(50 * time.Millisecond) // Small delay to avoid rate limiting
		}
	}

	// Wait for presence updates to come in
	fmt.Println("Waiting for presence updates (10 seconds)...")
	time.Sleep(10 * time.Second)

	// Check contacts store again
	fmt.Println("\nChecking contact store after presence subscriptions...")
	for _, jid := range jids {
		if _, ok := results[jid.User]; ok {
			continue // Already have this one
		}
		contact, err := client.Store.Contacts.GetContact(ctx, jid)
		if err == nil && contact.Found {
			name := contact.PushName
			if name == "" {
				name = contact.FullName
			}
			if name != "" && name != "-" {
				results[jid.User] = name
				fmt.Printf("  %s -> %s\n", jid.User, name)
			}
		}
	}

	// Merge presenceResults into results
	for phone, name := range presenceResults {
		if _, ok := results[phone]; !ok {
			results[phone] = name
			fmt.Printf("  (from presence) %s -> %s\n", phone, name)
		}
	}

	// Output results
	fmt.Printf("\n=== RESULTS ===\n")
	fmt.Printf("Total identified: %d / %d\n", len(results), len(phones))

	// Save to JSON
	output, _ := json.MarshalIndent(results, "", "  ")
	os.WriteFile("/Users/michael/clawd-founders/data/fetched-contacts.json", output, 0644)
	fmt.Println("Saved to data/fetched-contacts.json")
}
