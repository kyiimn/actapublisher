import { ActaTextChar } from './textchar';
import getHanjaDic from './hanja-data';

export default function selectHanja(textChar: ActaTextChar, x: number, y: number) {
    const hanjaList = getHanjaDic(textChar.char);

    return new Promise<{ textChar: ActaTextChar, hanjaChar: string }>((resolve, reject) => {
        let hanjaChar;
        if (hanjaList.length < 1) reject();

        
        hanjaChar = hanjaList[0][0];
        resolve({ textChar, hanjaChar });
    });
};