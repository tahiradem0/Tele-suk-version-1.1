/**
 * Client Ethiopian Calendar Utility for Mezgeb & Expense Management
 */

export const ETHIOPIAN_MONTHS_EN = [
    'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
    'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
];

export const ETHIOPIAN_MONTHS_AM = [
    'መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት',
    'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'
];

export function toEthiopianDate(gregorianDate, isAmharic = true) {
    const d = new Date(gregorianDate);
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = d.getMonth() + 1; // 1 - 12
    const day = d.getDate();

    let ethYear = year - 8;
    if (month < 9 || (month === 9 && day < 11)) {
        ethYear = year - 8;
    } else {
        ethYear = year - 7;
    }

    let ethMonthIndex = 0;
    let ethDay = day;

    if (month === 9) {
        if (day >= 11) {
            ethMonthIndex = 0; // Meskerem
            ethDay = day - 10;
        } else {
            ethMonthIndex = 12; // Pagume
            ethDay = day + 25;
        }
    } else if (month === 10) {
        if (day >= 11) {
            ethMonthIndex = 1; // Tikimt
            ethDay = day - 10;
        } else {
            ethMonthIndex = 0;
            ethDay = day + 20;
        }
    } else if (month === 11) {
        if (day >= 10) {
            ethMonthIndex = 2; // Hidar
            ethDay = day - 9;
        } else {
            ethMonthIndex = 1;
            ethDay = day + 21;
        }
    } else if (month === 12) {
        if (day >= 10) {
            ethMonthIndex = 3; // Tahsas
            ethDay = day - 9;
        } else {
            ethMonthIndex = 2;
            ethDay = day + 21;
        }
    } else if (month === 1) {
        if (day >= 9) {
            ethMonthIndex = 4; // Tir
            ethDay = day - 8;
        } else {
            ethMonthIndex = 3;
            ethDay = day + 22;
        }
    } else if (month === 2) {
        if (day >= 8) {
            ethMonthIndex = 5; // Yekatit
            ethDay = day - 7;
        } else {
            ethMonthIndex = 4;
            ethDay = day + 23;
        }
    } else if (month === 3) {
        if (day >= 10) {
            ethMonthIndex = 6; // Megabit
            ethDay = day - 9;
        } else {
            ethMonthIndex = 5;
            ethDay = day + 21;
        }
    } else if (month === 4) {
        if (day >= 9) {
            ethMonthIndex = 7; // Miazia
            ethDay = day - 8;
        } else {
            ethMonthIndex = 6;
            ethDay = day + 22;
        }
    } else if (month === 5) {
        if (day >= 9) {
            ethMonthIndex = 8; // Ginbot
            ethDay = day - 8;
        } else {
            ethMonthIndex = 7;
            ethDay = day + 22;
        }
    } else if (month === 6) {
        if (day >= 8) {
            ethMonthIndex = 9; // Sene
            ethDay = day - 7;
        } else {
            ethMonthIndex = 8;
            ethDay = day + 23;
        }
    } else if (month === 7) {
        if (day >= 8) {
            ethMonthIndex = 10; // Hamle
            ethDay = day - 7;
        } else {
            ethMonthIndex = 9;
            ethDay = day + 23;
        }
    } else if (month === 8) {
        if (day >= 7) {
            ethMonthIndex = 11; // Nehase
            ethDay = day - 6;
        } else {
            ethMonthIndex = 10;
            ethDay = day + 24;
        }
    }

    const monthNames = isAmharic ? ETHIOPIAN_MONTHS_AM : ETHIOPIAN_MONTHS_EN;
    return `${monthNames[ethMonthIndex]} ${ethDay}, ${ethYear}`;
}
