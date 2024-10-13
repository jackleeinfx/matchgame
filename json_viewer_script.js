document.addEventListener('DOMContentLoaded', function() {
    const select = document.getElementById('jsonFileSelect');
    const contentDisplay = document.getElementById('jsonContent');

    // 获取JSON文件列表
    fetch('https://api.github.com/repos/你的GitHub用户名/你的仓库名/contents/list')
        .then(response => response.json())
        .then(files => {
            const jsonFiles = files.filter(file => file.name.endsWith('.json'));
            jsonFiles.forEach(file => {
                const option = document.createElement('option');
                option.value = file.name;
                option.textContent = file.name;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('获取文件列表失败:', error);
            contentDisplay.textContent = '无法加载文件列表。';
        });

    // 监听选择变化
    select.addEventListener('change', function() {
        const selectedFile = this.value;
        if (selectedFile) {
            const filePath = `list/${selectedFile}`;
            
            fetch(filePath)
                .then(response => response.text())
                .then(content => {
                    try {
                        // 尝试格式化JSON
                        const formattedContent = JSON.stringify(JSON.parse(content), null, 2);
                        contentDisplay.textContent = formattedContent;
                    } catch (e) {
                        // 如果解析失败,直接显示原始内容
                        contentDisplay.textContent = content;
                    }
                })
                .catch(error => {
                    console.error('获取文件内容失败:', error);
                    contentDisplay.textContent = '无法加载文件内容。';
                });
        } else {
            contentDisplay.textContent = '';
        }
    });
});
