// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// Stargate Live Chain Logger

package stargate

import (
	"encoding/json"
	"fmt"
	"sync"
	"time"
)

// LogLevel represents log severity
type LogLevel int

const (
	LogDebug LogLevel = iota
	LogInfo
	LogWarn
	LogError
	LogBlock
	LogTx
	LogWarp
)

// LogEntry represents a log entry
type LogEntry struct {
	Timestamp time.Time   `json:"timestamp"`
	Level     LogLevel    `json:"level"`
	Type      string      `json:"type"`
	Message   string      `json:"message"`
	Data      interface{} `json:"data,omitempty"`
}

// ChainLogger handles live chain logging
type ChainLogger struct {
	subscribers map[string]chan *LogEntry
	mu          sync.RWMutex
	buffer      []*LogEntry
	bufferSize  int
	enabled     bool
}

// NewChainLogger creates a new chain logger
func NewChainLogger(bufferSize int) *ChainLogger {
	return &ChainLogger{
		subscribers: make(map[string]chan *LogEntry),
		buffer:      make([]*LogEntry, 0, bufferSize),
		bufferSize:  bufferSize,
		enabled:     true,
	}
}

// Subscribe creates a new log subscription
func (cl *ChainLogger) Subscribe(id string) chan *LogEntry {
	cl.mu.Lock()
	defer cl.mu.Unlock()

	ch := make(chan *LogEntry, 100)
	cl.subscribers[id] = ch

	// Send recent logs
	for _, entry := range cl.buffer {
		select {
		case ch <- entry:
		default:
		}
	}

	return ch
}

// Unsubscribe removes a log subscription
func (cl *ChainLogger) Unsubscribe(id string) {
	cl.mu.Lock()
	defer cl.mu.Unlock()

	if ch, ok := cl.subscribers[id]; ok {
		close(ch)
		delete(cl.subscribers, id)
	}
}

// Log adds a log entry
func (cl *ChainLogger) Log(level LogLevel, logType string, message string, data interface{}) {
	if !cl.enabled {
		return
	}

	entry := &LogEntry{
		Timestamp: time.Now(),
		Level:     level,
		Type:      logType,
		Message:   message,
		Data:      data,
	}

	cl.mu.Lock()
	// Add to buffer
	cl.buffer = append(cl.buffer, entry)
	if len(cl.buffer) > cl.bufferSize {
		cl.buffer = cl.buffer[1:]
	}

	// Notify subscribers
	for _, ch := range cl.subscribers {
		select {
		case ch <- entry:
		default:
			// Skip if channel full
		}
	}
	cl.mu.Unlock()
}

// LogBlock logs a new block
func (cl *ChainLogger) LogBlock(height uint64, hash string, txCount int, timestamp time.Time) {
	cl.Log(LogBlock, "block", fmt.Sprintf("Block #%d", height), map[string]interface{}{
		"height":    height,
		"hash":      hash,
		"txCount":   txCount,
		"timestamp": timestamp.Unix(),
	})
}

// LogTransaction logs a transaction
func (cl *ChainLogger) LogTransaction(hash string, from string, to string, action string, status string) {
	cl.Log(LogTx, "transaction", fmt.Sprintf("TX %s", action), map[string]interface{}{
		"hash":   hash,
		"from":   from,
		"to":     to,
		"action": action,
		"status": status,
	})
}

// LogWarpMessage logs a Warp message
func (cl *ChainLogger) LogWarpMessage(messageID string, destSubnet string, status string) {
	cl.Log(LogWarp, "warp", fmt.Sprintf("Warp → %s", destSubnet[:8]+"..."), map[string]interface{}{
		"messageId":  messageID,
		"destSubnet": destSubnet,
		"status":     status,
	})
}

// LogInfo logs an info message
func (cl *ChainLogger) LogInfo(message string) {
	cl.Log(LogInfo, "info", message, nil)
}

