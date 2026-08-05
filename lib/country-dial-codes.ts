/**
 * Dialing codes keyed by the same English names as `COUNTRY_NAMES`.
 * `abbr` is ISO-style short label shown in the phone UI; `dial` is digits only (no +).
 */
export type CountryDialInfo = {
  abbr: string;
  dial: string;
};

export const COUNTRY_DIAL_BY_NAME: Record<string, CountryDialInfo> = {
  Afghanistan: { abbr: 'AF', dial: '93' },
  Albania: { abbr: 'AL', dial: '355' },
  Algeria: { abbr: 'DZ', dial: '213' },
  Andorra: { abbr: 'AD', dial: '376' },
  Angola: { abbr: 'AO', dial: '244' },
  'Antigua and Barbuda': { abbr: 'AG', dial: '1268' },
  Argentina: { abbr: 'AR', dial: '54' },
  Armenia: { abbr: 'AM', dial: '374' },
  Australia: { abbr: 'AU', dial: '61' },
  Austria: { abbr: 'AT', dial: '43' },
  Azerbaijan: { abbr: 'AZ', dial: '994' },
  Bahamas: { abbr: 'BS', dial: '1242' },
  Bahrain: { abbr: 'BH', dial: '973' },
  Bangladesh: { abbr: 'BD', dial: '880' },
  Barbados: { abbr: 'BB', dial: '1246' },
  Belarus: { abbr: 'BY', dial: '375' },
  Belgium: { abbr: 'BE', dial: '32' },
  Belize: { abbr: 'BZ', dial: '501' },
  Benin: { abbr: 'BJ', dial: '229' },
  Bhutan: { abbr: 'BT', dial: '975' },
  Bolivia: { abbr: 'BO', dial: '591' },
  'Bosnia and Herzegovina': { abbr: 'BA', dial: '387' },
  Botswana: { abbr: 'BW', dial: '267' },
  Brazil: { abbr: 'BR', dial: '55' },
  Brunei: { abbr: 'BN', dial: '673' },
  Bulgaria: { abbr: 'BG', dial: '359' },
  'Burkina Faso': { abbr: 'BF', dial: '226' },
  Burundi: { abbr: 'BI', dial: '257' },
  Cambodia: { abbr: 'KH', dial: '855' },
  Cameroon: { abbr: 'CM', dial: '237' },
  Canada: { abbr: 'CA', dial: '1' },
  'Cape Verde': { abbr: 'CV', dial: '238' },
  'Central African Republic': { abbr: 'CF', dial: '236' },
  Chad: { abbr: 'TD', dial: '235' },
  Chile: { abbr: 'CL', dial: '56' },
  China: { abbr: 'CN', dial: '86' },
  Colombia: { abbr: 'CO', dial: '57' },
  Comoros: { abbr: 'KM', dial: '269' },
  Congo: { abbr: 'CG', dial: '242' },
  'Costa Rica': { abbr: 'CR', dial: '506' },
  Croatia: { abbr: 'HR', dial: '385' },
  Cuba: { abbr: 'CU', dial: '53' },
  Cyprus: { abbr: 'CY', dial: '357' },
  'Czech Republic': { abbr: 'CZ', dial: '420' },
  "Côte d'Ivoire": { abbr: 'CI', dial: '225' },
  'Democratic Republic of the Congo': { abbr: 'CD', dial: '243' },
  Denmark: { abbr: 'DK', dial: '45' },
  Djibouti: { abbr: 'DJ', dial: '253' },
  Dominica: { abbr: 'DM', dial: '1767' },
  'Dominican Republic': { abbr: 'DO', dial: '1809' },
  Ecuador: { abbr: 'EC', dial: '593' },
  Egypt: { abbr: 'EG', dial: '20' },
  'El Salvador': { abbr: 'SV', dial: '503' },
  'Equatorial Guinea': { abbr: 'GQ', dial: '240' },
  Eritrea: { abbr: 'ER', dial: '291' },
  Estonia: { abbr: 'EE', dial: '372' },
  Eswatini: { abbr: 'SZ', dial: '268' },
  Ethiopia: { abbr: 'ET', dial: '251' },
  Fiji: { abbr: 'FJ', dial: '679' },
  Finland: { abbr: 'FI', dial: '358' },
  France: { abbr: 'FR', dial: '33' },
  Gabon: { abbr: 'GA', dial: '241' },
  Gambia: { abbr: 'GM', dial: '220' },
  Georgia: { abbr: 'GE', dial: '995' },
  Germany: { abbr: 'DE', dial: '49' },
  Ghana: { abbr: 'GH', dial: '233' },
  Greece: { abbr: 'GR', dial: '30' },
  Grenada: { abbr: 'GD', dial: '1473' },
  Guatemala: { abbr: 'GT', dial: '502' },
  Guinea: { abbr: 'GN', dial: '224' },
  'Guinea-Bissau': { abbr: 'GW', dial: '245' },
  Guyana: { abbr: 'GY', dial: '592' },
  Haiti: { abbr: 'HT', dial: '509' },
  Honduras: { abbr: 'HN', dial: '504' },
  Hungary: { abbr: 'HU', dial: '36' },
  Iceland: { abbr: 'IS', dial: '354' },
  India: { abbr: 'IN', dial: '91' },
  Indonesia: { abbr: 'ID', dial: '62' },
  Iran: { abbr: 'IR', dial: '98' },
  Iraq: { abbr: 'IQ', dial: '964' },
  Ireland: { abbr: 'IE', dial: '353' },
  Israel: { abbr: 'IL', dial: '972' },
  Italy: { abbr: 'IT', dial: '39' },
  Jamaica: { abbr: 'JM', dial: '1876' },
  Japan: { abbr: 'JP', dial: '81' },
  Jordan: { abbr: 'JO', dial: '962' },
  Kazakhstan: { abbr: 'KZ', dial: '7' },
  Kenya: { abbr: 'KE', dial: '254' },
  Kiribati: { abbr: 'KI', dial: '686' },
  Kuwait: { abbr: 'KW', dial: '965' },
  Kyrgyzstan: { abbr: 'KG', dial: '996' },
  Laos: { abbr: 'LA', dial: '856' },
  Latvia: { abbr: 'LV', dial: '371' },
  Lebanon: { abbr: 'LB', dial: '961' },
  Lesotho: { abbr: 'LS', dial: '266' },
  Liberia: { abbr: 'LR', dial: '231' },
  Libya: { abbr: 'LY', dial: '218' },
  Liechtenstein: { abbr: 'LI', dial: '423' },
  Lithuania: { abbr: 'LT', dial: '370' },
  Luxembourg: { abbr: 'LU', dial: '352' },
  Madagascar: { abbr: 'MG', dial: '261' },
  Malawi: { abbr: 'MW', dial: '265' },
  Malaysia: { abbr: 'MY', dial: '60' },
  Maldives: { abbr: 'MV', dial: '960' },
  Mali: { abbr: 'ML', dial: '223' },
  Malta: { abbr: 'MT', dial: '356' },
  'Marshall Islands': { abbr: 'MH', dial: '692' },
  Mauritania: { abbr: 'MR', dial: '222' },
  Mauritius: { abbr: 'MU', dial: '230' },
  Mexico: { abbr: 'MX', dial: '52' },
  Micronesia: { abbr: 'FM', dial: '691' },
  Moldova: { abbr: 'MD', dial: '373' },
  Monaco: { abbr: 'MC', dial: '377' },
  Mongolia: { abbr: 'MN', dial: '976' },
  Montenegro: { abbr: 'ME', dial: '382' },
  Morocco: { abbr: 'MA', dial: '212' },
  Mozambique: { abbr: 'MZ', dial: '258' },
  Myanmar: { abbr: 'MM', dial: '95' },
  Namibia: { abbr: 'NA', dial: '264' },
  Nauru: { abbr: 'NR', dial: '674' },
  Nepal: { abbr: 'NP', dial: '977' },
  Netherlands: { abbr: 'NL', dial: '31' },
  'New Zealand': { abbr: 'NZ', dial: '64' },
  Nicaragua: { abbr: 'NI', dial: '505' },
  Niger: { abbr: 'NE', dial: '227' },
  Nigeria: { abbr: 'NG', dial: '234' },
  'North Korea': { abbr: 'KP', dial: '850' },
  'North Macedonia': { abbr: 'MK', dial: '389' },
  Norway: { abbr: 'NO', dial: '47' },
  Oman: { abbr: 'OM', dial: '968' },
  Pakistan: { abbr: 'PK', dial: '92' },
  Palau: { abbr: 'PW', dial: '680' },
  Palestine: { abbr: 'PS', dial: '970' },
  Panama: { abbr: 'PA', dial: '507' },
  'Papua New Guinea': { abbr: 'PG', dial: '675' },
  Paraguay: { abbr: 'PY', dial: '595' },
  Peru: { abbr: 'PE', dial: '51' },
  Philippines: { abbr: 'PH', dial: '63' },
  Poland: { abbr: 'PL', dial: '48' },
  Portugal: { abbr: 'PT', dial: '351' },
  Qatar: { abbr: 'QA', dial: '974' },
  Romania: { abbr: 'RO', dial: '40' },
  Russia: { abbr: 'RU', dial: '7' },
  Rwanda: { abbr: 'RW', dial: '250' },
  'Saint Kitts and Nevis': { abbr: 'KN', dial: '1869' },
  'Saint Lucia': { abbr: 'LC', dial: '1758' },
  'Saint Vincent and the Grenadines': { abbr: 'VC', dial: '1784' },
  Samoa: { abbr: 'WS', dial: '685' },
  'San Marino': { abbr: 'SM', dial: '378' },
  'Sao Tome and Principe': { abbr: 'ST', dial: '239' },
  'Saudi Arabia': { abbr: 'SA', dial: '966' },
  Senegal: { abbr: 'SN', dial: '221' },
  Serbia: { abbr: 'RS', dial: '381' },
  Seychelles: { abbr: 'SC', dial: '248' },
  'Sierra Leone': { abbr: 'SL', dial: '232' },
  Singapore: { abbr: 'SG', dial: '65' },
  Slovakia: { abbr: 'SK', dial: '421' },
  Slovenia: { abbr: 'SI', dial: '386' },
  'Solomon Islands': { abbr: 'SB', dial: '677' },
  Somalia: { abbr: 'SO', dial: '252' },
  'South Africa': { abbr: 'ZA', dial: '27' },
  'South Korea': { abbr: 'KR', dial: '82' },
  'South Sudan': { abbr: 'SS', dial: '211' },
  Spain: { abbr: 'ES', dial: '34' },
  'Sri Lanka': { abbr: 'LK', dial: '94' },
  Sudan: { abbr: 'SD', dial: '249' },
  Suriname: { abbr: 'SR', dial: '597' },
  Sweden: { abbr: 'SE', dial: '46' },
  Switzerland: { abbr: 'CH', dial: '41' },
  Syria: { abbr: 'SY', dial: '963' },
  Taiwan: { abbr: 'TW', dial: '886' },
  Tajikistan: { abbr: 'TJ', dial: '992' },
  Tanzania: { abbr: 'TZ', dial: '255' },
  Thailand: { abbr: 'TH', dial: '66' },
  'Timor-Leste': { abbr: 'TL', dial: '670' },
  Togo: { abbr: 'TG', dial: '228' },
  Tonga: { abbr: 'TO', dial: '676' },
  'Trinidad and Tobago': { abbr: 'TT', dial: '1868' },
  Tunisia: { abbr: 'TN', dial: '216' },
  Turkey: { abbr: 'TR', dial: '90' },
  Turkmenistan: { abbr: 'TM', dial: '993' },
  Tuvalu: { abbr: 'TV', dial: '688' },
  Uganda: { abbr: 'UG', dial: '256' },
  Ukraine: { abbr: 'UA', dial: '380' },
  'United Arab Emirates': { abbr: 'AE', dial: '971' },
  'United Kingdom': { abbr: 'GB', dial: '44' },
  'United States': { abbr: 'US', dial: '1' },
  Uruguay: { abbr: 'UY', dial: '598' },
  Uzbekistan: { abbr: 'UZ', dial: '998' },
  Vanuatu: { abbr: 'VU', dial: '678' },
  'Vatican City': { abbr: 'VA', dial: '379' },
  Venezuela: { abbr: 'VE', dial: '58' },
  Vietnam: { abbr: 'VN', dial: '84' },
  Yemen: { abbr: 'YE', dial: '967' },
  Zambia: { abbr: 'ZM', dial: '260' },
  Zimbabwe: { abbr: 'ZW', dial: '263' },
};

