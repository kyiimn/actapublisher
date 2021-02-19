import ActaTextChar from './text/textchar';
import getHanjaDic from './hanja-data';

import { Subject, fromEvent } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import "../../css/pageobject/hanja.scss";

export default function selectHanja(textChar: ActaTextChar, x: number, y: number) {
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

    const hanjaList = getHanjaDic(textChar.char);
    const selectHanja$ = new Subject<{ textChar: ActaTextChar, hanjaChar: string }>();

    if (hanjaList.length > 0) {
        const _hanjaClose = () => {
            cover.remove();
            select.remove();
            selectHanja$.complete();
            return true;
        };

        const _hanjaReturnItem = () => {
            const selected = select.querySelector('.active .item.select');
            if (!selected) return false;
            const hanjaChar = selected.getAttribute('data-hanja');
            if (!hanjaChar) return false;

            selectHanja$.next({ textChar, hanjaChar });

            return _hanjaClose();
        };

        const _hanjaNextPage = () => {
            const allPage = Array.prototype.slice.call(select.querySelectorAll('ul') || []);
            let nowPage = select.querySelector('ul.active');
            if (nowPage) nowPage.classList.remove('active');

            const nowIdx = nowPage ? allPage.indexOf(nowPage) : -1;
            const nextPage = allPage[nowIdx + 1];
            if (nextPage) {
                nextPage.classList.add('active');
            } else {
                allPage[0].classList.add('active');
            }
            nowPage = select.querySelector('ul.active');
            if (nowPage) _hanjaSelectItem(nowPage.querySelector('li:first-child'));
        };

        const _hanjaPrevPage = () => {
            const allPage = Array.prototype.slice.call(select.querySelectorAll('ul') || []);
            let nowPage = select.querySelector('ul.active');
            if (nowPage) nowPage.classList.remove('active');

            const nowIdx = nowPage ? allPage.indexOf(nowPage) : allPage.length;
            const prevPage = allPage[nowIdx - 1];
            if (prevPage) {
                prevPage.classList.add('active');
            } else {
                allPage[allPage.length - 1].classList.add('active');
            }
            nowPage = select.querySelector('ul.active');
            if (nowPage) _hanjaSelectItem(nowPage.querySelector('li:first-child'));
        };

        const _hanjaSelectPrevItem = () => {
            const allItem = Array.prototype.slice.call(select.querySelectorAll('ul.active .item') || []);
            const nowItem = select.querySelector('ul.active .item.select');
            let nowIdx = -1, prevItem;
            if (nowItem) nowIdx = allItem.indexOf(nowItem);
            if (nowIdx < 1) {
                prevItem = allItem[allItem.length - 1];
            } else {
                prevItem = allItem[nowIdx - 1];
            }
            _hanjaSelectItem(prevItem);
        };

        const _hanjaSelectNextItem = () => {
            const allItem = Array.prototype.slice.call(select.querySelectorAll('ul.active .item') || []);
            const nowItem = select.querySelector('ul.active .item.select');
            let nowIdx = -1, nextItem;
            if (nowItem) nowIdx = allItem.indexOf(nowItem);
            if (nowIdx < 0 || nowIdx === allItem.length - 1) {
                nextItem = allItem[0];
            } else {
                nextItem = allItem[nowIdx + 1];
            }
            _hanjaSelectItem(nextItem);
        };

        const _hanjaSelectItem = (li: HTMLElement | null) => {
            if (!li) return;
            if (!li.parentElement) return;
            for (const cli of li.parentElement.querySelectorAll('.item.select')) {
                cli.classList.remove('select');
            }
            li.classList.add('select');
        };

        const cover = document.createElement('div');
        cover.classList.add('hanja-bodycover');

        const select = document.createElement('div');
        select.classList.add('hanja-select');
        select.style.left = `${x}px`;
        select.style.top = `${y + 2}px`;
        select.setAttribute('tabindex', '1');

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
            if (hanjaList.length > 9) {
                const next = document.createElement('li');
                next.classList.add('next');
                ul.append(next);
            }
            const click$ = fromEvent<MouseEvent>(ul, 'click').pipe(map(e => {
                e.preventDefault();
                return e.target as HTMLElement;
            }));
            click$.pipe(filter(el => el.classList.contains('item'))).subscribe(e => _hanjaReturnItem());
            click$.pipe(filter(el => el.classList.contains('next'))).subscribe(e => _hanjaNextPage());

            fromEvent<MouseEvent>(ul, 'mouseover').pipe(map(e => e.target as HTMLElement), filter(el => el.classList.contains('item'))).subscribe(el => _hanjaSelectItem(el));

            select.append(ul);
        }
        fromEvent<MouseEvent>(cover, 'click').subscribe(e => {
            e.preventDefault();
            _hanjaClose();
        });
        fromEvent<KeyboardEvent>(select, 'keydown').subscribe(e => {
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
            e.preventDefault();
        });
        select.focus();
    } else {
        selectHanja$.complete();
    }
    return selectHanja$;
};