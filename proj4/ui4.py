import gradio as gr
from pdf_rag import get_response
import json
import os

with open(os.path.abspath(os.path.join(os.path.dirname(__file__),"branding.json"))) as f:
    brand_info = json.load(f)["brand"]

with gr.Blocks(theme="default", title=brand_info["organizationName"]) as rag_bot:
   gr.HTML(f"""<div style="display: flex; justify-content: center; margin-bottom: 20px;">
        <img src="{brand_info["logo"]["title"]}" alt="{brand_info["organizationName"]} Logo" style="height: 100px;">
        </div>""")
   gr.ChatInterface(
       fn=get_response,
       chatbot=gr.Chatbot(height=500,
                          avatar_images=(None, brand_info["chatbot"]["avatar"]),
                          type="messages"),
       title=brand_info["organizationName"],
       description=brand_info["slogan"],
       type="messages",
       examples=[
           ["Who is the cto of here and now ai?"],
           ["Who is medam deepti?"],
           ["what is the main product of the company?"],
           ["Contact details of the here and now ai?"]
       ]
   )

   if __name__ == "__main__":
       rag_bot.launch(share=True)

