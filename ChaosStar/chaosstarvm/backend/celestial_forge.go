// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Celestial Forge - Native blockchain Star System and Planet management

package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

// StarSystem represents a star system (subnet) in the Celestial Forge
type StarSystem struct {
	ID              string                 `json:"id"`
	Name            string                 `json:"name"`
	SubnetID        string                 `json:"subnet_id"`
	OwnerWallet     string                 `json:"owner_wallet"`
	RPCURL          string                 `json:"rpc_url"`
	ChainID         uint64                 `json:"chain_id"`
	TributePercent  uint8                  `json:"tribute_percent"`
	Status          string                 `json:"status"` // active, deploying, inactive
	TreasuryBalance map[string]string      `json:"treasury_balance"`
	Planets         []string               `json:"planets"`
	CreatedAt       string                 `json:"created_at"`
	UpdatedAt       string                 `json:"updated_at"`
	Metadata        map[string]interface{} `json:"metadata,omitempty"`
}

// Planet represents a planet (validator node) in a star system
type Planet struct {
	ID             string                 `json:"id"`
	Name           string                 `json:"name"`
	StarSystemID   string                 `json:"star_system_id"`
	StarSystemName string                 `json:"star_system_name"`
	OwnerWallet    string                 `json:"owner_wallet"`
	NodeID         string                 `json:"node_id"`
	NodeAddress    string                 `json:"node_address"`
	PlanetType     string                 `json:"planet_type"` // habitable, resource, research, military
	NodeType       string                 `json:"node_type"`   // master, validator
	Status         string                 `json:"status"`      // active, deploying, inactive
	CreatedAt      string                 `json:"created_at"`
	UpdatedAt      string                 `json:"updated_at"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
}

// CelestialForgeStore stores star systems and planets in memory
// In production, this would be backed by the blockchain state
type CelestialForgeStore struct {
	mu          sync.RWMutex
	starSystems map[string]*StarSystem
	planets     map[string]*Planet
}

// NewCelestialForgeStore creates a new store
func NewCelestialForgeStore() *CelestialForgeStore {
	return &CelestialForgeStore{
		starSystems: make(map[string]*StarSystem),
		planets:     make(map[string]*Planet),
	}
}

var forgeStore = NewCelestialForgeStore()

// Cost constants in xBGL
const (
	StarSystemCostXBGL = 10000 // 10,000 xBGL to create a star system
	PlanetCostXBGL     = 2000  // 2,000 xBGL to create a planet
)

// generateSystemID creates a unique ID for a star system
func generateSystemID(name, owner string) string {
	data := fmt.Sprintf("%s:%s:%d", name, owner, time.Now().UnixNano())
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:16])
}

// generatePlanetID creates a unique ID for a planet
func generatePlanetID(name, systemID string) string {
	data := fmt.Sprintf("%s:%s:%d", name, systemID, time.Now().UnixNano())
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:16])
}

// generateSubnetID creates a mock subnet ID
func generateSubnetID(name string) string {
	return fmt.Sprintf("chaosstar-%s-%s", name, uuid.New().String()[:8])
}

// generateChainID creates a unique chain ID
func generateChainID() uint64 {
	return 900000 + uint64(time.Now().UnixNano()%99999)
}

// ============================================================================
// STAR SYSTEM HANDLERS
// ============================================================================

// listStarSystemsHandler returns all star systems
func (s *Server) listStarSystemsHandler(w http.ResponseWriter, r *http.Request) {
	forgeStore.mu.RLock()
	defer forgeStore.mu.RUnlock()

	// Filter by owner if query param present
	ownerFilter := r.URL.Query().Get("owner")

	systems := make([]*StarSystem, 0)
	for _, sys := range forgeStore.starSystems {
		if ownerFilter == "" || sys.OwnerWallet == ownerFilter {
			systems = append(systems, sys)
		}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"star_systems": systems,
		"count":        len(systems),
	})
}

// createStarSystemHandler creates a new star system
func (s *Server) createStarSystemHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name           string `json:"name"`
		OwnerWallet    string `json:"owner_wallet"`
		TributePercent uint8  `json:"tribute_percent"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate
	if req.Name == "" || len(req.Name) < 3 {
		respondError(w, http.StatusBadRequest, "Name must be at least 3 characters")
		return
	}
	if req.OwnerWallet == "" {
		respondError(w, http.StatusBadRequest, "Owner wallet is required")
		return
	}
	if req.TributePercent > 20 {
		respondError(w, http.StatusBadRequest, "Tribute percent must be 0-20")
		return
	}

	forgeStore.mu.Lock()
	defer forgeStore.mu.Unlock()

	// Check for duplicate name
	for _, sys := range forgeStore.starSystems {
		if sys.Name == req.Name {
			respondError(w, http.StatusConflict, "Star system name already exists")
			return
		}
	}

	// Create system
	now := time.Now().UTC().Format(time.RFC3339)
	system := &StarSystem{
		ID:             generateSystemID(req.Name, req.OwnerWallet),
		Name:           req.Name,
		SubnetID:       generateSubnetID(req.Name),
		OwnerWallet:    req.OwnerWallet,
		RPCURL:         fmt.Sprintf("http://localhost:8545/ext/bc/%s/rpc", generateSubnetID(req.Name)),
		ChainID:        generateChainID(),
		TributePercent: req.TributePercent,
		Status:         "deploying",
		TreasuryBalance: map[string]string{
			"xBGL":  "0",
			"CHAOS": "0",
			"XEN":   "0",
		},
		Planets:   make([]string, 0),
		CreatedAt: now,
		UpdatedAt: now,
	}

	forgeStore.starSystems[system.ID] = system

	// TODO: Submit StarSystemCreate action to blockchain
	// For now, we simulate the creation

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"success":     true,
		"star_system": system,
		"message":     fmt.Sprintf("Star system '%s' created successfully", req.Name),
		"cost":        StarSystemCostXBGL,
		"next_steps": []string{
			"Add planets to your star system",
			"Configure validators",
			"Deploy your subnet",
		},
	})
}

