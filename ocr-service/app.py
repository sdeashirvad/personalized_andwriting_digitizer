import base64
import io
import os
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import pytesseract

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

@app.route('/ocr', methods=['POST'])
def ocr():
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({'error': 'Missing image data'}), 400

        image_data = base64.b64decode(data['image'])
        image = Image.open(io.BytesIO(image_data))

        image = image.convert('RGB')

        ocr_data = pytesseract.image_to_data(
            image,
            output_type=pytesseract.Output.DICT,
            config='--oem 3 --psm 6'
        )

        words = []
        raw_text_lines = []
        current_line = []
        current_line_num = -1

        for i in range(len(ocr_data['text'])):
            text = ocr_data['text'][i].strip()
            conf = int(ocr_data['conf'][i]) if ocr_data['conf'][i] != '-1' else 0
            line_num = ocr_data['line_num'][i]

            if text:
                confidence = max(0, min(100, conf))
                words.append({
                    'word': text,
                    'confidence': confidence,
                    'correctedWord': None,
                    'suggestionFromProfile': None,
                })
                if line_num != current_line_num:
                    if current_line:
                        raw_text_lines.append(' '.join(current_line))
                    current_line = [text]
                    current_line_num = line_num
                else:
                    current_line.append(text)

        if current_line:
            raw_text_lines.append(' '.join(current_line))

        raw_text = '\n'.join(raw_text_lines)

        avg_confidence = (
            sum(w['confidence'] for w in words) / len(words) if words else 0
        )

        return jsonify({
            'raw_text': raw_text,
            'confidence': avg_confidence,
            'words': words,
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'raw_text': '',
            'confidence': 0,
            'words': [],
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('OCR_PORT', 8000))
    print(f'OCR service starting on port {port}')
    app.run(host='localhost', port=port, debug=False)
