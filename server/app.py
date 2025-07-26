from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from openai import OpenAI
import os

load_dotenv()  # Load from .env

app = Flask(__name__)

@app.route("/")
def dashboard():
    return render_template("index.html")

@app.route("/ask", methods=["POST"])
def ask_chatgpt():
    data = request.get_json()
    prompt = data.get("prompt")

    try:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))  # Correct usage here

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=100
        )

        reply = response.choices[0].message.content
        return jsonify({"response": reply})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)