// getStarSystemHandler returns a specific star system
func (s *Server) getStarSystemHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	systemID := vars["id"]

	forgeStore.mu.RLock()
	defer forgeStore.mu.RUnlock()

	system, ok := forgeStore.starSystems[systemID]
	if !ok {
		respondError(w, http.StatusNotFound, "Star system not found")
		return
	}

	// Get planets for this system
	planets := make([]*Planet, 0)
	for _, planet := range forgeStore.planets {
		if planet.StarSystemID == systemID {
			planets = append(planets, planet)
		}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"star_system": system,
		"planets":     planets,
	})
}

// updateStarSystemHandler updates a star system
func (s *Server) updateStarSystemHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	systemID := vars["id"]

	var req struct {
		Status  string `json:"status,omitempty"`
		RPCURL  string `json:"rpc_url,omitempty"`
		ChainID uint64 `json:"chain_id,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	forgeStore.mu.Lock()
	defer forgeStore.mu.Unlock()

	system, ok := forgeStore.starSystems[systemID]
	if !ok {
		respondError(w, http.StatusNotFound, "Star system not found")
		return
	}

	// Update fields
	if req.Status != "" {
		system.Status = req.Status
	}
	if req.RPCURL != "" {
		system.RPCURL = req.RPCURL
	}
	if req.ChainID > 0 {
		system.ChainID = req.ChainID
	}
	system.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":     true,
		"star_system": system,
		"message":     "Star system updated",
	})
}

// deployStarSystemHandler initiates deployment of a star system
func (s *Server) deployStarSystemHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	systemID := vars["id"]

	forgeStore.mu.Lock()
	defer forgeStore.mu.Unlock()

	system, ok := forgeStore.starSystems[systemID]
	if !ok {
		respondError(w, http.StatusNotFound, "Star system not found")
		return
	}

	// Update status to deploying
	system.Status = "deploying"
	system.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	// Simulate async deployment
	go func() {
		time.Sleep(5 * time.Second)
		forgeStore.mu.Lock()
		if sys, ok := forgeStore.starSystems[systemID]; ok {
			sys.Status = "active"
			sys.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
		}
		forgeStore.mu.Unlock()
	}()

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":     true,
		"star_system": system,
		"message":     "Deployment initiated. System will be active in ~5 seconds.",
	})
}

// deleteStarSystemHandler deletes a star system
func (s *Server) deleteStarSystemHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	systemID := vars["id"]

	forgeStore.mu.Lock()
	defer forgeStore.mu.Unlock()

	system, ok := forgeStore.starSystems[systemID]
	if !ok {
		respondError(w, http.StatusNotFound, "Star system not found")
		return
	}

	// Delete associated planets
	for planetID, planet := range forgeStore.planets {
		if planet.StarSystemID == systemID {
			delete(forgeStore.planets, planetID)
		}
	}

	delete(forgeStore.starSystems, systemID)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("Star system '%s' and all its planets deleted", system.Name),
	})
}

// ============================================================================
// PLANET HANDLERS
// ============================================================================

// listPlanetsHandler returns all planets
func (s *Server) listPlanetsHandler(w http.ResponseWriter, r *http.Request) {
	forgeStore.mu.RLock()
	defer forgeStore.mu.RUnlock()

	// Filter by star system or owner
	systemFilter := r.URL.Query().Get("star_system_id")
	ownerFilter := r.URL.Query().Get("owner")

	planets := make([]*Planet, 0)
	for _, planet := range forgeStore.planets {
		if systemFilter != "" && planet.StarSystemID != systemFilter {
			continue
		}
		if ownerFilter != "" && planet.OwnerWallet != ownerFilter {
			continue
		}
		planets = append(planets, planet)
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"planets": planets,
		"count":   len(planets),
	})
}

// createPlanetHandler creates a new planet
func (s *Server) createPlanetHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name         string `json:"name"`
		StarSystemID string `json:"star_system_id"`
		OwnerWallet  string `json:"owner_wallet"`
		PlanetType   string `json:"planet_type"` // habitable, resource, research, military
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate
	if req.Name == "" || len(req.Name) < 3 {
		respondError(w, http.StatusBadRequest, "Name must be at least 3 characters")
		return
	}
	if req.StarSystemID == "" {
		respondError(w, http.StatusBadRequest, "Star system ID is required")
		return
	}
	if req.OwnerWallet == "" {
		respondError(w, http.StatusBadRequest, "Owner wallet is required")
		return
	}
	if req.PlanetType == "" {
		req.PlanetType = "habitable"
	}

	forgeStore.mu.Lock()
	defer forgeStore.mu.Unlock()

	// Check star system exists
	system, ok := forgeStore.starSystems[req.StarSystemID]
	if !ok {
		respondError(w, http.StatusNotFound, "Star system not found")
		return
	}

	// Check for duplicate name in system
	for _, planet := range forgeStore.planets {
		if planet.StarSystemID == req.StarSystemID && planet.Name == req.Name {
			respondError(w, http.StatusConflict, "Planet name already exists in this star system")
			return
		}
	}

	// Create planet
	now := time.Now().UTC().Format(time.RFC3339)
	planet := &Planet{
		ID:             generatePlanetID(req.Name, req.StarSystemID),
		Name:           req.Name,
		StarSystemID:   req.StarSystemID,
		StarSystemName: system.Name,
		OwnerWallet:    req.OwnerWallet,
		NodeID:         fmt.Sprintf("NodeID-%s", uuid.New().String()[:8]),
		NodeAddress:    fmt.Sprintf("10.%d.%d.%d", time.Now().Second()%255, time.Now().Nanosecond()%255, (time.Now().UnixNano()/1000)%255),
		PlanetType:     req.PlanetType,
		NodeType:       "master",
		Status:         "deploying",
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	forgeStore.planets[planet.ID] = planet

	// Update star system's planet list
	system.Planets = append(system.Planets, planet.ID)
	system.UpdatedAt = now

	// Simulate async deployment
	go func() {
		time.Sleep(3 * time.Second)
		forgeStore.mu.Lock()
		if p, ok := forgeStore.planets[planet.ID]; ok {
			p.Status = "active"
			p.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
		}
		forgeStore.mu.Unlock()
	}()

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"success": true,
		"planet":  planet,
		"message": fmt.Sprintf("Planet '%s' created in star system '%s'", req.Name, system.Name),
		"cost":    PlanetCostXBGL,
		"next_steps": []string{
			"Configure validator settings",
			"Stake xBGL for validation rewards",
		},
	})
}

// getPlanetHandler returns a specific planet
func (s *Server) getPlanetHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	planetID := vars["id"]

	forgeStore.mu.RLock()
	defer forgeStore.mu.RUnlock()

	planet, ok := forgeStore.planets[planetID]
	if !ok {
		respondError(w, http.StatusNotFound, "Planet not found")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"planet": planet,
	})
}

// updatePlanetHandler updates a planet
func (s *Server) updatePlanetHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	planetID := vars["id"]

	var req struct {
		Status      string `json:"status,omitempty"`
		NodeAddress string `json:"node_address,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	forgeStore.mu.Lock()
	defer forgeStore.mu.Unlock()

	planet, ok := forgeStore.planets[planetID]
	if !ok {
		respondError(w, http.StatusNotFound, "Planet not found")
		return
	}

	if req.Status != "" {
		planet.Status = req.Status
	}
	if req.NodeAddress != "" {
		planet.NodeAddress = req.NodeAddress
	}
	planet.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"planet":  planet,
		"message": "Planet updated",
	})
}

