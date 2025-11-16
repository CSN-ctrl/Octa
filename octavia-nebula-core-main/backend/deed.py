from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from io import BytesIO
from datetime import datetime
import qrcode
from reportlab.lib.utils import ImageReader

class DeedGenerator:
    @staticmethod
    def generate_qr(data: str) -> BytesIO:
        qr = qrcode.QRCode(version=1, box_size=10, border=2)
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buf = BytesIO()
        img.save(buf, format='PNG')
        buf.seek(0)
        return buf

    @staticmethod
    def generate_deed(plot_id: int, owner: str, tx_hash: str) -> BytesIO:
        buf = BytesIO()
        c = canvas.Canvas(buf, pagesize=letter)
        w, h = letter
        c.setFont("Helvetica-Bold", 28)
        c.drawCentredString(w/2, h - 50, "SARAKT LAND DEED")
        c.setFont("Helvetica", 14)
        c.drawString(50, h - 100, f"Plot ID: {plot_id}")
        c.drawString(50, h - 120, f"Owner: {owner}")
        c.drawString(50, h - 140, f"Transaction: {tx_hash}")
        c.drawString(50, h - 160, f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        qr_img = DeedGenerator.generate_qr(f"Plot:{plot_id},Owner:{owner},TX:{tx_hash}")
        c.drawImage(ImageReader(qr_img), w - 150, h - 200, 100, 100)
        c.save()
        buf.seek(0)
        return buf