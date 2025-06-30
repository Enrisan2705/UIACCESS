from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import base64
from openai import OpenAI
import os

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

@app.route('/')
def api_page():
    return render_template('api.html')

@app.route('/validar_api', methods=['POST'])
def validar_api():
    try:
        api_key = request.json.get("apiKey")
        client = OpenAI(api_key=api_key)
        _ = client.models.list()
        return jsonify({"valida": True})
    except Exception as e:
        return jsonify({"valida": False, "error": str(e)})

@app.route('/index')
def index():
    return render_template('index.html')

@app.route('/analizar', methods=['POST'])
def analizar():
    try:
        api_key = request.form["apiKey"]
        client = OpenAI(api_key=api_key)

        imagen = request.files["imagen"]
        imagen_bytes = imagen.read()
        imagen_b64 = base64.b64encode(imagen_bytes).decode("utf-8")

        response = client.chat.completions.create(
            model="gpt-4-turbo",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Eres un experto en accesibilidad."
                      
                    )
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Describe en español todos los elementos visibles de la interfaz (botones, campos, texto, imágenes, menús, etc.) en lista: "
                        "Elementos principales con -"
                        "Secundarios con *"
                        "Agrupa por posición con con # (superior, inferior, centro, etc.). Sin introducción ni texto adicional."
                        "Luego escribe /--/ y genera un informe de accesibilidad detallado, también en lista (mismos símbolos):"
                        "Problemas potenciales"
                        "Recomendaciones con soluciones concretas (por ejemplo, colores con mayor contraste: especifica cuáles, o proporciona codigo para soluciones concretas)"
                        "Estima nivel WCAG con lo que se ve en la imagen (A, AA o AAA)"
                        "Solo la lista, sin títulos ni texto adicional."},
                        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{imagen_b64}"}}
                    ]
                }
            ],
            max_tokens=1500
        )

        contenido = response.choices[0].message.content

        if "/--/" in contenido:
            descripcion, informe = contenido.split("/--/", 1)
        else:
            descripcion = contenido
            informe = "⚠️ No se encontró el separador '/--/'. El modelo devolvió todo junto."

        return jsonify({
            "descripcion": descripcion.strip(),
            "informe": informe.strip()
        })

    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    app.run(debug=True)