// deletePlanetHandler deletes a planet
func (s *Server) deletePlanetHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	planetID := vars["id"]

	forgeStore.mu.Lock()
	defer forgeStore.mu.Unlock()

	planet, ok := forgeStore.planets[planetID]
	if !ok {
		respondError(w, http.StatusNotFound, "Planet not found")
		return
	}

	// Remove from star system's planet list
	if system, ok := forgeStore.starSystems[planet.StarSystemID]; ok {
		newPlanets := make([]string, 0)
		for _, pID := range system.Planets {
			if pID != planetID {
				newPlanets = append(newPlanets, pID)
			}
		}
		system.Planets = newPlanets
		system.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	}

	delete(forgeStore.planets, planetID)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("Planet '%s' deleted", planet.Name),
	})
}

// ============================================================================
// STATS & STATUS HANDLERS
// ============================================================================

// celestialForgeStatsHandler returns Celestial Forge statistics
func (s *Server) celestialForgeStatsHandler(w http.ResponseWriter, r *http.Request) {
	forgeStore.mu.RLock()
	defer forgeStore.mu.RUnlock()

	totalSystems := len(forgeStore.starSystems)
	totalPlanets := len(forgeStore.planets)

	activeSystems := 0
	deployingSystems := 0
	activePlanets := 0

	for _, sys := range forgeStore.starSystems {
		switch sys.Status {
		case "active":
			activeSystems++
		case "deploying":
			deployingSystems++
		}
	}

	for _, planet := range forgeStore.planets {
		if planet.Status == "active" {
			activePlanets++
		}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"total_star_systems":     totalSystems,
		"active_star_systems":    activeSystems,
		"deploying_star_systems": deployingSystems,
		"total_planets":          totalPlanets,
		"active_planets":         activePlanets,
		"costs": map[string]int{
			"star_system_xbgl": StarSystemCostXBGL,
			"planet_xbgl":      PlanetCostXBGL,
		},
	})
}

// forgeToolsStatusHandler returns the status of Celestial Forge tools
func (s *Server) forgeToolsStatusHandler(w http.ResponseWriter, r *http.Request) {
	// Check if ChaosStar CLI is available
	cliAvailable := true // In production, check actual CLI availability

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"tools": map[string]interface{}{
			"chaosstar_cli": map[string]interface{}{
				"available": cliAvailable,
				"version":   "1.0.0",
			},
			"blockchain": map[string]interface{}{
				"connected": s.rpc != nil,
				"chain_id":  s.config.ChainID,
			},
			"stargate": map[string]interface{}{
				"url":       s.config.StargateURL,
				"connected": s.stargate != nil,
			},
		},
		"capabilities": []string{
			"create_star_system",
			"create_planet",
			"deploy_subnet",
			"manage_validators",
		},
	})
}

