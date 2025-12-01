// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Utility functions for CLI

package cmd

import (
	"fmt"
	"strings"
)

// GetTokenName returns token name for a token type
func GetTokenName(tokenType uint8) string {
	switch tokenType {
	case 0:
		return "xBGL"
	case 1:
		return "CHAOS"
	case 2:
		return "XEN"
	default:
		return fmt.Sprintf("TOKEN%d", tokenType)
	}
}

// TruncateAddress truncates an address for display
func TruncateAddress(addr string, prefixLen, suffixLen int) string {
	if len(addr) <= prefixLen+suffixLen+3 {
		return addr
	}
	return addr[:prefixLen] + "..." + addr[len(addr)-suffixLen:]
}

// PrintSeparator prints a separator line
func PrintSeparator(width int) {
	fmt.Println(strings.Repeat("─", width))
}

// PrintBoxTop prints the top of a box
func PrintBoxTop(title string, width int) {
	if title == "" {
		fmt.Println("╔" + strings.Repeat("═", width-2) + "╗")
	} else {
		titlePadded := fmt.Sprintf(" %s ", title)
		remaining := width - 2 - len(titlePadded)
		left := remaining / 2
		right := remaining - left
		fmt.Println("╔" + strings.Repeat("═", left) + titlePadded + strings.Repeat("═", right) + "╗")
	}
}

// PrintBoxBottom prints the bottom of a box
func PrintBoxBottom(width int) {
	fmt.Println("╚" + strings.Repeat("═", width-2) + "╝")
}

// PrintBoxLine prints a line in a box
func PrintBoxLine(content string, width int) {
	padded := fmt.Sprintf("%-*s", width-4, content)
	fmt.Printf("║ %s ║\n", padded)
}

