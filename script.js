const API_URLS = {
    posts: 'https://jsonplaceholder.typicode.com/posts',
    users: 'https://jsonplaceholder.typicode.com/users',
    comments: 'https://jsonplaceholder.typicode.com/comments',
    photos: 'https://jsonplaceholder.typicode.com/photos'
};

async function fetchData(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
    return await res.json();
}

async function render({ container, url, renderItem }) {
    if (!container) return;
    try {
        container.innerHTML = '<p class="subtitle">Carregando...</p>';
        const data = await fetchData(url);
        container.innerHTML = data && data.length ? data.map(renderItem).join('') : '<p class="subtitle">Nenhum registro encontrado.</p>';
    } catch {
        container.innerHTML = '<p class="error">Erro ao carregar dados.</p>';
    }
}

async function initFilterPage() {
    const container = document.getElementById('filter-results-container');
    if (!container) return;

    const searchInput = document.getElementById('global-search');
    const suggestionsList = document.getElementById('search-suggestions');
    const statsBox = document.getElementById('filter-stats');

    container.innerHTML = '<p class="subtitle">Carregando...</p>';

    try {
        const [users, posts, comments, photos] = await Promise.all([
            fetchData(API_URLS.users),
            fetchData(API_URLS.posts),
            fetchData(API_URLS.comments),
            fetchData(API_URLS.photos)
        ]);

        const processedData = users.map(user => {
            const userPosts = posts.filter(p => p.userId === user.id);
            const userPhotos = photos.filter(ph => ph.albumId === user.id);
            const userComments = comments.filter(c => userPosts.some(p => p.id === c.postId));

            const totalChars = userPosts.reduce((acc, p) => acc + p.title.length, 0);

            return {
                ...user,
                posts: userPosts,
                photos: userPhotos,
                comments: userComments,
                avgChars: userPosts.length ? Math.round(totalChars / userPosts.length) : 0
            };
        });

        const suggestionsSet = new Set();
        processedData.forEach(u => {
            suggestionsSet.add(u.name);
            suggestionsSet.add(u.email);
            suggestionsSet.add(String(u.id));
            u.posts.forEach(p => {
                suggestionsSet.add(String(p.id));
                suggestionsSet.add(p.title);
            });
            u.photos.forEach(ph => {
                suggestionsSet.add(ph.title);
            });
        });

        if (suggestionsList) {
            suggestionsList.innerHTML = Array.from(suggestionsSet).map(s => `<option value="${s}"></option>`).join('');
        }

        function update() {
            const query = (searchInput?.value || '').toLowerCase().trim();

            const filtered = processedData.filter(user => {
                if (!query) return true;

                const matchName = user.name.toLowerCase().includes(query);
                const matchEmail = user.email.toLowerCase().includes(query);
                const matchId = String(user.id) === query || user.id === Number(query);
                const matchPost = user.posts.some(p => String(p.id) === query || p.title.toLowerCase().includes(query));
                const matchPhoto = user.photos.some(ph => ph.title.toLowerCase().includes(query));
                const matchComment = user.comments.some(c => c.body.toLowerCase().includes(query));

                return matchName || matchEmail || matchId || matchPost || matchPhoto || matchComment;
            });

            const totals = filtered.reduce((acc, u) => {
                acc.users++;
                acc.posts += u.posts.length;
                acc.photos += u.photos.length;
                acc.comments += u.comments.length;
                return acc;
            }, { users: 0, posts: 0, photos: 0, comments: 0 });

            if (statsBox) {
                statsBox.innerHTML = `📊 <strong>Total:</strong> ${totals.users} usuários | ${totals.posts} posts | ${totals.photos} fotos | ${totals.comments} comentários`;
            }

            if (!filtered.length) {
                container.innerHTML = '<p class="subtitle">Nenhum resultado encontrado.</p>';
                return;
            }

            container.innerHTML = filtered.map(u => `
                <div class="item-card" onclick="location.href='user.html?id=${u.id}'" style="gap: 12px; cursor: pointer;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                        <h3>${u.name} (ID: ${u.id})</h3>
                        <span style="font-size: 12px; color: var(--yt-text-secondary); background: var(--yt-chip-bg); padding: 4px 8px; border-radius: 4px;">✉️ ${u.email}</span>
                    </div>
                    <p><strong>Empresa:</strong> ${u.company.name}</p>
                    <div style="border-top: 1px solid var(--yt-border); padding-top: 8px; font-size: 13px; display: flex; flex-direction: column; gap: 8px;">
                        <p>📝 Posts: ${u.posts.length} | 💬 Comentários: ${u.comments.length} | 📷 Fotos: ${u.photos.length}</p>
                        ${u.photos.length > 0 ? `
                            <div style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px;">
                                ${u.photos.slice(0, 6).map(ph => `
                                    <img src="${ph.thumbnailUrl}" alt="${ph.title}" title="${ph.title}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 4px; border: 1px solid var(--yt-border);" />
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('');
        }

        searchInput?.addEventListener('input', update);
        update();

    } catch {
        container.innerHTML = '<p class="error">Erro ao carregar dados.</p>';
    }
}

async function initApp() {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedUserId = urlParams.get('id') ? Number(urlParams.get('id')) : null;

    const section1 = document.getElementById('section1');
    if (section1) {
        try {
            section1.innerHTML = '<p class="subtitle">Carregando feed...</p>';
            const [users, posts, photos] = await Promise.all([
                fetchData(API_URLS.users),
                fetchData(API_URLS.posts),
                fetchData(API_URLS.photos)
            ]);

            const userMap = new Map(users.map(u => [u.id, u]));
            const randomPhotos = [...photos]
                .filter(ph => userMap.has(ph.albumId) && userMap.get(ph.albumId).username)
                .sort(() => Math.random() - 0.5)
                .slice(0, 24);

            section1.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 24px; width: 100%;">
                    <h2>📝 Publicações</h2>
                    <div style="display: flex; flex-direction: column; gap: 16px;">
                        ${posts.map(p => {
                            const u = userMap.get(p.userId) || { name: 'Desconhecido', username: 'desconhecido' };
                            const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`;
                            return `
                                <div class="item-card" onclick="location.href='user.html?id=${u.id}'" style="cursor: pointer; border-radius: 12px; border: 1px solid var(--yt-border);">
                                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                                        <img src="${avatar}" alt="${u.name}" style="width: 36px; height: 36px; border-radius: 50%; background: var(--yt-chip-bg); border: 1px solid var(--yt-border);" />
                                        <div>
                                            <span style="font-weight: 600; font-size: 14px; color: var(--yt-text-primary); display: block;">${u.name}</span>
                                            <span style="font-size: 12px; color: var(--yt-text-secondary);">@${u.username}</span>
                                        </div>
                                    </div>
                                    <h3 style="font-size: 15px; margin-bottom: 6px;">${p.title}</h3>
                                    <p style="font-size: 14px; color: var(--yt-text-secondary);">${p.body}</p>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <h2 style="margin-top: 16px;">📷 Fotos Recentes</h2>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px;">
                        ${randomPhotos.map(ph => {
                            const u = userMap.get(ph.albumId);
                            return `
                                <div style="background: var(--yt-raised-background); border: 1px solid var(--yt-border); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px; text-align: center; cursor: pointer;" onclick="location.href='user.html?id=${ph.albumId}'">
                                    <img src="${ph.thumbnailUrl}" alt="${ph.title}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px;" />
                                    <p style="font-size: 12px; color: var(--yt-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${ph.title}">${ph.title}</p>
                                    <span style="font-size: 11px; color: var(--yt-text-secondary); background: var(--yt-chip-bg); padding: 4px; border-radius: 4px;">@${u.username}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        } catch {
            section1.innerHTML = '<p class="error">Erro ao carregar o feed.</p>';
        }
    }

    const usersContainer = document.querySelector('#users-content .content-list');
    if (usersContainer) {
        try {
            usersContainer.innerHTML = '<p class="subtitle">Carregando...</p>';
            const [users, posts, photos, comments] = await Promise.all([
                fetchData(API_URLS.users),
                fetchData(API_URLS.posts),
                fetchData(API_URLS.photos),
                fetchData(API_URLS.comments)
            ]);

            const targetUsers = selectedUserId ? users.filter(u => u.id === selectedUserId) : users;
            
            if (targetUsers.length) {
                usersContainer.innerHTML = targetUsers.map(u => {
                    const userPosts = posts.filter(p => p.userId === u.id);
                    const userPhotos = photos.filter(ph => ph.albumId === u.id);
                    const userComments = comments.filter(c => userPosts.some(p => p.id === c.postId));
                    const userAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`;

                    if (selectedUserId) {
                        return `
                            <div style="display: flex; flex-direction: column; gap: 24px; width: 100%; max-width: 800px; margin: 0 auto;">
                                <div style="display: flex; align-items: center; gap: 32px; background: var(--yt-raised-background); border: 1px solid var(--yt-border); border-radius: 12px; padding: 24px; flex-wrap: wrap;">
                                    <img src="${userAvatar}" alt="${u.name}" style="width: 100px; height: 100px; border-radius: 50%; background: var(--yt-chip-bg); border: 2px solid var(--yt-border);" />
                                    <div style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
                                        <h2 style="font-size: 20px; font-weight: 600; color: var(--yt-text-primary);">@${u.username}</h2>
                                        <div style="display: flex; gap: 24px; font-size: 14px; color: var(--yt-text-primary);">
                                            <span><strong>${userPosts.length}</strong> posts</span>
                                            <span><strong>${userPhotos.length}</strong> fotos</span>
                                            <span><strong>${userComments.length}</strong> comentários</span>
                                        </div>
                                        <div>
                                            <p style="font-weight: 600; color: var(--yt-text-primary);">${u.name}</p>
                                            <p style="color: var(--yt-text-secondary); font-size: 13px;">🏢 ${u.company.name} &bull; 🌐 ${u.website}</p>
                                            <p style="color: var(--yt-text-secondary); font-size: 13px;">✉️ ${u.email} &bull; 📞 ${u.phone}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">📷 Fotos</h3>
                                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; background: var(--yt-raised-background); padding: 8px; border-radius: 12px; border: 1px solid var(--yt-border);">
                                        ${userPhotos.map(ph => `
                                            <div style="aspect-ratio: 1; overflow: hidden; border-radius: 6px; background: #000;" title="${ph.title}">
                                                <img src="${ph.thumbnailUrl}" alt="${ph.title}" style="width: 100%; height: 100%; object-fit: cover;" />
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>

                                <div>
                                    <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px;">📝 Publicações</h3>
                                    <div style="display: flex; flex-direction: column; gap: 16px;">
                                        ${userPosts.map(p => `
                                            <div class="item-card" style="border-radius: 12px; border: 1px solid var(--yt-border);">
                                                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                                                    <img src="${userAvatar}" alt="${u.name}" style="width: 32px; height: 32px; border-radius: 50%;" />
                                                    <span style="font-weight: 600; font-size: 14px;">@${u.username}</span>
                                                </div>
                                                <h3 style="font-size: 15px; margin-bottom: 6px;">${p.title}</h3>
                                                <p style="font-size: 14px; color: var(--yt-text-secondary);">${p.body}</p>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        `;
                    } else {
                        return `
                            <div class="item-card" onclick="location.href='user.html?id=${u.id}'" style="cursor: pointer;">
                                <h3>${u.name}</h3>
                                <p>${u.email} &bull; ${u.company.name}</p>
                            </div>
                        `;
                    }
                }).join('');
            } else {
                usersContainer.innerHTML = '<p class="subtitle">Usuário não encontrado.</p>';
            }
        } catch {
            usersContainer.innerHTML = '<p class="error">Erro ao carregar dados.</p>';
        }
    }

    await render({
        container: document.querySelector('#comments-content .content-list'),
        url: API_URLS.comments,
        renderItem: c => `<div class="item-card"><h3>${c.name}</h3><p>${c.body}</p></div>`
    });

    await initFilterPage();
}

document.addEventListener('DOMContentLoaded', initApp);
