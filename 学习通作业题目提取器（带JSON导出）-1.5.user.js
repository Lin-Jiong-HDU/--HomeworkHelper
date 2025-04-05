// ==UserScript==
// @name         学习通作业题目提取器（带JSON导出）
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  提取学习通作业题目并支持导出为JSON文件
// @author       JohnLin
// @match        https://mooc1.chaoxing.com/mooc-ans/mooc2/work/dowork*
// @match        https://mooc1-api.chaoxing.com/mooc-ans/mooc2/work/dowork*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // 添加自定义样式
    GM_addStyle(`
        .export-btn {
            background: #3a8bff;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin: 10px;
            border: none;
            font-size: 14px;
        }
        .export-btn:hover {
            background: #2c6fd6;
        }
    `);

    function initExportButton() {
        // 创建导出按钮
        const btn = document.createElement('button');
        btn.className = 'export-btn';
        btn.textContent = '导出题目为JSON';

        // 插入到作业标题旁边
        const header = document.querySelector('.subNav');
        if (header) {
            header.appendChild(btn);
        }

        return btn;
    }

    function exportToJSON(data) {
        // 生成文件名
        const title = document.querySelector('.mark_title')?.innerText || 'questions';
        const filename = `${title}_${new Date().toISOString().slice(0,10)}.json`;

        // 创建Blob
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});

        // 创建下载链接
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;

        // 触发下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    function collectQuestions() {
        const questionsList = [];
        const questionElements = document.querySelectorAll('div.questionLi.singleQuesId');

        questionElements.forEach(questionEl => {
            const type = questionEl.getAttribute('typename') || '未知类型';
            const questionTextEl = questionEl.querySelector('h3.mark_name');
            let questionText = questionTextEl?.innerText.replace(/\s+/g, ' ').trim() || '';

            // 处理图片
            const images = questionEl.querySelectorAll('img');
            images.forEach(img => {
                questionText += ` [图片: ${img.src}] `;
            });

            const questionObj = {
                type: type,
                text: questionText,
                options: []
            };

            // 处理选择题选项
            if (type.includes('选')) {
                const options = questionEl.querySelectorAll('div.answerBg, .dtk .answerBg');
                options.forEach(opt => {
                    const key = opt.querySelector('.num_option')?.getAttribute('data') || '';
                    const text = opt.querySelector('.answer_p')?.innerText
                        .replace(/\s+/g, ' ')
                        .trim() || '';
                    if (text) {
                        questionObj.options.push({ key, text });
                    }
                });
            }

            questionsList.push(questionObj);
        });

        return questionsList;
    }

    window.addEventListener('load', function() {
        // 初始化导出按钮
        const exportBtn = initExportButton();

        // 绑定点击事件
        exportBtn.addEventListener('click', () => {
            const questions = collectQuestions();
            if (questions.length > 0) {
                exportToJSON(questions);
                console.log('题目导出成功，共导出', questions.length, '道题目');
            } else {
                alert('未找到可导出的题目！');
            }
        });
    });
})();