// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Octagonal Matrix - 8-directional block structure

package octagonal

import (
	"encoding/json"
	"fmt"
	"sync"

	"github.com/ava-labs/avalanchego/ids"
)

// Direction represents one of 8 cardinal/intercardinal directions
type Direction uint8

const (
	North Direction = iota
	NorthEast
	East
	SouthEast
	South
	SouthWest
	West
	NorthWest
	NumDirections = 8
)

// DirectionNames for display
var DirectionNames = [NumDirections]string{
	"N", "NE", "E", "SE", "S", "SW", "W", "NW",
}

// DirectionOffsets define X,Y movement for each direction
var DirectionOffsets = [NumDirections][2]int{
	{0, -1},  // North
	{1, -1},  // NorthEast
	{1, 0},   // East
	{1, 1},   // SouthEast
	{0, 1},   // South
	{-1, 1},  // SouthWest
	{-1, 0},  // West
	{-1, -1}, // NorthWest
}

// Opposite returns the opposite direction
func (d Direction) Opposite() Direction {
	return (d + 4) % NumDirections
}

// String returns direction name
func (d Direction) String() string {
	if d < NumDirections {
		return DirectionNames[d]
	}
	return "?"
}

// Coordinate represents a position in the octagonal matrix
type Coordinate struct {
	X int32 `json:"x"`
	Y int32 `json:"y"`
}

// NewCoordinate creates a coordinate
func NewCoordinate(x, y int32) Coordinate {
	return Coordinate{X: x, Y: y}
}

// Move returns new coordinate after moving in direction
func (c Coordinate) Move(dir Direction) Coordinate {
	offset := DirectionOffsets[dir]
	return Coordinate{
		X: c.X + int32(offset[0]),
		Y: c.Y + int32(offset[1]),
	}
}

// Neighbors returns all 8 neighboring coordinates
func (c Coordinate) Neighbors() [NumDirections]Coordinate {
	var neighbors [NumDirections]Coordinate
	for i := Direction(0); i < NumDirections; i++ {
		neighbors[i] = c.Move(i)
	}
	return neighbors
}

// Distance returns Manhattan distance to another coordinate
func (c Coordinate) Distance(other Coordinate) int32 {
	dx := c.X - other.X
	dy := c.Y - other.Y
	if dx < 0 {
		dx = -dx
	}
	if dy < 0 {
		dy = -dy
	}
	return dx + dy
}

// String representation
func (c Coordinate) String() string {
	return fmt.Sprintf("(%d,%d)", c.X, c.Y)
}

// MatrixBlock represents a block in the octagonal matrix
type MatrixBlock struct {
	ID         ids.ID                  `json:"id"`
	Coord      Coordinate              `json:"coord"`
	Height     uint64                  `json:"height"`
	Timestamp  int64                   `json:"timestamp"`
	ParentID   ids.ID                  `json:"parentId"`
	Neighbors  [NumDirections]*ids.ID  `json:"neighbors"` // Links to adjacent blocks
	StateRoot  ids.ID                  `json:"stateRoot"`
	TxRoot     ids.ID                  `json:"txRoot"`
	TxCount    uint32                  `json:"txCount"`
	Producer   ids.ShortID             `json:"producer"` // Validator that produced this block
	Signature  []byte                  `json:"signature"`
}

// NewMatrixBlock creates a new block at coordinate
func NewMatrixBlock(coord Coordinate, height uint64, parentID ids.ID) *MatrixBlock {
	return &MatrixBlock{
		Coord:    coord,
		Height:   height,
		ParentID: parentID,
	}
}

// SetNeighbor sets a neighbor in the given direction
func (b *MatrixBlock) SetNeighbor(dir Direction, blockID ids.ID) {
	b.Neighbors[dir] = &blockID
}

// GetNeighbor returns neighbor ID in direction (nil if none)
func (b *MatrixBlock) GetNeighbor(dir Direction) *ids.ID {
	return b.Neighbors[dir]
}

// HasNeighbor checks if block has neighbor in direction
func (b *MatrixBlock) HasNeighbor(dir Direction) bool {
	return b.Neighbors[dir] != nil
}

