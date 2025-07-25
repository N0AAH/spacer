$(document).ready(function(){

    var scale = 60;
    var cargo_item = {};         // обʼєкт замість масиву
    var calc_items = {};         // обʼєкт замість масиву
    var gruz_colors = {};

    const MAX_LENGTH = 13.65;
    const MAX_WIDTH = 2.48;
    const MAX_HEIGHT = 3.0;

    function sanitizeAndValidateNumber(value) {
    // Замінити кому на крапку
    value = value.replace(',', '.');

    // Видалити всі символи, крім цифр і крапки
    value = value.replace(/[^0-9.]/g, '');

    // Видалити всі крапки, крім першої
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }

    // Валідний формат: число або число з крапкою
    if (!/^\d+(\.\d{1,2})?$/.test(value)) {
        return null;
    }

    return parseFloat(value);
}

// 🧩 ЗБЕРЕЖЕННЯ
function saveCargoObjectsToStorage() {
    const canvasData = [];
    const summaryData = [];

    $('.cargo_object').each(function () {
        const $this = $(this);
        canvasData.push({
            id: $this.attr('id'),
            key: $this.data('key'),
            top: parseFloat($this.css('top')),
            left: parseFloat($this.css('left')),
            width: $this.outerWidth(),
            height: $this.outerHeight(),
            color: $this.css('background-color')
        });
    });

    $('.created_cargo_places .items .item').each(function () {
        const $this = $(this);
        summaryData.push({
            key: $this.data('key'),
            quantity: parseInt($this.find('.quantity span').text())
        });
    });

    localStorage.setItem('cargo_canvas', JSON.stringify(canvasData));
    localStorage.setItem('cargo_summary', JSON.stringify(summaryData));
    localStorage.setItem('cargo_colors', JSON.stringify(gruz_colors));
}

// 🧩 ВІДНОВЛЕННЯ
function loadCargoObjectsFromStorage() {
    const canvasData = JSON.parse(localStorage.getItem('cargo_canvas') || '[]');
    const summaryData = JSON.parse(localStorage.getItem('cargo_summary') || '[]');
    gruz_colors = JSON.parse(localStorage.getItem('cargo_colors') || '{}');

    // Відновлення вантажних об'єктів
    canvasData.forEach(obj => {
        const $div = $([
            '<div id="' + obj.id + '"',
            ' class="cargo_object item_snap item_collision"',
            ' data-key="' + obj.key + '"',
            ' style="top:' + obj.top + 'px;',
            ' left:' + obj.left + 'px;',
            ' width:' + obj.width + 'px;',
            ' height:' + obj.height + 'px;',
            ' background-color:' + obj.color + ';',
            ' border:1px solid ' + obj.color + ';">',
            '<div class="dimensions">' + obj.key.replace('x', ' x ') + '</div>',
            '<div class="buttons">',
                '<img class="rotate" src="assets/templates/img/rotate.svg" alt="" />',
                '<img class="delete" src="assets/templates/img/delete.svg" alt="" />',
            '</div>',
            '</div>'
        ].join(''));

        $('.canvas').append($div);

        $div.draggable({
            snap: '.item_snap',
            snapTolerance: 15,
            preventCollision: true,
            obstacle: '.item_collision',
            drag: function () {
                $(this).removeClass('item_collision');
            },
            stop: function () {
                $(this).addClass('item_collision');
                saveCargoObjectsToStorage();
            }
        });
    });

    // Відновлення панелі "створені вантажні місця"
    const html_gruz = [];
    summaryData.forEach(obj => {
        html_gruz.push([
            '<div class="item" data-key="' + obj.key + '">',
            '<div class="dimensions">' + obj.key + '</div>',
            '<div class="void"></div>',
            '<div class="quantity"><span>' + obj.quantity + '</span> шт.</div>',
            '<img class="delete" src="assets/templates/img/delete.svg" alt="" />',
            '</div>'
        ].join(''));

        calc_items[obj.key] = obj.quantity;
    });

    $('.created_cargo_places .items').html(html_gruz.join(''));
}

// Видалення вантажу з canvas по одній одиниці
$('.canvas').delegate('.cargo_object .buttons .delete', 'click', function () {
    const $obj = $(this).closest('.cargo_object');
    const key = $obj.data('key');

    const $infoLine = $('.created_cargo_places .items .item[data-key="' + key + '"]');
    const count = parseInt($infoLine.find('.quantity span').text(), 10);

    if (count > 1) {
        $infoLine.find('.quantity span').text(count - 1);
        calc_items[key] = count - 1;
    } else {
        $infoLine.remove();
        delete calc_items[key];
    }

    $obj.remove();
    saveCargoObjectsToStorage();
});

// Видалення з правої панелі одразу всіх таких обʼєктів
$('.created_cargo_places .items').delegate('.item .delete', 'click', function () {
    const $g = $(this).closest('.item');
    const gkey = $g.attr('data-key');

    $('.cargo_object[data-key="' + gkey + '"]').remove();
    delete calc_items[gkey];
    $g.remove();
    saveCargoObjectsToStorage();
});

// Обертання
$('.canvas').delegate('.cargo_object .buttons .rotate', 'click', function () {
    const $obj = $(this).closest('.cargo_object');
    const w = $obj.width();
    const h = $obj.height();
    $obj.width(h + 2).height(w + 2);
    saveCargoObjectsToStorage();
});




    function showTooltip(text, x, y) {
        $('#ruler-tooltip')
            .text(text)
            .css({
                top: y + 10 + 'px',
                left: x + 10 + 'px',
                display: 'block',
                color: 'black'
            });
    }

    function hideTooltip() {
        $('#ruler-tooltip').hide();
    }

    function bindRulerEvents() {
    $('.ruler-horizontal, .ruler-vertical').unbind('mousemove mouseleave');

    $('.ruler-horizontal').mousemove(function (e) {
        var rect = this.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var value = (x / scale).toFixed(2);
        showTooltip(value + ' м', e.pageX, e.pageY);
    }).mouseleave(hideTooltip);

    $('.ruler-vertical').mousemove(function (e) {
        var rect = this.getBoundingClientRect();
        var y = e.clientY - rect.top;
        var value = (y / scale).toFixed(2);
        showTooltip(value + ' м', e.pageX, e.pageY);
    }).mouseleave(hideTooltip);
    }

    function initSelectable() {
        $('.visualization').selectable({
        appendTo: 'body', // дозволяє тягнути select в будь-якому місці сторінки
        filter: '.cargo_object',
        cancel: '.buttons, .buttons *, .bulk_action, .visualization_title',
        start: function () {
            $('.cargo_object').removeClass('ui-selected');
        },
        stop: function () {
            $('.cargo_object.ui-selected').each(function () {
            $(this).draggable({
                containment: '.canvas', // обмежує переміщення всередині canvas
                drag: multiDrag,
                start: initMultiDrag,
                stop: clearMultiDrag
            });
            });
        }
        });
    }

    function initMultiDrag(event, ui) {
    var $target = $(event.target);
    $target.data('dragStart', {
        top: ui.position.top,
        left: ui.position.left
    });

    $('.cargo_object.ui-selected').each(function () {
        var $this = $(this);
        $this.data('originalPosition', $this.position());
    });
    }

    function multiDrag(event, ui) {
    var $target = $(event.target);
    var dragStart = $target.data('dragStart');

    var dx = ui.position.left - dragStart.left;
    var dy = ui.position.top - dragStart.top;

    $('.cargo_object.ui-selected').not($target).each(function () {
        var $this = $(this);
        var original = $this.data('originalPosition');
        $this.css({
        top: original.top + dy,
        left: original.left + dx
        });
    });
    }

    function clearMultiDrag() {
    $('.cargo_object.ui-selected').removeData('originalPosition').removeData('dragStart');
    }   
    
    initSelectable(); // одразу при завантаженні

    $('.cargo_space .panel .inputs label input, .cargo_place .panel .inputs label input').bind('keyup', function(){
        var v = $(this).val();
        v = v.replace(',', '.');
        $(this).val(v);
    });

    $('.space_templates .item').bind('click', function(){
    var cargoText = $(this).find('.dimensions').text();
    var cargo = cargoText.split(' x ');

    var length = sanitizeAndValidateNumber(cargo[0]);
    var width = sanitizeAndValidateNumber(cargo[1]);
    var height = sanitizeAndValidateNumber(cargo[2]);

    if (length === null || width === null || height === null) {
        alert('Шаблон містить некоректні значення.');
        return;
    }

    // Обмеження
    if (length > 13.65 || width > 2.48 || height > 3) {
        alert('Максимальні розміри: 13.65м x 2.48м x 3м');
        return;
    }

    $('input[name="space_length"]').val(length);
    $('input[name="space_width"]').val(width);
    $('input[name="space_height"]').val(height);

    localStorage.setItem('space_length', length);
    localStorage.setItem('space_width', width);
    localStorage.setItem('space_height', height);

    var txt = buildCargoText(length, width, height);
    $('.selected_space_data').html(txt);

    cargo_item.size = { d: length, s: width, v: height };
    render_cargo_item();
    loadCargoObjectsFromStorage();
});

    $('.cargo_space .space_button .create').bind('click', function () {
    var raw_length = $('input[name="space_length"]').val().trim();
    var raw_width = $('input[name="space_width"]').val().trim();
    var raw_height = $('input[name="space_height"]').val().trim();

    var length = sanitizeAndValidateNumber(raw_length);
    var width = sanitizeAndValidateNumber(raw_width);
    var height = sanitizeAndValidateNumber(raw_height);

    if (length === null || width === null || height === null) {
        alert('Введіть коректні числа. Приклад: 13.65 або 2,5');
        return;
    }

    // Обмеження
    if (length > 13.65 || width > 2.48 || height > 3) {
        alert('Максимальні розміри: 13.65м x 2.48м x 3м');
        return;
    }

    $('input[name="space_length"]').val(length);
    $('input[name="space_width"]').val(width);
    $('input[name="space_height"]').val(height);

    localStorage.setItem('space_length', length);
    localStorage.setItem('space_width', width);
    localStorage.setItem('space_height', height);
    localStorage.setItem('space_created', 'true');

    var txt = buildCargoText(length, width, height);
    $('.selected_space_data').html(txt);

    cargo_item.size = { d: length, s: width, v: height };

    togglePanels(function () {
        render_cargo_item();
        bindRulerEvents(); 
    });
});



    $('.cargo_space .selected .edit').bind('click', function(){
        togglePanels();
        // Підставити збережені значення з localStorage у поля
        $('input[name="space_length"]').val(localStorage.getItem('space_length') || '');
        $('input[name="space_width"]').val(localStorage.getItem('space_width') || '');
        $('input[name="space_height"]').val(localStorage.getItem('space_height') || '');

    });

    $('.cargo_templates .item').bind('click', function(){
        var gruzText = $(this).find('.dimensions').text();
        var gruz = gruzText.split(' x ');
        $('input[name="cargo_length"]').val(gruz[0].replace(/[^\d.]/g, ''));
        $('input[name="cargo_width"]').val(gruz[1].replace(/[^\d.]/g, ''));
        $('input[name="cargo_height"]').val(gruz[2].replace(/[^\d.]/g, ''));
    });

    $('.cargo_place .cargo_button .add').bind('click', function () {
    const raw_d = $('input[name="cargo_length"]').val().trim();
    const raw_s = $('input[name="cargo_width"]').val().trim();
    const raw_v = $('input[name="cargo_height"]').val().trim();
    const raw_c = $('input[name="cargo_quantity"]').val().trim();

    const item_d = sanitizeAndValidateNumber(raw_d);
    const item_s = sanitizeAndValidateNumber(raw_s);
    const item_v = sanitizeAndValidateNumber(raw_v);
    const item_c = parseInt(raw_c);

    // Перевірка на валідність
    if (item_d === null || item_s === null || item_v === null || isNaN(item_c)) {
        alert('Усі поля мають бути валідними числами. Приклад: 1.2 або 0,8');
        return;
    }

    // Обмеження розмірів
    if (item_d > MAX_LENGTH || item_s > MAX_WIDTH || item_v > MAX_HEIGHT) {
        alert(`Максимальні розміри вантажу: ${MAX_LENGTH}м x ${MAX_WIDTH}м x ${MAX_HEIGHT}м`);
        return;
    }

    // Кількість
    if (item_c <= 0) {
        alert('Кількість вантажу має бути додатнім числом.');
        return;
    }

    if (item_c > 34) {
        alert('Максимальна кількість за раз — 34.');
        return;
    }

    // Формуємо ключ
    const gruzKey = item_d + ' x ' + item_s + ' x ' + item_v;

    if (calc_items.hasOwnProperty(gruzKey)) {
        calc_items[gruzKey] += item_c;
    } else {
        calc_items[gruzKey] = item_c;
    }

    // Зберігаємо очищені значення назад в input (опційно)
    $('input[name="cargo_length"]').val(item_d);
    $('input[name="cargo_width"]').val(item_s);
    $('input[name="cargo_height"]').val(item_v);
    $('input[name="cargo_quantity"]').val(item_c);

    calc_gruz(item_c, gruzKey);
});



    function togglePanels(callback) {
        $('.cargo_space .space').slideToggle();
        $('.cargo_place').slideToggle();
        $('.visualization').slideToggle(function () {
            $('.visualization').css('overflow', 'visible');
            if (typeof callback === 'function') {
                callback();
            }
        });
    }

    function buildCargoText(d, s, v) {
    return `
        <div class="cargo_row"><span class="cargo_space_length_text">Довжина:</span><span class="cargo_space_length_value">${d}м</span></div>
        <div class="cargo_row"><span class="cargo_space_width_text">Ширина:</span><span class="cargo_space_width_value">${s}м</span></div>
        <div class="cargo_row"><span class="cargo_space_height_text">Висота:</span><span class="cargo_space_height_value">${v}м</span></div>
    `;
    }

    function calc_gruz(item_c, gruzKey) {

        var html_gruz = [];
        var offset_x = 0;
        var offset_y = 0;
        var offset_top = 0;

        for (var key in calc_items) {
            if (!calc_items.hasOwnProperty(key)) continue;

            if (gruz_colors.hasOwnProperty(key)) {
            color = gruz_colors[key];
            } else {
                color = get_random_color();
                gruz_colors[key] = color;
            }

            html_gruz.push(
                '<div class="item" data-key="' + key + '">' +
                '<div class="dimensions">' + key + '</div>' +
                '<div class="void"></div>' +
                '<div class="quantity"><span>' + calc_items[key] + '</span> шт.</div>' +
                '<img class="delete" src="assets/templates/img/delete.svg" alt="" />' +
                '</div>'
            );

            var size = key.split('x');
            var gruz_d = parseFloat(size[0]);
            var gruz_s = parseFloat(size[1]);
            var gruz_v = parseFloat(size[2]);

            var gruz_c = calc_items[key];

            if (key === gruzKey) {
                for (var i = 0; i < item_c; i++) {

                    var offset_left = offset_x;

                    if (($('.canvas').width() - offset_left) < gruz_d * scale && i > 1) {
                        offset_x = 0;
                        offset_left = $('.cargo_item').width() + 50;
                        offset_y += gruz_s * scale + 10;
                        offset_top = offset_y;
                        $('.visualization').css('min-height', (offset_top + 150) + 'px');
                    }

                    offset_x += gruz_d * scale + 10;

                    var id = get_random_id();
                    // var color = get_random_color();

                    var div = [
                        '<div id="' + id + '"',
                            ' class="cargo_object item_snap item_collision"',
                            ' data-key="' + key + '"',
                            ' style="top: ' + offset_top + 'px;',
                            ' left: ' + offset_left + 'px;',
                            ' width: ' + (gruz_d * scale) + 'px;',
                            ' height: ' + (gruz_s * scale) + 'px;',
                            ' background-color: ' + color + ';',
                            ' border: 1px solid ' + color + ';">',
                            '<div class="dimensions">' + key.replace('x', ' x ') + '</div>',
                            '<div class="buttons">',
                                '<img class="rotate" src="assets/templates/img/rotate.svg" alt="" />',
                                '<img class="delete" src="assets/templates/img/delete.svg" alt="" />',
                            '</div>',
                        '</div>'
                    ].join('');

                    $('.canvas').append(div);

                    $('#' + id).draggable({
                        snap: '.item_snap',
                        snapTolerance: 15,
                        preventCollision: true,
                        obstacle: '.item_collision',
                        drag: function(){
                            $(this).removeClass('item_collision');
                        },
                        stop: function(){
                            $(this).addClass('item_collision');
                            saveCargoObjectsToStorage(); // ← додаємо це тут
                        }
                    });
                }
            }
        }

        $('.created_cargo_places .items').html(html_gruz.join(''));

        saveCargoObjectsToStorage();
    }

    function get_random_color() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    function get_random_id() {
        var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var id = '';
        for (var i = 0; i < 10; i++) {
            id += letters[Math.floor(Math.random() * letters.length)];
        }
        return id;
    }

    function render_cargo_item() {

        if (!cargo_item.size) return;

        const d = parseFloat(cargo_item.size.d);
        const s = parseFloat(cargo_item.size.s);

        const px_d = d * scale;
        const px_s = s * scale;

        $('.canvas').css({
            width: px_d + 'px',
            height: px_s + 'px'
        });

        $('.canvas').empty();

        const $cargo_item = $(`
            <div class="cargo_item item_snap" style="width: ${px_d}px; height: ${px_s}px;">
                <div class="ruler ruler-horizontal"></div>
                <div class="ruler ruler-vertical"></div>
            </div>
        `);

        $('.canvas').append($cargo_item);

        // Горизонтальна лінійка (кожні 0.1м, підписи кожні 0.5м)
        const stepCount = Math.round(d * 10); // 10 кроків на кожен метр (0.1 м = 10 см)
        for (let i = 0; i <= stepCount; i++) {
            const value = i / 10;
            const left = value * scale;
            const isMajor = i % 5 === 0; // кожні 0.5 м (5 * 0.1)
            const tickClass = isMajor ? 'tick major' : 'tick minor';
            const label = isMajor ? `${value.toFixed(1)}` : '';

            $cargo_item.find('.ruler-horizontal').append(
                `<div class="${tickClass}" style="left: ${left}px;">${label}</div>`
            );
        }

        // Вертикальна лінійка (кожні 0.1м, підписи кожні 0.5м)
        const stepCountV = Math.round(s * 10);
        for (let j = 0; j <= stepCountV; j++) {
            const value = j / 10;
            const top = value * scale;
            const isMajor = j % 5 === 0;
            const tickClass = isMajor ? 'tick major' : 'tick minor';
            const label = isMajor ? `${value.toFixed(1)}` : '';

            $cargo_item.find('.ruler-vertical').append(
                `<div class="${tickClass}" style="top: ${top}px;">${label}</div>`
            );
        }
        loadCargoObjectsFromStorage();
    }

    $(document).keydown(function(e) {
    if ((e.key === 'Delete' || e.keyCode === 46) && $('.cargo_object.ui-selected').length > 0) {
        $('#delete_selected').trigger('click');
    }
    
    });

    $('#delete_selected').bind('click', function () {
        $('.cargo_object.ui-selected').each(function () {
            const $obj = $(this);
            const key = $obj.data('key');

            // Оновити лічильник
            const $infoLine = $('.created_cargo_places .items .item[data-key="' + key + '"]');
            const count = parseInt($infoLine.find('.quantity span').text(), 10);

            if (count > 1) {
            $infoLine.find('.quantity span').text(count - 1);
            calc_items[key] = count - 1;
            } else {
            $infoLine.remove();
            delete calc_items[key];
            }
            $obj.remove();
            saveCargoObjectsToStorage();
        });
    }); 

    if (!localStorage.getItem('cargo_canvas')) {
        const len = sanitizeAndValidateNumber(localStorage.getItem('space_length'));
        const wid = sanitizeAndValidateNumber(localStorage.getItem('space_width'));
        const hei = sanitizeAndValidateNumber(localStorage.getItem('space_height'));

        if (len !== null && len <= MAX_LENGTH) $('input[name="space_length"]').val(len);
        if (wid !== null && wid <= MAX_WIDTH)  $('input[name="space_width"]').val(wid);
        if (hei !== null && hei <= MAX_HEIGHT) $('input[name="space_height"]').val(hei);
    }


    if (localStorage.getItem('space_created') === 'true') {
    // автоматичний перехід у Стан 2
    const space_length = localStorage.getItem('space_length');
    const space_width = localStorage.getItem('space_width');
    const space_height = localStorage.getItem('space_height');

    const len = sanitizeAndValidateNumber(space_length);
    const wid = sanitizeAndValidateNumber(space_width);
    const hei = sanitizeAndValidateNumber(space_height);

    if (
        len !== null && wid !== null && hei !== null &&
        len <= MAX_LENGTH && wid <= MAX_WIDTH && hei <= MAX_HEIGHT
    ) {
        cargo_item.size = { d: len, s: wid, v: hei };

        const txt = buildCargoText(len, wid, hei);
        $('.selected_space_data').html(txt);

        togglePanels(function () {
            render_cargo_item();
            bindRulerEvents();
        });
    } else {
        // ❗️ Очистити поламані значення
        resetAllData();
        alert('Збережені розміри простору були некоректними або перевищували допустимі межі. Дані скинуто.');
    }
}

function resetAllData() {
    // 1. Очистити LocalStorage
    localStorage.removeItem('cargo_canvas');
    localStorage.removeItem('cargo_summary');
    localStorage.removeItem('space_length');
    localStorage.removeItem('space_width');
    localStorage.removeItem('space_height');
    localStorage.removeItem('cargo_colors');
    localStorage.removeItem('space_created'); // ← додано

    // 2. Очистити глобальні змінні
    calc_items = {};
    gruz_colors = {};
    cargo_item = {};


    $('input[name="space_length"]').val('');
    $('input[name="space_width"]').val('');
    $('input[name="space_height"]').val('');

    // 3. Очистити DOM
    $('.canvas').empty();
    $('.created_cargo_places .items').empty();
    $('.selected_space_data').empty();

    // 4. Повернутися у Стан 1 (показати панель створення простору)
    $('.cargo_space .space').show();
    $('.cargo_space .selected').hide();       // ← додано!
    $('.cargo_place').hide();
    $('.visualization').hide();
}

$('#reset_data').bind('click', function () {
    if (confirm('Ви впевнені, що хочете очистити всі дані?')) {
        resetAllData();
    }
});

});