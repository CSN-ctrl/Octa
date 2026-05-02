// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Matrix commands for the octagonal block structure

package cmd

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/spf13/cobra"
)

var matrixCmd = &cobra.Command{
	Use:   "matrix",
	Short: "Octagonal matrix operations",
	Long: `Interact with ChaosStar's unique octagonal block matrix.

The octagonal matrix is an 8-directional grid where blocks connect
to neighbors in all cardinal and intercardinal directions:
  N, NE, E, SE, S, SW, W, NW

This creates a 2D mesh of interconnected blocks instead of a linear chain.`,
	Aliases: []string{"m", "oct"},
}

func init() {
	rootCmd.AddCommand(matrixCmd)

	// matrix size
	matrixCmd.AddCommand(&cobra.Command{
		Use:   "size",
		Short: "Get matrix dimensions",
		Run:   runMatrixSize,
	})

	// matrix stats
	matrixCmd.AddCommand(&cobra.Command{
		Use:   "stats",
		Short: "Get matrix statistics",
		Run:   runMatrixStats,
	})

	// matrix view
	viewCmd := &cobra.Command{
		Use:   "view [x] [y]",
		Short: "Visualize matrix around coordinate",
		Args:  cobra.MaximumNArgs(2),
		Run:   runMatrixView,
	}
	viewCmd.Flags().Int32P("radius", "r", 5, "View radius")
	matrixCmd.AddCommand(viewCmd)

	// matrix block
	matrixCmd.AddCommand(&cobra.Command{
		Use:   "block <x> <y>",
		Short: "Get block at coordinate",
		Args:  cobra.ExactArgs(2),
		Run:   runMatrixBlock,
	})

	// matrix neighbors
	matrixCmd.AddCommand(&cobra.Command{
		Use:   "neighbors <x> <y>",
		Short: "Get neighbors of block at coordinate",
		Args:  cobra.ExactArgs(2),
		Run:   runMatrixNeighbors,
	})

	// matrix path
	matrixCmd.AddCommand(&cobra.Command{
		Use:   "path <x1> <y1> <x2> <y2>",
		Short: "Find path between two coordinates",
		Args:  cobra.ExactArgs(4),
		Run:   runMatrixPath,
	})

	// matrix expansion
	matrixCmd.AddCommand(&cobra.Command{
		Use:   "expansion",
		Short: "Show available expansion points",
		Run:   runMatrixExpansion,
	})
}

func runMatrixSize(cmd *cobra.Command, args []string) {
	client := GetRPCClient()

	var result struct {
		Width  int32 `json:"width"`
		Height int32 `json:"height"`
	}

	err := client.Call("chaosstar.getMatrixSize", nil, &result)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	fmt.Println("╔═══════════════════════════════════════╗")
	fmt.Println("║       Octagonal Matrix Size           ║")
	fmt.Println("╠═══════════════════════════════════════╣")
	fmt.Printf("║  Width:  %d blocks                    \n", result.Width)
	fmt.Printf("║  Height: %d blocks                    \n", result.Height)
	fmt.Printf("║  Area:   %d potential positions       \n", result.Width*result.Height)
	fmt.Println("╚═══════════════════════════════════════╝")
}

func runMatrixStats(cmd *cobra.Command, args []string) {
	client := GetRPCClient()

	var result struct {
		Width        int32   `json:"width"`
		Height       int32   `json:"height"`
		BlockCount   int     `json:"blockCount"`
		ChainHeight  uint64  `json:"chainHeight"`
		Density      float64 `json:"density"`
		AvgNeighbors float64 `json:"avgNeighbors"`
	}

	err := client.Call("chaosstar.getMatrixStats", nil, &result)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	fmt.Println("╔═══════════════════════════════════════════════════╗")
	fmt.Println("║           Octagonal Matrix Statistics              ║")
	fmt.Println("╠═══════════════════════════════════════════════════╣")
	fmt.Printf("║  Dimensions:     %d x %d                           \n", result.Width, result.Height)
	fmt.Printf("║  Block Count:    %d                                \n", result.BlockCount)
	fmt.Printf("║  Chain Height:   %d                                \n", result.ChainHeight)
	fmt.Printf("║  Density:        %.2f%%                            \n", result.Density*100)
	fmt.Printf("║  Avg Neighbors:  %.2f / 8                          \n", result.AvgNeighbors)
	fmt.Println("╠═══════════════════════════════════════════════════╣")
	fmt.Println("║  Directions: N  NE  E  SE  S  SW  W  NW           ║")
	fmt.Println("╚═══════════════════════════════════════════════════╝")
}