const DIAL_ENTRIES = Object.entries(COUNTRY_DIAL_BY_NAME)
  .map(([name, info]) => ({ name, ...info }))
  .sort((a, b) => b.dial.length - a.dial.length);

export function dialInfoForCountry(country: string | null | undefined): CountryDialInfo {
  const key = country?.trim() ?? '';
  return COUNTRY_DIAL_BY_NAME[key] ?? { abbr: 'INT', dial: '' };
}

/**
 * Build E.164-style number: strip non-digits, drop national trunk `0`,
 * e.g. dial `233` + `0209277789` → `+233209277789`.
 */
export function composeInternationalPhone(
  dialDigits: string,
  nationalRaw: string,
): string {
  const dial = dialDigits.replace(/\D/g, '');
  let national = nationalRaw.replace(/\D/g, '');
  national = national.replace(/^0+/, '');
  if (!dial && !national) return '';
  if (!national) return dial ? `+${dial}` : '';
  if (!dial) return `+${national}`;
  return `+${dial}${national}`;
}

export function splitStoredPhone(
  phoneRaw: string | null | undefined,
  countryHint?: string | null,
): { dial: string; national: string; abbr: string } {
  const raw = (phoneRaw ?? '').trim();
  const digits = raw.replace(/\D/g, '');
  const hint = dialInfoForCountry(countryHint);

  if (!digits) {
    return { dial: hint.dial, national: '', abbr: hint.abbr };
  }

  for (const entry of DIAL_ENTRIES) {
    if (digits.startsWith(entry.dial) && digits.length > entry.dial.length) {
      return {
        dial: entry.dial,
        national: digits.slice(entry.dial.length),
        abbr: entry.abbr,
      };
    }
  }

  if (hint.dial && digits.startsWith(hint.dial)) {
    return {
      dial: hint.dial,
      national: digits.slice(hint.dial.length),
      abbr: hint.abbr,
    };
  }

  if (hint.dial) {
    return { dial: hint.dial, national: digits, abbr: hint.abbr };
  }

  return { dial: '', national: digits, abbr: 'INT' };
}
