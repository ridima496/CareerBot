import streamlit as st
import requests
import json

# Page configuration
st.set_page_config(page_title="CareerBot 🎓", page_icon="🧠", layout="centered")

# CSS styling
st.markdown("""
    <style>
        .main {
            background-color: #f7f9fb;
        }
        .stButton>button {
            background-color: #4CAF50;
            color: white;
            padding: 0.6em 1.2em;
            border-radius: 10px;
            border: none;
        }
        .stTextInput>div>div>input {
            padding: 0.5em;
            font-size: 1.1em;
        }
        .chat-bubble {
            background: #e8f0fe;
            border-radius: 15px;
            padding: 15px;
            margin: 10px 0;
            font-size: 1.1em;
        }
    </style>
""", unsafe_allow_html=True)

st.title("🎓 CareerBot")
st.markdown("Ask anything related to your **career, resume, LinkedIn, or productivity**.")

# Input field
user_prompt = st.text_input("Your question:")

if user_prompt:
    with st.spinner("Thinking..."):
        try:
            response = requests.post(
                "http://localhost:11434/api/generate",
                data=json.dumps({
                    "model": "mistral",
                    "prompt": user_prompt
                })
            )
            if response.status_code == 200:
                result = response.json()
                st.markdown(f"<div class='chat-bubble'>{result['response']}</div>", unsafe_allow_html=True)
            else:
                st.error("⚠️ Mistral backend error.")
        except Exception as e:
            st.error(f"⚠️ Error: {e}")
