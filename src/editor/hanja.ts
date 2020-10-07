import { ActaTextChar } from './textchar';
import getHanjaDic from './hanja-data';

export default function selectHanja(textChar: ActaTextChar, x: number, y: number) {
    const hanjaList = getHanjaDic(textChar.char);

	const KEY_ENTER = 13;
	const KEY_UP = 38;
	const KEY_DOWN = 40;
	const KEY_LEFT = 37;
	const KEY_RIGHT = 39;
	const KEY_ESC = 27;
	const KEY_1 = 49;
	const KEY_2 = 50;
	const KEY_3 = 51;
	const KEY_4 = 52;
	const KEY_5 = 53;
	const KEY_6 = 54;
	const KEY_7 = 55;
	const KEY_8 = 56;
	const KEY_9 = 57;

    return new Promise<{ textChar: ActaTextChar, hanjaChar: string }>((resolve, reject) => {
        if (hanjaList.length < 1) reject();

        const _hanjaClose = () => {
            cover.remove();
            select.remove();
            reject();
            return false;
        };

        const _hanjaReturnItem = () => {
            const selected = select.querySelector('.active .item.select');
            if (!selected) return false;
            const hanjaChar = selected.getAttribute('data-hanja');
            if (!hanjaChar) return false;

            cover.remove();
            select.remove();

            resolve({ textChar, hanjaChar });
            
            return false;
        };

        const _hanjaNextPage = () => {
            var now = this._dialog.find('.active');
            now.removeClass('active');
            if (now.next().length > 0) {
                now.next().addClass('active');
            } else {
                this._dialog.find('ul:first-child').addClass('active');
            }
            $(this._dialog).find('.item.select').removeClass('select');
            $(this._dialog).find('.active .item:first-child').addClass('select');
    
        };
        const _hanjaPrevPage = () => {
            var now = this._dialog.find('.active');
            now.removeClass('active');
            if (now.prev().length > 0) {
                now.prev().addClass('active');
            } else {
                this._dialog.find('ul:last-child').addClass('active');
            }
            $(this._dialog).find('.item.select').removeClass('select');
            $(this._dialog).find('.active .item:first-child').addClass('select');
    
        };
        const _hanjaSelectPrevItem = () => {
            $(self._dialog).find('.item.select').removeClass('select');
            if (now.prev().length > 0) {
                now.prev().addClass('select');
            } else {
                $(self._dialog).find('.active .item:last-child').prev().addClass('select');
            }

        };
        const _hanjaSelectNextItem = () => {
            $(self._dialog).find('.item.select').removeClass('select');
            if (now.next().length > 0 && now.next().attr('data-next') != '1') {
                now.next().addClass('select');
            } else {
                $(self._dialog).find('.active .item:first-child').addClass('select');
            }

        };
        const _hanjaSelectItem = (li: HTMLLIElement | null) => {
            if (!li) return false;
            if (!li.parentElement) return false;
            for (const cli of li.parentElement.querySelectorAll('li.select')) {
                cli.classList.remove('select');
            }
            li.classList.add('select');
            return false;
        };

        const cover = document.createElement('div');
        cover.classList.add('hanja-bodycover');

        const select = document.createElement('div');
        select.classList.add('hanja-select');
        select.style.left = `${x}px`;
        select.style.top = `${y + 2}px`;
        select.setAttribute('tab-index', '1');

        document.body.append(cover);
        document.body.append(select);

        for (let i = 0; i < hanjaList.length; i += 9) {
            const ul = document.createElement('ul');
            if (i === 0) ul.classList.add('active');
            for (let j = 0; j < 9; j++) {
                const hanja = hanjaList[i + j];
                if (!hanja) break;

                const li = document.createElement('li');
                li.classList.add('item');
                li.setAttribute('data-hanja', hanja[0]);
                li.addEventListener('mouseover', e => _hanjaSelectItem(e.currentTarget as HTMLLIElement));
                li.addEventListener('mousedown', e => _hanjaReturnItem());

                const dt = document.createElement('dt');
                dt.innerHTML = hanja[0];
                li.append(dt);

                if (hanja[1]) {
                    const dl = document.createElement('dl');
                    dl.innerHTML = `${hanja[1]} ${textChar.char}`;
                    li.append(dl);
                }
                ul.append(li);
            }
            const next = document.createElement('li');
            next.classList.add('item');
            next.setAttribute('data-next', '1');
            next.addEventListener('mousedown', e => _hanjaNextPage());
            ul.append(next);

            select.append(ul);
        }
        cover.addEventListener('mousedown', e => _hanjaClose());
        select.addEventListener('keydown', e => {
            switch (e.which) {
                case KEY_ESC: _hanjaClose(); break;
                case KEY_ENTER: _hanjaReturnItem(); break;
                case KEY_LEFT: _hanjaPrevPage(); break;
                case KEY_RIGHT: _hanjaNextPage(); break;
                case KEY_UP: _hanjaSelectPrevItem(); break;
                case KEY_DOWN: _hanjaSelectNextItem(); break;
				case KEY_1: case KEY_2: case KEY_3: case KEY_4: case KEY_5: case KEY_5: case KEY_6: case KEY_7: case KEY_8: case KEY_9:
                    _hanjaSelectItem(select.querySelector(`.active .item:nth-child(${e.which - 48})`));
                    _hanjaReturnItem();
                    break;
            }
        })
        select.focus();
    });
};