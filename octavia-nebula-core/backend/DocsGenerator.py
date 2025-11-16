import os
from pathlib import Path
from docx import Document
import zipfile
from lxml import etree
import requests
import json

# --- Gemini API Configuration ---
GEMINI_API_URL = "https://api.gemini.google.com/v1/assistant"
GEMINI_API_KEY = "YOUR_API_KEY"  # Replace with your Gemini API key

# --- Gemini Functions ---
def send_to_gemini(prompt_text):
    headers = {"Authorization": f"Bearer {GEMINI_API_KEY}", "Content-Type": "application/json"}
    payload = {"prompt": prompt_text, "temperature": 0.7, "max_output_tokens": 300}
    response = requests.post(GEMINI_API_URL, headers=headers, data=json.dumps(payload))
    response.raise_for_status()
    return response.json().get("output_text", "")

def ai_edit_text(text, review=True):
    suggestion = send_to_gemini(f"Rewrite professionally:\n\n{text}")
    if review:
        print(f"\nOriginal text: {text[:50]}...")
        print(f"AI Suggestion: {suggestion}")
        user_input = input("Press Enter to accept or type replacement: ").strip()
        return user_input if user_input else suggestion
    return suggestion

def ai_generate_caption(image_name, review=True):
    caption = send_to_gemini(f"Generate a concise professional caption for an image named '{image_name}'.")
    if review:
        print(f"\nAI caption for {image_name}: {caption}")
        user_input = input("Press Enter to accept or type your own caption: ").strip()
        return user_input if user_input else caption
    return caption

# --- XML-Based Text Editing ---
def edit_all_text_objects(docx_path, review=True):
    with zipfile.ZipFile(docx_path, 'r') as zip_in:
        xml_content = zip_in.read('word/document.xml')

    parser = etree.XMLParser(ns_clean=True)
    tree = etree.fromstring(xml_content, parser=parser)

    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
          'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
          'wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing'}

    text_elements = tree.xpath('//w:t', namespaces=ns)
    for t_elem in text_elements:
        old_text = t_elem.text.strip() if t_elem.text else ""
        if not old_text:
            continue
        t_elem.text = ai_edit_text(old_text, review)

    return etree.tostring(tree, encoding='UTF-8', xml_declaration=True)

# --- Image Caption Insertion ---
def insert_captions_exact(docx_path, modified_xml_bytes, review=True):
    tree = etree.fromstring(modified_xml_bytes)
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
          'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
          'wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing'}

    drawings = tree.xpath('//w:drawing', namespaces=ns)
    image_idx = 1
    for drawing in drawings:
        blip = drawing.xpath('.//a:blip', namespaces=ns)
        if blip:
            img_name = f"Image_{image_idx}"
            caption_text = ai_generate_caption(img_name, review)
            parent_p = drawing.getparent()
            while parent_p.tag != '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p':
                parent_p = parent_p.getparent()
                if parent_p is None:
                    break
            if parent_p is not None:
                new_p = etree.Element('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p')
                new_r = etree.SubElement(new_p, '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}r')
                new_t = etree.SubElement(new_r, '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t')
                new_t.text = f"Caption: {caption_text}"
                parent_p.addnext(new_p)
            image_idx += 1

    temp_final = Path('backend/documents/temp_final.docx')
    with zipfile.ZipFile(docx_path, 'r') as zin:
        with zipfile.ZipFile(temp_final, 'w') as zout:
            for item in zin.infolist():
                if item.filename != 'word/document.xml':
                    zout.writestr(item, zin.read(item.filename))
            zout.writestr('word/document.xml', etree.tostring(tree, encoding='UTF-8', xml_declaration=True))
    return temp_final

# --- Main Function ---
def ai_edit_docx_layout_exact(input_file, output_file, review=True):
    modified_xml_bytes = edit_all_text_objects(input_file, review)
    final_docx_path = insert_captions_exact(input_file, modified_xml_bytes, review)
    doc = Document(final_docx_path)
    doc.save(output_file)
    print(f"Processed: {input_file.name} -> {output_file.name}")

# --- Run Script ---
if __name__ == "__main__":
    input_folder = Path("backend/documents")
    output_folder = input_folder / "NewFiles"
    output_folder.mkdir(parents=True, exist_ok=True)

    files = list(input_folder.glob("*.docx"))
    if not files:
        print("No .docx files found in 'backend/documents'.")
        exit()

    print(f"Processing {len(files)} document(s) automatically...")

    for input_file in files:
        output_file = output_folder / f"AI_edited_{input_file.name}"
        ai_edit_docx_layout_exact(str(input_file), str(output_file), review=True)

    print("\nAll documents processed successfully!")
