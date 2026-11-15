// Configuração das URLs da API JSONPlaceholder
const API_URLS = {
    posts: 'https://jsonplaceholder.typicode.com/posts',
    users: 'https://jsonplaceholder.typicode.com/users',
    comments: 'https://jsonplaceholder.typicode.com/comments'
};

// Função genérica assíncrona para buscar dados com tratamento de erros
async function fetchData(url) {
    try {
        const resposta = await fetch(url);
        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }
        return await resposta.json();
    } catch (erro) {
        console.error('Falha ao buscar dados:', erro);
        throw erro;
    }
}

// Função de renderização enxuta com apenas o estritamente necessário (container, url, renderItem)
async function render({ container, url, renderItem }) {
    if (!container) return;

    try {
        container.innerHTML = '<p class="subtitle">Carregando...</p>';
        const data = await fetchData(url);
        
        if (data && data.length > 0) {
            container.innerHTML = data.map(renderItem).join('');
        } else {
            container.innerHTML = '<p class="subtitle">Nenhum registro encontrado.</p>';
        }
    } catch (erro) {
        container.innerHTML = '<p class="error">Erro ao carregar dados.</p>';
    }
}

// Inicializador usando a função render enxuta
async function initApp() {
    // 1. Posts (main.html)
    await render({
        container: document.getElementById('section1'),
        url: API_URLS.posts,
        renderItem: post => `
            <div class="item-card">
                <h3>${post.title}</h3>
                <p>${post.body}</p>
            </div>
        `
    });

    // 2. Usuários (user.html)
    await render({
        container: document.querySelector('#users-content .content-list'),
        url: API_URLS.users,
        renderItem: user => `
            <div class="item-card">
                <h3>${user.name}</h3>
                <p>${user.email} &bull; ${user.company.name}</p>
            </div>
        `
    });

    // 3. Comentários (comments.html)
    await render({
        container: document.querySelector('#comments-content .content-list'),
        url: API_URLS.comments,
        renderItem: comment => `
            <div class="item-card">
                <h3>${comment.name}</h3>
                <p>${comment.body}</p>
            </div>
        `
    });
}

// Executar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initApp);