func runMatrixView(cmd *cobra.Command, args []string) {
	client := GetRPCClient()
	radius, _ := cmd.Flags().GetInt32("radius")

	var x, y int32 = 0, 0
	if len(args) >= 2 {
		fmt.Sscanf(args[0], "%d", &x)
		fmt.Sscanf(args[1], "%d", &y)
	}

	var result struct {
		View string `json:"view"`
	}

	params := map[string]interface{}{
		"x":      x,
		"y":      y,
		"radius": radius,
	}

	err := client.Call("chaosstar.viewMatrix", params, &result)
	if err != nil {
		// Fallback: generate local view
		fmt.Printf("\n  Octagonal Matrix View (center: %d,%d, radius: %d)\n\n", x, y, radius)
		printMatrixLegend()
		printSampleMatrix(x, y, radius)
		return
	}

	fmt.Printf("\n  Octagonal Matrix View (center: %d,%d)\n\n", x, y)
	fmt.Println(result.View)
	printMatrixLegend()
}

func printMatrixLegend() {
	fmt.Println("\n  Legend:")
	fmt.Println("    █ = Block present")
	fmt.Println("    · = Empty position")
	fmt.Println("    ◈ = Genesis block")
	fmt.Println("    ★ = Your position")
}

func printSampleMatrix(centerX, centerY, radius int32) {
	// Sample visualization
	fmt.Println()
	for y := centerY - radius; y <= centerY+radius; y++ {
		fmt.Print("    ")
		for x := centerX - radius; x <= centerX+radius; x++ {
			if x == 0 && y == 0 {
				fmt.Print("◈ ") // Genesis
			} else if x == centerX && y == centerY {
				fmt.Print("★ ") // Center
			} else if (x+y)%3 == 0 { // Sample pattern
				fmt.Print("█ ")
			} else {
				fmt.Print("· ")
			}
		}
		fmt.Printf("  y=%d\n", y)
	}
	fmt.Println()
}

func runMatrixBlock(cmd *cobra.Command, args []string) {
	client := GetRPCClient()

	var x, y int32
	fmt.Sscanf(args[0], "%d", &x)
	fmt.Sscanf(args[1], "%d", &y)

	var result struct {
		ID        string   `json:"id"`
		Coord     struct {
			X int32 `json:"x"`
			Y int32 `json:"y"`
		} `json:"coord"`
		Height    uint64   `json:"height"`
		Timestamp int64    `json:"timestamp"`
		TxCount   uint32   `json:"txCount"`
		Neighbors []string `json:"neighbors"`
	}

	params := map[string]interface{}{
		"x": x,
		"y": y,
	}

	err := client.Call("chaosstar.getBlockAt", params, &result)
	if err != nil {
		fmt.Printf("No block at (%d, %d)\n", x, y)
		return
	}

	directions := []string{"N", "NE", "E", "SE", "S", "SW", "W", "NW"}

	fmt.Println("╔═══════════════════════════════════════════════════════════════╗")
	fmt.Printf("║  Block at (%d, %d)                                            \n", x, y)
	fmt.Println("╠═══════════════════════════════════════════════════════════════╣")
	fmt.Printf("║  ID:          %s...\n", result.ID[:16])
	fmt.Printf("║  Height:      %d\n", result.Height)
	fmt.Printf("║  Transactions: %d\n", result.TxCount)
	fmt.Println("╠═══════════════════════════════════════════════════════════════╣")
	fmt.Println("║  Neighbors (8 directions):")
	
	for i, dir := range directions {
		neighbor := "empty"
		if i < len(result.Neighbors) && result.Neighbors[i] != "" {
			neighbor = result.Neighbors[i][:12] + "..."
		}
		fmt.Printf("║    %2s: %s\n", dir, neighbor)
	}
	fmt.Println("╚═══════════════════════════════════════════════════════════════╝")
}

func runMatrixNeighbors(cmd *cobra.Command, args []string) {
	var x, y int32
	fmt.Sscanf(args[0], "%d", &x)
	fmt.Sscanf(args[1], "%d", &y)

	directions := []string{"N", "NE", "E", "SE", "S", "SW", "W", "NW"}
	offsets := [][2]int32{{0, -1}, {1, -1}, {1, 0}, {1, 1}, {0, 1}, {-1, 1}, {-1, 0}, {-1, -1}}

	fmt.Printf("\n  Neighbors of block at (%d, %d):\n\n", x, y)
	fmt.Println("         NW    N    NE")
	fmt.Println("           \\   |   /")
	fmt.Println("        W — [X] — E")
	fmt.Println("           /   |   \\")
	fmt.Println("         SW    S    SE")
	fmt.Println()

	client := GetRPCClient()

	for i, dir := range directions {
		nx := x + offsets[i][0]
		ny := y + offsets[i][1]

		var result struct {
			Exists bool `json:"exists"`
		}

		params := map[string]interface{}{"x": nx, "y": ny}
		err := client.Call("chaosstar.blockExists", params, &result)

		status := "·"
		if err == nil && result.Exists {
			status = "█"
		}

		fmt.Printf("    %2s (%2d,%2d): %s\n", dir, nx, ny, status)
	}
}