// LogError logs an error
func (cl *ChainLogger) LogError(message string, err error) {
	cl.Log(LogError, "error", message, map[string]interface{}{
		"error": err.Error(),
	})
}

// GetRecentLogs returns recent log entries
func (cl *ChainLogger) GetRecentLogs(count int) []*LogEntry {
	cl.mu.RLock()
	defer cl.mu.RUnlock()

	if count > len(cl.buffer) {
		count = len(cl.buffer)
	}

	start := len(cl.buffer) - count
	result := make([]*LogEntry, count)
	copy(result, cl.buffer[start:])
	return result
}

// FormatEntry formats a log entry for display
func FormatEntry(entry *LogEntry) string {
	timestamp := entry.Timestamp.Format("15:04:05")
	
	var levelIcon string
	var levelColor string
	
	switch entry.Level {
	case LogDebug:
		levelIcon = "🔍"
		levelColor = "\033[90m" // Gray
	case LogInfo:
		levelIcon = "ℹ️ "
		levelColor = "\033[36m" // Cyan
	case LogWarn:
		levelIcon = "⚠️ "
		levelColor = "\033[33m" // Yellow
	case LogError:
		levelIcon = "❌"
		levelColor = "\033[31m" // Red
	case LogBlock:
		levelIcon = "📦"
		levelColor = "\033[32m" // Green
	case LogTx:
		levelIcon = "📝"
		levelColor = "\033[35m" // Magenta
	case LogWarp:
		levelIcon = "🌐"
		levelColor = "\033[34m" // Blue
	}

	reset := "\033[0m"
	
	return fmt.Sprintf("%s%s %s %s%s", levelColor, timestamp, levelIcon, entry.Message, reset)
}

// FormatEntryJSON formats a log entry as JSON
func FormatEntryJSON(entry *LogEntry) string {
	data, _ := json.Marshal(entry)
	return string(data)
}

// ============================================================================
// Block Watcher - watches for new blocks
// ============================================================================

type BlockWatcher struct {
	rpcEndpoint string
	logger      *ChainLogger
	lastHeight  uint64
	running     bool
	stopCh      chan struct{}
	mu          sync.Mutex
}

func NewBlockWatcher(rpcEndpoint string, logger *ChainLogger) *BlockWatcher {
	return &BlockWatcher{
		rpcEndpoint: rpcEndpoint,
		logger:      logger,
		stopCh:      make(chan struct{}),
	}
}

func (bw *BlockWatcher) Start() {
	bw.mu.Lock()
	if bw.running {
		bw.mu.Unlock()
		return
	}
	bw.running = true
	bw.mu.Unlock()

	go bw.watch()
}

func (bw *BlockWatcher) Stop() {
	bw.mu.Lock()
	defer bw.mu.Unlock()
	
	if !bw.running {
		return
	}
	
	bw.running = false
	close(bw.stopCh)
}

func (bw *BlockWatcher) watch() {
	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()

	client := NewRPCClient(bw.rpcEndpoint)

	for {
		select {
		case <-bw.stopCh:
			return
		case <-ticker.C:
			block, err := client.GetLastAccepted()
			if err != nil {
				continue
			}

			if block.Height > bw.lastHeight {
				bw.logger.LogBlock(
					block.Height,
					block.BlockID,
					0, // TX count would come from block data
					time.Unix(0, block.Timestamp),
				)
				bw.lastHeight = block.Height
			}
		}
	}
}

// Simple RPC client for block watcher
type RPCClient struct {
	endpoint string
}

func NewRPCClient(endpoint string) *RPCClient {
	return &RPCClient{endpoint: endpoint}
}

func (c *RPCClient) GetLastAccepted() (*BlockInfo, error) {
	// This would make actual RPC call
	// Placeholder for now
	return &BlockInfo{
		Height:    0,
		Timestamp: time.Now().UnixNano(),
		BlockID:   "",
	}, nil
}

