import gradio as gr
from pdf_rag1 import get_response
import json
import os

with open(os.path.abspath(os.path.join(os.path.dirname(__file__), "branding.json"))) as f:
    brand_info = json.load(f)["brand"]

css = """
body, .gradio-container {
    background: linear-gradient(120deg, #1BA098 0%, #FFB350 100%);
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin: 0;
    padding: 0;
    min-height: 100vh;
}
.header-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
    margin-top: 35px;
    margin-bottom: 5px;
}
.header-title {
    font-weight: 900;
    font-size: 2.8rem;
    color: #191a23;
    letter-spacing: 2px;
    text-shadow: 0 1px 10px rgba(255,255,255,0.12);
    margin: 0;
}
.header-slogan {
    text-align: center;
    font-size: 1.2rem;
    font-style: italic;
    color: #ffeee2;
    margin-bottom: 0px;
    margin-top: 2px;
    text-shadow: 0 1px 8px rgba(0,0,0,0.09);
}
.chat-container {
    background: rgba(44,47,74,0.97);
    border-radius: 22px;
    padding: 24px 36px;
    box-shadow: 0 18px 38px rgba(0,0,0,0.33);
    max-width: 900px;
    margin: 32px auto;
}
.gr-chat-interface {
    border-radius: 15px !important;
    overflow: hidden;
}
"""

with gr.Blocks(css=css, title=brand_info["organizationName"]) as rag_bot:
    with gr.Column():
        gr.HTML(f"""
        <div class="header-row">
            <img src='image.jpg' class="header-logo" alt="logo" />
            <span class="header-title">BM AI</span>
        </div>
        <div class="header-slogan">{brand_info['slogan']}</div>
        """)
    with gr.Column(elem_classes="chat-container"):
        gr.ChatInterface(
            fn=get_response,
            chatbot=gr.Chatbot(
                height=700,
                avatar_images=(None, brand_info["chatbot"]["avatar"]),
                type="messages"
            ),
            title="",
            description="",
            type="messages",
            examples=[
                ["WELCOME TO BM AI"],["can u give inf about COVID-19"]
            ]
        )

if __name__ == "__main__":
    rag_bot.launch(share=True)

