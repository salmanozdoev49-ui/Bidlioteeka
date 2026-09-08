/* ===== НАСТРОЙКА SUPABASE ===== */
// Вставь сюда свои ключи из панели Supabase (Project Settings → API)
const SUPABASE_URL = "https://hvmvgrkoazojrpmtbnzj.supabase.co";
const SUPABASE_KEY = "sb_publishable_Jl93cw1rKXPSrzsoRx3mNw_euPMZEvE";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== DOM элементы =====
const grid         = document.getElementById('grid');
const searchInput  = document.getElementById('searchInput');
const emptyBox     = document.getElementById('empty');
const loadingBox   = document.getElementById('loading');

let allAnime = [];          // все записи
let currentStatus = "";     // выбранный фильтр
let currentSearch = "";     // текущий поиск

// ===== Загрузка данных из Supabase =====
async function loadAnime(){
    loadingBox.style.display = "block";
    grid.innerHTML = "";
    emptyBox.style.display = "none";
    try{
        const { data, error } = await supabase
            .from('anime')
            .select('*')
            .order('created_at', { ascending: false });
        if(error) throw error;
        allAnime = data || [];
    }catch(err){
        loadingBox.innerHTML = "<p>Ошибка загрузки: " + err.message + "</p>";
        return;
    }
    loadingBox.style.display = "none";
    render();
}

// ===== Фильтрация и рендер =====
function render(){
    let list = [...allAnime];

    // поиск по названию
    if(currentSearch){
        const q = currentSearch.toLowerCase();
        list = list.filter(a => (a.name||"").toLowerCase().includes(q));
    }
    // фильтр статуса
    if(currentStatus){
        list = list.filter(a => a.status === currentStatus);
    }

    grid.innerHTML = "";
    emptyBox.style.display = list.length ? "none" : "block";

    list.forEach(a => grid.appendChild(makeCard(a)));
}

// ===== Создание карточки =====
function makeCard(a){
    const card = document.createElement('div');
    card.className = 'card';

    // картинка (или заглушка)
    const img = document.createElement('img');
    img.className = 'thumb';
    img.loading = 'lazy';
    if(a.image_url){
        img.src = a.image_url;
        img.onerror = () => img.src = defaultPoster();
    } else {
        img.src = defaultPoster();
    }

    const body = document.createElement('div');
    body.className = 'card-body';

    const name = document.createElement('div');
    name.className = 'card-name';
    name.textContent = a.name;

    const st = document.createElement('span');
    st.className = 'card-status st-' + (a.status||'').replace(/\s/g,'\\ ');
    st.textContent = a.status || '—';

    body.appendChild(name);
    body.appendChild(st);
    card.appendChild(img);
    card.appendChild(body);

    // открыть карточку при нажатии
    card.addEventListener('click', () => openView(a));
    return card;
}

// Заглушка для постеров без фото
function defaultPoster(){
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='400'>` +
        `<rect width='100%25' height='100%25' fill='%23081d16'/>` +
        `<text x='50%25' y='50%25' fill='%2387968e' font-size='22' text-anchor='middle'>📺</text></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// ===== Открыть режим просмотра =====
function openView(a){
    const view = document.getElementById('viewMode');
    const form = document.getElementById('formMode');
    view.style.display = 'block';
    form.style.display = 'none';

    const imageWrap = document.getElementById('viewImage');
    if(a.image_url){
        imageWrap.innerHTML = `<img src="${a.image_url}" onerror="this.src=defaultPoster()">`;
    } else {
        imageWrap.innerHTML = `<img src="${defaultPoster()}">`;
    }

    document.getElementById('viewName').textContent  = a.name;
    document.getElementById('viewName2').textContent = a.name;
    document.getElementById('viewGenre').textContent = a.genre || '—';
    document.getElementById('viewYear').textContent  = a.year || '—';
    document.getElementById('viewVoice').textContent = a.voice || '—';
    document.getElementById('viewDesc').textContent  = a.description || 'Без описания';
    document.getElementById('viewStatus').textContent  = a.status || '—';
    document.getElementById('viewStatus').className = 'badge st-' + (a.status||'').replace(/\s/g,'\\ ');
    document.getElementById('viewStatus2').textContent = a.status || '—';

    // данные для редактирования
    document.getElementById('editId').value = a.id;
    document.getElementById('fName').value   = a.name;
    document.getElementById('fGenre').value  = a.genre || '';
    document.getElementById('fYear').value   = a.year || '';
    document.getElementById('fVoice').value  = a.voice || '';
    document.getElementById('fImage').value  = a.image_url || '';
    document.getElementById('fStatus').value = a.status || 'Планирую';
    document.getElementById('fDesc').value   = a.description || '';

    document.getElementById('btnEdit').dataset.id = a.id;
    showModal();
}

// ===== Модалка: скрыть/показать =====
function showModal(){ document.getElementById('overlay').style.display = 'flex'; }
function closeModal(e){
    if(e && e.target !== e.currentTarget) return; // клик внутри модалки не закрывает
    document.getElementById('overlay').style.display = 'none';
}

// ===== Кнопки: добавить / редактировать =====
document.getElementById('btnAdd').addEventListener('click', () => {
    document.getElementById('formTitle').textContent = 'Добавить аниме';
    document.getElementById('editId').value = '';
    document.getElementById('fName').value = '';
    document.getElementById('fGenre').value = '';
    document.getElementById('fYear').value = '';
    document.getElementById('fVoice').value = '';
    document.getElementById('fImage').value = '';
    document.getElementById('fStatus').value = 'Планирую';
    document.getElementById('fDesc').value = '';

    document.getElementById('viewMode').style.display = 'none';
    document.getElementById('formMode').style.display = 'flex';
    showModal();
});

document.addEventListener('click', (e) => {
    if(e.target && e.target.id === 'btnEdit'){
        document.getElementById('formTitle').textContent = 'Редактировать';
        document.getElementById('viewMode').style.display = 'none';
        document.getElementById('formMode').style.display = 'flex';
        showModal();
    }
});

// ===== Сохранить (добавить или обновить) =====
document.getElementById('btnSave').addEventListener('click', async () => {
    const record = {
        name:        document.getElementById('fName').value.trim(),
        genre:       document.getElementById('fGenre').value.trim(),
        year:        parseInt(document.getElementById('fYear').value) || null,
        voice:       document.getElementById('fVoice').value.trim(),
        image_url:   document.getElementById('fImage').value.trim(),
        status:      document.getElementById('fStatus').value,
        description: document.getElementById('fDesc').value.trim(),
    };
    if(!record.name){ alert('Введите название аниме'); return; }

    const id = document.getElementById('editId').value;

    try{
        if(id){
            const { error } = await supabase.from('anime').update(record).eq('id', id);
            if(error) throw error;
        } else {
            const { error } = await supabase.from('anime').insert(record);
                  } else {
            const { error } = await supabase.from('anime').insert(record);
            if(error) throw error;
        }
        closeModal();
        loadAnime(); // перезагрузить список
    }catch(err){
        alert('Ошибка сохранения: ' + err.message);
    }
});

// ===== Редактирование из карточки (обработчик кнопки) =====
// (код выше уже содержит слушатель btnEdit через делегирование)

// ===== Поиск =====
searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value.trim();
    render();
});

// ===== Фильтры по статусу =====
document.querySelectorAll('#filters .chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('#filters .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentStatus = chip.dataset.status;
        render();
    });
});

// ===== Запуск =====
document.addEventListener('DOMContentLoaded', loadAnime);