func runMatrixPath(cmd *cobra.Command, args []string) {
	var x1, y1, x2, y2 int32
	fmt.Sscanf(args[0], "%d", &x1)
	fmt.Sscanf(args[1], "%d", &y1)
	fmt.Sscanf(args[2], "%d", &x2)
	fmt.Sscanf(args[3], "%d", &y2)

	client := GetRPCClient()

	var result struct {
		Path []struct {
			X int32 `json:"x"`
			Y int32 `json:"y"`
		} `json:"path"`
		Length int `json:"length"`
	}

	params := map[string]interface{}{
		"fromX": x1, "fromY": y1,
		"toX": x2, "toY": y2,
	}

	err := client.Call("chaosstar.findPath", params, &result)
	if err != nil {
		fmt.Printf("No path found from (%d,%d) to (%d,%d)\n", x1, y1, x2, y2)
		return
	}

	fmt.Printf("\n  Path from (%d,%d) to (%d,%d):\n\n", x1, y1, x2, y2)
	fmt.Printf("  Length: %d hops\n\n", result.Length)

	// Visualize path
	var pathStr []string
	for _, p := range result.Path {
		pathStr = append(pathStr, fmt.Sprintf("(%d,%d)", p.X, p.Y))
	}
	fmt.Printf("  Route: %s\n", strings.Join(pathStr, " → "))
}

func runMatrixExpansion(cmd *cobra.Command, args []string) {
	client := GetRPCClient()

	var result struct {
		Points []struct {
			X int32 `json:"x"`
			Y int32 `json:"y"`
		} `json:"points"`
		Count int `json:"count"`
	}

	err := client.Call("chaosstar.getExpansionPoints", nil, &result)
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	fmt.Println("╔═══════════════════════════════════════════════════╗")
	fmt.Println("║        Available Expansion Points                  ║")
	fmt.Println("╠═══════════════════════════════════════════════════╣")
	fmt.Printf("║  Total available: %d positions                    \n", result.Count)
	fmt.Println("╠═══════════════════════════════════════════════════╣")

	// Show first 20
	limit := result.Count
	if limit > 20 {
		limit = 20
	}

	for i := 0; i < limit; i++ {
		p := result.Points[i]
		fmt.Printf("║    (%3d, %3d)\n", p.X, p.Y)
	}

	if result.Count > 20 {
		fmt.Printf("║    ... and %d more\n", result.Count-20)
	}

	fmt.Println("╚═══════════════════════════════════════════════════╝")
}

// Add matrix info to the RPC types
type MatrixInfo struct {
	Width        int32   `json:"width"`
	Height       int32   `json:"height"`
	BlockCount   int     `json:"blockCount"`
	Density      float64 `json:"density"`
	AvgNeighbors float64 `json:"avgNeighbors"`
}

// GetMatrixInfo from RPC
func (c *RPCClient) GetMatrixInfo() (*MatrixInfo, error) {
	var result MatrixInfo
	err := c.Call("chaosstar.getMatrixStats", nil, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// MatrixBlockInfo represents block info from RPC
type MatrixBlockInfo struct {
	ID        string `json:"id"`
	X         int32  `json:"x"`
	Y         int32  `json:"y"`
	Height    uint64 `json:"height"`
	TxCount   uint32 `json:"txCount"`
	Neighbors map[string]string `json:"neighbors"`
}

// GetMatrixBlockAt from RPC
func (c *RPCClient) GetMatrixBlockAt(x, y int32) (*MatrixBlockInfo, error) {
	var result MatrixBlockInfo
	params := map[string]interface{}{"x": x, "y": y}
	err := c.Call("chaosstar.getBlockAt", params, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// ExportMatrix exports matrix to JSON
func (c *RPCClient) ExportMatrix() (json.RawMessage, error) {
	var result json.RawMessage
	err := c.Call("chaosstar.exportMatrix", nil, &result)
	if err != nil {
		return nil, err
	}
	return result, nil
}

