"""
Document Handler - Read, Write, and Modify Land Ownership Title Certificates
Supports both PDF and Word document templates from the documents folder.
"""
from __future__ import annotations
from pathlib import Path
from io import BytesIO
from datetime import datetime
from typing import Optional, Dict, Any, TYPE_CHECKING
import qrcode

if TYPE_CHECKING:
    from PyPDF2 import PdfReader
    from docx import Document

# PDF handling
try:
    from PyPDF2 import PdfReader, PdfWriter
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.utils import ImageReader
    HAS_PDF_LIBS = True
except ImportError:
    HAS_PDF_LIBS = False

# Word document handling
try:
    from docx import Document
    from docx.shared import Inches, Pt, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    HAS_DOCX_LIB = True
except ImportError:
    HAS_DOCX_LIB = False


class DocumentHandler:
    """Handle reading, writing, and modifying land ownership title certificates"""
    
    # Template paths
    BASE_DIR = Path(__file__).parent.parent
    DOCUMENTS_DIR = BASE_DIR / "documents"
    PDF_TEMPLATE = DOCUMENTS_DIR / "LandOwnershipTitleCertificate.pdf"
    DOCX_TEMPLATE = DOCUMENTS_DIR / "LandOwnershipTitleCertificate.docx"
    
    @staticmethod
    def generate_qr(data: str) -> BytesIO:
        """Generate QR code image as BytesIO"""
        qr = qrcode.QRCode(version=1, box_size=10, border=2)
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buf = BytesIO()
        img.save(buf, format='PNG')
        buf.seek(0)
        return buf
    
    @staticmethod
    def read_pdf_template() -> Optional["PdfReader"]:
        """Read the PDF template from documents folder"""
        if not HAS_PDF_LIBS:
            raise ImportError("PyPDF2 and reportlab required. Install with: pip install PyPDF2 reportlab")
        
        if not DocumentHandler.PDF_TEMPLATE.exists():
            raise FileNotFoundError(f"PDF template not found: {DocumentHandler.PDF_TEMPLATE}")
        
        return PdfReader(str(DocumentHandler.PDF_TEMPLATE))
    
    @staticmethod
    def read_docx_template() -> Optional["Document"]:
        """Read the Word template from documents folder"""
        if not HAS_DOCX_LIB:
            raise ImportError("python-docx required. Install with: pip install python-docx")
        
        if not DocumentHandler.DOCX_TEMPLATE.exists():
            raise FileNotFoundError(f"Word template not found: {DocumentHandler.DOCX_TEMPLATE}")
        
        return Document(str(DocumentHandler.DOCX_TEMPLATE))
    
    @staticmethod
    def generate_pdf_deed(
        plot_id: int,
        owner: str,
        tx_hash: str,
        owner_name: Optional[str] = None,
        owner_email: Optional[str] = None,
        owner_citizen_id: Optional[str] = None,
        coordinates: Optional[str] = None,
        zone_type: Optional[str] = None,
        token_id: Optional[int] = None,
        contract_address: Optional[str] = None,
        issuer: str = "Octa Investment Group",
        location: str = "Star System: Sarakt, Planet: Sarakt, Octavia Capital city"
    ) -> BytesIO:
        """
        Generate PDF deed by reading template, modifying it, and writing new PDF.
        
        Returns:
            BytesIO containing the generated PDF
        """
        if not HAS_PDF_LIBS:
            raise ImportError("PyPDF2 and reportlab required")
        
        # Read template
        try:
            template_reader = DocumentHandler.read_pdf_template()
        except FileNotFoundError:
            # Fallback to simple generation
            return DocumentHandler._generate_simple_pdf(plot_id, owner, tx_hash)
        
        # Create writer
        writer = PdfWriter()
        
        # Copy all pages from template
        for page in template_reader.pages:
            writer.add_page(page)
        
        # Create overlay with form data
        overlay_buf = BytesIO()
        c = canvas.Canvas(overlay_buf, pagesize=letter)
        w, h = letter
        
        # Set font
        c.setFont("Helvetica", 10)
        date_str = datetime.now().strftime('%Y-%m-%d')
        
        # Fill in fields (adjust coordinates based on actual template layout)
        y_start = h - 150
        
        # Owner Information Section
        if owner_name:
            c.drawString(150, y_start - 40, owner_name)
        c.drawString(150, y_start - 60, owner)
        if owner_email:
            c.drawString(150, y_start - 80, owner_email)
        if owner_citizen_id:
            c.drawString(150, y_start - 100, owner_citizen_id)
        
        # Property Information Section
        c.drawString(150, y_start - 140, str(plot_id))
        if coordinates:
            c.drawString(150, y_start - 160, coordinates)
        if zone_type:
            c.drawString(150, y_start - 180, zone_type)
        c.drawString(150, y_start - 200, date_str)  # Activation Date
        token_display = str(token_id) if token_id else str(plot_id)
        c.drawString(150, y_start - 220, token_display)  # NFT Token ID
        c.drawString(150, y_start - 240, tx_hash)  # Transaction Hash
        
        # Date of Issue
        c.drawString(150, y_start - 280, date_str)
        
        # Page 2 - Blockchain Record Data
        c.drawString(150, h - 400, token_display)
        if contract_address:
            c.drawString(150, h - 420, contract_address)
        c.drawString(150, h - 440, tx_hash)
        c.drawString(150, h - 460, date_str)
        
        # Add QR code
        qr_data = f"Plot:{plot_id},Owner:{owner},TX:{tx_hash}"
        qr_img = DocumentHandler.generate_qr(qr_data)
        c.drawImage(ImageReader(qr_img), w - 150, 50, 100, 100)
        
        c.save()
        overlay_buf.seek(0)
        
        # Merge overlay with template
        overlay_reader = PdfReader(overlay_buf)
        if len(writer.pages) > 0 and len(overlay_reader.pages) > 0:
            writer.pages[0].merge_page(overlay_reader.pages[0])
        
        # Write final PDF
        output_buf = BytesIO()
        writer.write(output_buf)
        output_buf.seek(0)
        return output_buf
    
    @staticmethod
    def generate_docx_deed(
        plot_id: int,
        owner: str,
        tx_hash: str,
        owner_name: Optional[str] = None,
        owner_email: Optional[str] = None,
        owner_citizen_id: Optional[str] = None,
        coordinates: Optional[str] = None,
        zone_type: Optional[str] = None,
        token_id: Optional[int] = None,
        contract_address: Optional[str] = None,
        issuer: str = "Octa Investment Group",
        location: str = "Star System: Sarakt, Planet: Sarakt, Octavia Capital city"
    ) -> BytesIO:
        """
        Generate Word document by reading template, modifying it, and writing new DOCX.
        
        Returns:
            BytesIO containing the generated Word document
        """
        if not HAS_DOCX_LIB:
            raise ImportError("python-docx required. Install with: pip install python-docx")
        
        # Read template
        try:
            doc = DocumentHandler.read_docx_template()
        except FileNotFoundError:
            # Create new document if template not found
            doc = Document()
            DocumentHandler._create_docx_structure(doc)
        
        # Modify document - replace placeholders
        date_str = datetime.now().strftime('%Y-%m-%d')
        token_display = str(token_id) if token_id else str(plot_id)
        
        # Replace text in document
        replacements = {
            "Unique Identifier:": f"Unique Identifier: PLOT-{plot_id:05d}",
            "Adress: Star System: Sarakt, Planet: Sarakt, Octavia Capital city, ": f"Address: {location}",
            "Issuer: Octavia Investment Group": f"Issuer: {issuer}",
            "Date of Issue:": f"Date of Issue: {date_str}",
            "Name: ": f"Name: {owner_name or 'N/A'}",
            "Wallet Address:": f"Wallet Address: {owner}",
            "Email: ": f"Email: {owner_email or 'N/A'}",
            "Citizen ID (if applicable): ": f"Citizen ID (if applicable): {owner_citizen_id or 'N/A'}",
            "Plot ID: ": f"Plot ID: {plot_id}",
            "Coordinates / Sector: ": f"Coordinates / Sector: {coordinates or 'N/A'}",
            "Zone Type:": f"Zone Type: {zone_type or 'N/A'}",
            "Activation Date: ": f"Activation Date: {date_str}",
            "NFT Token ID: ": f"NFT Token ID: {token_display}",
            "Transaction Hash: ": f"Transaction Hash: {tx_hash}",
            "Token Contract Address: ": f"Token Contract Address: {contract_address or 'N/A'}",
            "Activation Transaction Hash: ": f"Activation Transaction Hash: {tx_hash}",
            "Date of Title Issuance: ": f"Date of Title Issuance: {date_str}",
        }
        
        # Replace text in all paragraphs
        for paragraph in doc.paragraphs:
            for old_text, new_text in replacements.items():
                if old_text in paragraph.text:
                    paragraph.text = paragraph.text.replace(old_text, new_text)
        
        # Replace text in tables
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    for old_text, new_text in replacements.items():
                        if old_text in cell.text:
                            cell.text = cell.text.replace(old_text, new_text)
        
        # Save to BytesIO
        output_buf = BytesIO()
        doc.save(output_buf)
        output_buf.seek(0)
        return output_buf
    
    @staticmethod
    def _generate_simple_pdf(plot_id: int, owner: str, tx_hash: str) -> BytesIO:
        """Fallback: Generate simple PDF without template"""
        buf = BytesIO()
        c = canvas.Canvas(buf, pagesize=letter)
        w, h = letter
        c.setFont("Helvetica-Bold", 28)
        c.drawCentredString(w/2, h - 50, "LAND OWNERSHIP TITLE CERTIFICATE")
        c.setFont("Helvetica", 14)
        c.drawString(50, h - 100, f"Plot ID: {plot_id}")
        c.drawString(50, h - 120, f"Owner: {owner}")
        c.drawString(50, h - 140, f"Transaction: {tx_hash}")
        c.drawString(50, h - 160, f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        qr_img = DocumentHandler.generate_qr(f"Plot:{plot_id},Owner:{owner},TX:{tx_hash}")
        c.drawImage(ImageReader(qr_img), w - 150, h - 200, 100, 100)
        c.save()
        buf.seek(0)
        return buf
    
    @staticmethod
    def _create_docx_structure(doc: "Document"):
        """Create basic document structure if template not found"""
        doc.add_heading('LAND OWNERSHIP TITLE CERTIFICATE', 0)
        doc.add_paragraph('This is a generated land ownership certificate.')
    
    @staticmethod
    def save_pdf_to_file(pdf_bytes: BytesIO, output_path: Path) -> Path:
        """Save PDF bytes to file"""
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'wb') as f:
            f.write(pdf_bytes.getvalue())
        return output_path
    
    @staticmethod
    def save_docx_to_file(docx_bytes: BytesIO, output_path: Path) -> Path:
        """Save Word document bytes to file"""
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'wb') as f:
            f.write(docx_bytes.getvalue())
        return output_path
    
    @staticmethod
    def list_templates() -> Dict[str, bool]:
        """List available templates in documents folder"""
        return {
            "pdf_template": DocumentHandler.PDF_TEMPLATE.exists(),
            "docx_template": DocumentHandler.DOCX_TEMPLATE.exists(),
            "documents_folder": DocumentHandler.DOCUMENTS_DIR.exists()
        }