// NeighborCount returns number of connected neighbors
func (b *MatrixBlock) NeighborCount() int {
	count := 0
	for _, n := range b.Neighbors {
		if n != nil {
			count++
		}
	}
	return count
}

// OctagonalMatrix manages the 8-directional block grid
type OctagonalMatrix struct {
	mu       sync.RWMutex
	blocks   map[ids.ID]*MatrixBlock
	grid     map[Coordinate]ids.ID
	size     Coordinate // Current matrix bounds
	origin   Coordinate // Origin point (genesis)
	height   uint64     // Latest block height
	genesisID ids.ID
}

// NewOctagonalMatrix creates a new matrix
func NewOctagonalMatrix() *OctagonalMatrix {
	return &OctagonalMatrix{
		blocks: make(map[ids.ID]*MatrixBlock),
		grid:   make(map[Coordinate]ids.ID),
		origin: Coordinate{0, 0},
		size:   Coordinate{0, 0},
	}
}

// Initialize sets the genesis block
func (m *OctagonalMatrix) Initialize(genesisBlock *MatrixBlock) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if len(m.blocks) > 0 {
		return fmt.Errorf("matrix already initialized")
	}

	genesisBlock.Coord = m.origin
	m.blocks[genesisBlock.ID] = genesisBlock
	m.grid[m.origin] = genesisBlock.ID
	m.genesisID = genesisBlock.ID
	m.height = genesisBlock.Height

	return nil
}

// AddBlock adds a new block to the matrix
func (m *OctagonalMatrix) AddBlock(block *MatrixBlock) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Check if coordinate is free
	if existingID, exists := m.grid[block.Coord]; exists {
		return fmt.Errorf("coordinate %s already occupied by block %s", block.Coord, existingID)
	}

	// Add to index
	m.blocks[block.ID] = block
	m.grid[block.Coord] = block.ID

	// Link to neighbors
	for dir := Direction(0); dir < NumDirections; dir++ {
		neighborCoord := block.Coord.Move(dir)
		if neighborID, exists := m.grid[neighborCoord]; exists {
			// Link this block to neighbor
			block.SetNeighbor(dir, neighborID)
			// Link neighbor back to this block
			if neighbor, ok := m.blocks[neighborID]; ok {
				neighbor.SetNeighbor(dir.Opposite(), block.ID)
			}
		}
	}

	// Update bounds
	if block.Coord.X > m.size.X {
		m.size.X = block.Coord.X
	}
	if block.Coord.Y > m.size.Y {
		m.size.Y = block.Coord.Y
	}
	if block.Height > m.height {
		m.height = block.Height
	}

	return nil
}

// GetBlock retrieves a block by ID
func (m *OctagonalMatrix) GetBlock(id ids.ID) (*MatrixBlock, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	block, ok := m.blocks[id]
	return block, ok
}

// GetBlockAt retrieves a block at coordinate
func (m *OctagonalMatrix) GetBlockAt(coord Coordinate) (*MatrixBlock, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	
	if id, exists := m.grid[coord]; exists {
		block, ok := m.blocks[id]
		return block, ok
	}
	return nil, false
}

// GetNeighbors returns all neighboring blocks of a block
func (m *OctagonalMatrix) GetNeighbors(blockID ids.ID) []*MatrixBlock {
	m.mu.RLock()
	defer m.mu.RUnlock()

	block, ok := m.blocks[blockID]
	if !ok {
		return nil
	}

	var neighbors []*MatrixBlock
	for _, nID := range block.Neighbors {
		if nID != nil {
			if neighbor, ok := m.blocks[*nID]; ok {
				neighbors = append(neighbors, neighbor)
			}
		}
	}
	return neighbors
}

// Size returns current matrix dimensions
func (m *OctagonalMatrix) Size() (width, height int32) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.size.X + 1, m.size.Y + 1
}

// BlockCount returns total number of blocks
func (m *OctagonalMatrix) BlockCount() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.blocks)
}

// Height returns current chain height
func (m *OctagonalMatrix) Height() uint64 {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.height
}

