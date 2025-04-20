from flask import Flask, request, jsonify
import json
from langchain_community.chat_models import ChatZhipuAI
from langchain_core.output_parsers import StrOutputParser
from langchain.prompts.chat import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)
template = "你是一个作业助手，输入json格式的作业，仔细阅读题目内容，然后输出题目的答案和解析。"
system_message_prompt = SystemMessagePromptTemplate.from_template(template)

human_template = "{homework}"
human_message_prompt = HumanMessagePromptTemplate.from_template(human_template)

chat_prompt = ChatPromptTemplate.from_messages([system_message_prompt, human_message_prompt])

#chat_prompt.format_messages(input_language="English", output_language="French", text="I love programming.")


app = Flask(__name__)

# 添加配置使jsonify不转义中文
app.config['JSON_AS_ASCII'] = False

model = ChatZhipuAI(
    temperature=0.8,
    api_key="e32bbe23c012462da72a021e9e35066d.J3RBziIdLXl2juqA",
    api_base="https://open.bigmodel.cn/api/paas/v4/chat/completions",
    model="glm-4-plus",
)
outputparser = StrOutputParser()

ans = ""

def process_question(question):
    chat_prompt.format_messages(homework=question)
    chain = chat_prompt | model | outputparser
    result = chain.invoke(question)
    return(result)

@app.route('/', methods=['POST'])
def receive_questions():
    try:
        # 获取请求中的 JSON 数据
        data = request.get_json()
        if data:
            ans = process_question(data)
            return json.dumps({
                "status": "success",
                "processed_result": ans
            }, ensure_ascii=False), 200, {'Content-Type': 'application/json'}

        else:
            return jsonify({"error": "未接收到有效的 JSON 数据"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/submit-answers', methods=['POST'])
def submit_answers():
    try:
        global ans
        if ans:
            return json.dumps({
                "status": "success",
                "answer": ans
            }, ensure_ascii=False), 200, {'Content-Type': 'application/json'}
        else:
            return jsonify({"error": "答案尚未生成"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # 监听本地的 3000 端口，你可以根据需要修改
    app.run(host='localhost', port=3000, debug=True)
    