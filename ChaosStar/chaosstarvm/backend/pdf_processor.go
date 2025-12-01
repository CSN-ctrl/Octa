// Copyright (C) 2024, ChaosStar Network. All rights reserved.
// PDF Processor - Scans PDFs and creates fillable overlays

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

// PDFField represents a fillable field in the PDF
type PDFField struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Label       string  `json:"label"`
	X           float64 `json:"x"`           // X coordinate (points from left)
	Y           float64 `json:"y"`           // Y coordinate (points from top)
	Width       float64 `json:"width"`       // Field width
	Height      float64 `json:"height"`      // Field height
	Page        int     `json:"page"`        // Page number (1-indexed)
	Type        string  `json:"type"`        // text, date, signature, etc.
	Required    bool    `json:"required"`    // Is this field required?
	Placeholder string  `json:"placeholder"` // Placeholder text
	Value       string  `json:"value"`       // Current value
}

// PDFTemplate represents a scanned PDF template
type PDFTemplate struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	Description string     `json:"description"`
	SourcePDF   string     `json:"source_pdf"`
	PageCount   int        `json:"page_count"`
	PageWidth   float64    `json:"page_width"`
	PageHeight  float64    `json:"page_height"`
	Fields      []PDFField `json:"fields"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// LandCertificateData represents data for filling the Land Ownership Certificate
type LandCertificateData struct {
	// Owner Information
	UniqueIdentifier string `json:"unique_identifier"`
	OwnerName        string `json:"owner_name"`
	WalletAddress    string `json:"wallet_address"`
	Email            string `json:"email"`
	CitizenID        string `json:"citizen_id"`
	DateOfIssue      string `json:"date_of_issue"`

	// Property Information
	PlotID           string `json:"plot_id"`
	Coordinates      string `json:"coordinates"`
	ZoneType         string `json:"zone_type"`
	ActivationDate   string `json:"activation_date"`
	NFTTokenID       string `json:"nft_token_id"`
	TransactionHash  string `json:"transaction_hash"`

	// Title Grant
	BlockchainName   string `json:"blockchain_name"`
	BuyerSignature   string `json:"buyer_signature"`
	SellerSignature  string `json:"seller_signature"`
}

// PDFProcessor handles PDF scanning and filling
type PDFProcessor struct {
	templatesDir string
	outputDir    string
	templates    map[string]*PDFTemplate
}

// NewPDFProcessor creates a new PDF processor
func NewPDFProcessor(templatesDir, outputDir string) *PDFProcessor {
	// Create directories if they don't exist
	os.MkdirAll(templatesDir, 0755)
	os.MkdirAll(outputDir, 0755)

	processor := &PDFProcessor{
		templatesDir: templatesDir,
		outputDir:    outputDir,
		templates:    make(map[string]*PDFTemplate),
	}

	// Load the Land Ownership Certificate template
	processor.loadLandCertificateTemplate()

	return processor
}

// getAbsolutePDFPath returns the absolute path to the source PDF
func getAbsolutePDFPath() string {
	// Try multiple possible locations
	paths := []string{
		"../octavia-nebula-core/documents/LandOwnershipTitleCertificate.pdf",
		"./octavia-nebula-core/documents/LandOwnershipTitleCertificate.pdf",
		"/home/hades/Videos/ChaosStar/chaosstarvm/octavia-nebula-core/documents/LandOwnershipTitleCertificate.pdf",
	}
	
	for _, path := range paths {
		if _, err := os.Stat(path); err == nil {
			absPath, _ := filepath.Abs(path)
			return absPath
		}
	}
	
	return paths[2] // Default to absolute path
}

// loadLandCertificateTemplate creates the template for the Land Ownership Certificate
func (p *PDFProcessor) loadLandCertificateTemplate() {
	// Define fields based on the PDF structure
	// Coordinates are approximate and based on standard A4 layout (595 x 842 points)
	fields := []PDFField{
		// Header
		{ID: "unique_identifier", Name: "unique_identifier", Label: "Unique Identifier", X: 350, Y: 50, Width: 200, Height: 20, Page: 1, Type: "text", Required: true},
		{ID: "date_of_issue", Name: "date_of_issue", Label: "Date of Issue", X: 120, Y: 185, Width: 150, Height: 20, Page: 1, Type: "date", Required: true},
		
		// Owner Information Section
		{ID: "owner_name", Name: "owner_name", Label: "Owner Name", X: 80, Y: 230, Width: 250, Height: 20, Page: 1, Type: "text", Required: true},
		{ID: "wallet_address", Name: "wallet_address", Label: "Wallet Address", X: 140, Y: 250, Width: 350, Height: 20, Page: 1, Type: "text", Required: true},
		{ID: "email", Name: "email", Label: "Email", X: 80, Y: 270, Width: 250, Height: 20, Page: 1, Type: "email", Required: false},
		{ID: "citizen_id", Name: "citizen_id", Label: "Citizen ID", X: 180, Y: 290, Width: 200, Height: 20, Page: 1, Type: "text", Required: false},

		// Property Information Section
		{ID: "plot_id", Name: "plot_id", Label: "Plot ID", X: 90, Y: 340, Width: 150, Height: 20, Page: 1, Type: "text", Required: true},
		{ID: "coordinates", Name: "coordinates", Label: "Coordinates / Sector", X: 170, Y: 360, Width: 200, Height: 20, Page: 1, Type: "text", Required: true},
		{ID: "zone_type", Name: "zone_type", Label: "Zone Type", X: 110, Y: 380, Width: 150, Height: 20, Page: 1, Type: "text", Required: true},
		{ID: "activation_date", Name: "activation_date", Label: "Activation Date", X: 140, Y: 400, Width: 150, Height: 20, Page: 1, Type: "date", Required: true},
		{ID: "nft_token_id", Name: "nft_token_id", Label: "NFT Token ID", X: 130, Y: 420, Width: 200, Height: 20, Page: 1, Type: "text", Required: true},
		{ID: "transaction_hash", Name: "transaction_hash", Label: "Transaction Hash", X: 150, Y: 440, Width: 350, Height: 20, Page: 1, Type: "text", Required: true},

		// Title Grant Section
		{ID: "blockchain_name", Name: "blockchain_name", Label: "Blockchain Name", X: 100, Y: 520, Width: 200, Height: 20, Page: 1, Type: "text", Required: true, Placeholder: "ChaosStar Network"},
		{ID: "buyer_signature", Name: "buyer_signature", Label: "Buyer Signature", X: 100, Y: 600, Width: 200, Height: 30, Page: 1, Type: "signature", Required: true},
		{ID: "seller_signature", Name: "seller_signature", Label: "Seller Signature", X: 100, Y: 640, Width: 200, Height: 30, Page: 1, Type: "signature", Required: false},
	}

	template := &PDFTemplate{
		ID:          "land-ownership-certificate",
		Name:        "Land Ownership Title Certificate",
		Description: "Official certificate of land ownership on ChaosStar Network",
		SourcePDF:   getAbsolutePDFPath(),
		PageCount:   2,
		PageWidth:   595,  // A4 width in points
		PageHeight:  842,  // A4 height in points
		Fields:      fields,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	p.templates[template.ID] = template
}

// ScanPDF extracts text and positions from a PDF using pdftotext
func (p *PDFProcessor) ScanPDF(pdfPath string) ([]map[string]interface{}, error) {
	// Use pdftotext with -bbox option to get bounding boxes
	cmd := exec.Command("pdftotext", "-bbox", pdfPath, "-")
	output, err := cmd.Output()
	if err != nil {
		// Fallback to simple text extraction
		cmd = exec.Command("pdftotext", "-layout", pdfPath, "-")
		output, err = cmd.Output()
		if err != nil {
			return nil, fmt.Errorf("failed to extract text from PDF: %w", err)
		}
	}

	// Parse the output to extract text positions
	results := make([]map[string]interface{}, 0)
	
	// Simple line-based parsing
	lines := strings.Split(string(output), "\n")
	y := 0.0
	for _, line := range lines {
		if strings.TrimSpace(line) == "" {
			y += 15
			continue
		}
		
		results = append(results, map[string]interface{}{
			"text": line,
			"x":    50.0,
			"y":    y,
			"page": 1,
		})
		y += 15
	}

	return results, nil
}

// GetTemplate returns a template by ID
func (p *PDFProcessor) GetTemplate(templateID string) (*PDFTemplate, error) {
	template, ok := p.templates[templateID]
	if !ok {
		return nil, fmt.Errorf("template not found: %s", templateID)
	}
	return template, nil
}

// ListTemplates returns all available templates
func (p *PDFProcessor) ListTemplates() []*PDFTemplate {
	templates := make([]*PDFTemplate, 0, len(p.templates))
	for _, t := range p.templates {
		templates = append(templates, t)
	}
	return templates
}

// FillPDF fills a PDF template with data and returns the filled PDF
func (p *PDFProcessor) FillPDF(templateID string, data map[string]string) (string, error) {
	template, err := p.GetTemplate(templateID)
	if err != nil {
		return "", err
	}

	// Generate output filename
	outputID := uuid.New().String()
	outputPath := filepath.Join(p.outputDir, fmt.Sprintf("filled_%s_%s.pdf", templateID, outputID))

	// For now, we'll create a simple text overlay approach
	// In production, you'd use a library like unipdf or pdfcpu

	// Create overlay data file
	overlayData := make(map[string]interface{})
	overlayData["template_id"] = templateID
	overlayData["fields"] = data
	overlayData["generated_at"] = time.Now().Format(time.RFC3339)
	
	// Save overlay data as JSON
	jsonPath := filepath.Join(p.outputDir, fmt.Sprintf("data_%s_%s.json", templateID, outputID))
	jsonData, _ := json.MarshalIndent(overlayData, "", "  ")
	os.WriteFile(jsonPath, jsonData, 0644)

	// Copy source PDF to output (placeholder - real implementation would overlay text)
	sourcePath := filepath.Join(filepath.Dir(p.templatesDir), template.SourcePDF)
	if _, err := os.Stat(sourcePath); os.IsNotExist(err) {
		// Try relative path from backend
		sourcePath = template.SourcePDF
	}
	
	// Use pdftk or similar to add form fields (if available)
	cmd := exec.Command("cp", sourcePath, outputPath)
	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("failed to copy PDF: %w", err)
	}

	return outputPath, nil
}

// GenerateFilledCertificate creates a Land Ownership Certificate with the provided data
func (p *PDFProcessor) GenerateFilledCertificate(data *LandCertificateData) (string, string, error) {
	// Convert struct to map
	dataMap := map[string]string{
		"unique_identifier": data.UniqueIdentifier,
		"owner_name":        data.OwnerName,
		"wallet_address":    data.WalletAddress,
		"email":             data.Email,
		"citizen_id":        data.CitizenID,
		"date_of_issue":     data.DateOfIssue,
		"plot_id":           data.PlotID,
		"coordinates":       data.Coordinates,
		"zone_type":         data.ZoneType,
		"activation_date":   data.ActivationDate,
		"nft_token_id":      data.NFTTokenID,
		"transaction_hash":  data.TransactionHash,
		"blockchain_name":   data.BlockchainName,
		"buyer_signature":   data.BuyerSignature,
		"seller_signature":  data.SellerSignature,
	}

	// Set defaults
	if dataMap["blockchain_name"] == "" {
		dataMap["blockchain_name"] = "ChaosStar Network"
	}
	if dataMap["date_of_issue"] == "" {
		dataMap["date_of_issue"] = time.Now().Format("2006-01-02")
	}
	if dataMap["unique_identifier"] == "" {
		dataMap["unique_identifier"] = fmt.Sprintf("LOC-%s", uuid.New().String()[:8])
	}

	// Generate filled PDF
	pdfPath, err := p.FillPDF("land-ownership-certificate", dataMap)
	if err != nil {
		return "", "", err
	}

	// Generate overlay JSON for frontend rendering
	overlayJSON := p.GenerateOverlayJSON("land-ownership-certificate", dataMap)

	return pdfPath, overlayJSON, nil
}

// GenerateOverlayJSON creates JSON data for frontend overlay rendering
func (p *PDFProcessor) GenerateOverlayJSON(templateID string, data map[string]string) string {
	template, err := p.GetTemplate(templateID)
	if err != nil {
		return "{}"
	}

	overlayFields := make([]map[string]interface{}, 0)
	for _, field := range template.Fields {
		value := data[field.Name]
		if value == "" {
			value = field.Placeholder
		}
		
		overlayFields = append(overlayFields, map[string]interface{}{
			"id":     field.ID,
			"name":   field.Name,
			"label":  field.Label,
			"x":      field.X,
			"y":      field.Y,
			"width":  field.Width,
			"height": field.Height,
			"page":   field.Page,
			"type":   field.Type,
			"value":  value,
		})
	}

	overlay := map[string]interface{}{
		"template_id":  templateID,
		"page_width":   template.PageWidth,
		"page_height":  template.PageHeight,
		"page_count":   template.PageCount,
		"fields":       overlayFields,
		"generated_at": time.Now().Format(time.RFC3339),
	}

	jsonData, _ := json.Marshal(overlay)
	return string(jsonData)
}

// ConvertPDFToImages converts PDF pages to images for background display
func (p *PDFProcessor) ConvertPDFToImages(pdfPath string, outputDir string) ([]string, error) {
	// Create output directory
	os.MkdirAll(outputDir, 0755)

	// Use pdftoppm to convert PDF to images
	baseName := filepath.Join(outputDir, "page")
	cmd := exec.Command("pdftoppm", "-png", "-r", "150", pdfPath, baseName)
	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("failed to convert PDF to images: %w", err)
	}

	// Find generated images
	files, err := filepath.Glob(baseName + "*.png")
	if err != nil {
		return nil, err
	}

	return files, nil
}

// ExtractTextWithPositions extracts text with bounding box positions
func (p *PDFProcessor) ExtractTextWithPositions(pdfPath string) ([]map[string]interface{}, error) {
	// Try using pdftotext with -bbox-layout for detailed positions
	cmd := exec.Command("pdftotext", "-bbox-layout", pdfPath, "-")
	output, err := cmd.Output()
	if err != nil {
		// Fallback: use simple extraction
		return p.ScanPDF(pdfPath)
	}

	// Parse HTML/XML output from bbox mode
	results := make([]map[string]interface{}, 0)
	
	// Simple regex to extract word positions from bbox output
	// Format: <word xMin="x" yMin="y" xMax="x2" yMax="y2">text</word>
	wordRegex := regexp.MustCompile(`<word\s+xMin="([^"]+)"\s+yMin="([^"]+)"\s+xMax="([^"]+)"\s+yMax="([^"]+)"[^>]*>([^<]+)</word>`)
	matches := wordRegex.FindAllStringSubmatch(string(output), -1)
	
	for _, match := range matches {
		if len(match) >= 6 {
			xMin, _ := strconv.ParseFloat(match[1], 64)
			yMin, _ := strconv.ParseFloat(match[2], 64)
			xMax, _ := strconv.ParseFloat(match[3], 64)
			yMax, _ := strconv.ParseFloat(match[4], 64)
			text := match[5]
			
			results = append(results, map[string]interface{}{
				"text":   text,
				"x":      xMin,
				"y":      yMin,
				"width":  xMax - xMin,
				"height": yMax - yMin,
			})
		}
	}

	return results, nil
}

// CreatePlaceholderImage creates a placeholder image with field markers
func (p *PDFProcessor) CreatePlaceholderImage(width, height int, fields []PDFField) ([]byte, error) {
	img := image.NewRGBA(image.Rect(0, 0, width, height))
	
	// Fill with white background
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			img.Set(x, y, color.White)
		}
	}
	
	// Draw field rectangles (light blue)
	fieldColor := color.RGBA{200, 220, 255, 255}
	for _, field := range fields {
		fx := int(field.X)
		fy := int(field.Y)
		fw := int(field.Width)
		fh := int(field.Height)
		
		for y := fy; y < fy+fh && y < height; y++ {
			for x := fx; x < fx+fw && x < width; x++ {
				if x >= 0 && y >= 0 {
					img.Set(x, y, fieldColor)
				}
			}
		}
	}
	
	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		return nil, err
	}
	
	return buf.Bytes(), nil
}

// HTTP Handlers

func (s *Server) pdfTemplatesHandler(w http.ResponseWriter, r *http.Request) {
	templates := s.pdfProcessor.ListTemplates()
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"templates": templates,
	})
}

func (s *Server) pdfTemplateHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	templateID := vars["id"]

	template, err := s.pdfProcessor.GetTemplate(templateID)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, template)
}

func (s *Server) pdfScanHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	templateID := vars["id"]

	template, err := s.pdfProcessor.GetTemplate(templateID)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}

	// Get the PDF path
	pdfPath := template.SourcePDF
	if !filepath.IsAbs(pdfPath) {
		pdfPath = filepath.Join(filepath.Dir(s.pdfProcessor.templatesDir), pdfPath)
	}

	// Extract text positions
	positions, err := s.pdfProcessor.ExtractTextWithPositions(pdfPath)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"template_id": templateID,
		"pdf_path":    pdfPath,
		"text_positions": positions,
		"fields":      template.Fields,
	})
}

func (s *Server) pdfFillHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	templateID := vars["id"]

	var data map[string]string
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	pdfPath, err := s.pdfProcessor.FillPDF(templateID, data)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Generate overlay JSON
	overlayJSON := s.pdfProcessor.GenerateOverlayJSON(templateID, data)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":     true,
		"pdf_path":    pdfPath,
		"overlay":     json.RawMessage(overlayJSON),
		"download_url": fmt.Sprintf("/api/pdf/download/%s", filepath.Base(pdfPath)),
	})
}

func (s *Server) generateCertificateHandler(w http.ResponseWriter, r *http.Request) {
	var data LandCertificateData
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	pdfPath, overlayJSON, err := s.pdfProcessor.GenerateFilledCertificate(&data)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":      true,
		"pdf_path":     pdfPath,
		"overlay":      json.RawMessage(overlayJSON),
		"download_url": fmt.Sprintf("/api/pdf/download/%s", filepath.Base(pdfPath)),
		"certificate_id": data.UniqueIdentifier,
	})
}

func (s *Server) pdfDownloadHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	filename := vars["filename"]

	// Security: ensure filename doesn't contain path traversal
	filename = filepath.Base(filename)
	pdfPath := filepath.Join(s.pdfProcessor.outputDir, filename)

	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		respondError(w, http.StatusNotFound, "File not found")
		return
	}

	file, err := os.Open(pdfPath)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to open file")
		return
	}
	defer file.Close()

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	io.Copy(w, file)
}

func (s *Server) pdfPreviewHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	templateID := vars["id"]

	template, err := s.pdfProcessor.GetTemplate(templateID)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}

	// Get the PDF path
	pdfPath := template.SourcePDF
	if !filepath.IsAbs(pdfPath) {
		pdfPath = filepath.Join(filepath.Dir(s.pdfProcessor.templatesDir), pdfPath)
	}

	// Serve the PDF file
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		respondError(w, http.StatusNotFound, "PDF not found")
		return
	}

	file, err := os.Open(pdfPath)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to open PDF")
		return
	}
	defer file.Close()

	w.Header().Set("Content-Type", "application/pdf")
	io.Copy(w, file)
}

func (s *Server) pdfOverlayHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	templateID := vars["id"]

	template, err := s.pdfProcessor.GetTemplate(templateID)
	if err != nil {
		respondError(w, http.StatusNotFound, err.Error())
		return
	}

	// Return overlay configuration for frontend rendering
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"template_id":  templateID,
		"name":         template.Name,
		"description":  template.Description,
		"page_width":   template.PageWidth,
		"page_height":  template.PageHeight,
		"page_count":   template.PageCount,
		"fields":       template.Fields,
		"source_pdf":   fmt.Sprintf("/api/pdf/preview/%s", templateID),
	})
}