// FindPath finds a path between two coordinates using BFS
func (m *OctagonalMatrix) FindPath(from, to Coordinate) []Coordinate {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if _, exists := m.grid[from]; !exists {
		return nil
	}
	if _, exists := m.grid[to]; !exists {
		return nil
	}

	// BFS
	type node struct {
		coord Coordinate
		path  []Coordinate
	}

	visited := make(map[Coordinate]bool)
	queue := []node{{from, []Coordinate{from}}}

	for len(queue) > 0 {
		curr := queue[0]
		queue = queue[1:]

		if curr.coord == to {
			return curr.path
		}

		if visited[curr.coord] {
			continue
		}
		visited[curr.coord] = true

		for dir := Direction(0); dir < NumDirections; dir++ {
			nextCoord := curr.coord.Move(dir)
			if _, exists := m.grid[nextCoord]; exists && !visited[nextCoord] {
				newPath := make([]Coordinate, len(curr.path)+1)
				copy(newPath, curr.path)
				newPath[len(curr.path)] = nextCoord
				queue = append(queue, node{nextCoord, newPath})
			}
		}
	}

	return nil // No path found
}

// GetAvailableExpansionPoints returns coordinates where new blocks can be added
func (m *OctagonalMatrix) GetAvailableExpansionPoints() []Coordinate {
	m.mu.RLock()
	defer m.mu.RUnlock()

	candidates := make(map[Coordinate]bool)

	for coord := range m.grid {
		for dir := Direction(0); dir < NumDirections; dir++ {
			neighbor := coord.Move(dir)
			if _, exists := m.grid[neighbor]; !exists {
				candidates[neighbor] = true
			}
		}
	}

	points := make([]Coordinate, 0, len(candidates))
	for coord := range candidates {
		points = append(points, coord)
	}
	return points
}

// Visualize returns ASCII representation of the matrix
func (m *OctagonalMatrix) Visualize(centerX, centerY int32, radius int32) string {
	m.mu.RLock()
	defer m.mu.RUnlock()

	var result string
	for y := centerY - radius; y <= centerY+radius; y++ {
		for x := centerX - radius; x <= centerX+radius; x++ {
			coord := Coordinate{x, y}
			if _, exists := m.grid[coord]; exists {
				result += "█ "
			} else {
				result += "· "
			}
		}
		result += "\n"
	}
	return result
}

// ToJSON exports matrix state as JSON
func (m *OctagonalMatrix) ToJSON() ([]byte, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	data := struct {
		Size      Coordinate              `json:"size"`
		Origin    Coordinate              `json:"origin"`
		Height    uint64                  `json:"height"`
		BlockCount int                    `json:"blockCount"`
		Blocks    map[string]*MatrixBlock `json:"blocks"`
	}{
		Size:       m.size,
		Origin:     m.origin,
		Height:     m.height,
		BlockCount: len(m.blocks),
		Blocks:     make(map[string]*MatrixBlock),
	}

	for id, block := range m.blocks {
		data.Blocks[id.String()] = block
	}

	return json.Marshal(data)
}

// MatrixStats holds statistics about the matrix
type MatrixStats struct {
	Width       int32  `json:"width"`
	Height      int32  `json:"height"`
	BlockCount  int    `json:"blockCount"`
	ChainHeight uint64 `json:"chainHeight"`
	Density     float64 `json:"density"` // blocks / (width * height)
	AvgNeighbors float64 `json:"avgNeighbors"`
}

// Stats returns matrix statistics
func (m *OctagonalMatrix) Stats() MatrixStats {
	m.mu.RLock()
	defer m.mu.RUnlock()

	width := m.size.X + 1
	height := m.size.Y + 1
	blockCount := len(m.blocks)
	
	totalNeighbors := 0
	for _, block := range m.blocks {
		totalNeighbors += block.NeighborCount()
	}

	avgNeighbors := float64(0)
	if blockCount > 0 {
		avgNeighbors = float64(totalNeighbors) / float64(blockCount)
	}

	density := float64(0)
	if width > 0 && height > 0 {
		density = float64(blockCount) / float64(width*height)
	}

	return MatrixStats{
		Width:        width,
		Height:       height,
		BlockCount:   blockCount,
		ChainHeight:  m.height,
		Density:      density,
		AvgNeighbors: avgNeighbors,
	}
}

