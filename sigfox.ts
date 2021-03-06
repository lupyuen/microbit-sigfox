namespace sigfox {
    // From sigfox.h
    export const MAX_DEVICE_ID_SIZE: number = 8
    export const MAX_DEVICE_CODE_SIZE = 16
    export const MAX_MESSAGE_SIZE = 12
    export const SEND_DELAY = 10 * 60 * 1000
    // Define multiple timeouts for better multitasking.
    // Uplink to network is slower than normal commands.
    // Downlink is slowest, up to 1 minute.
    // COMMAND_TIMEOUT < UPLINK_TIMEOUT < DOWNLINK_TIMEOUT
    export const COMMAND_TIMEOUT = 10 * 1000
    export const UPLINK_TIMEOUT = 20 * 1000
    export const DOWNLINK_TIMEOUT = 60 * 1000
    export const MAX_TIMEOUT = DOWNLINK_TIMEOUT
    // Define the countries (ISO ALPHA-2 country code) and
    // frequencies that are supported. Based on
    // https://www.sigfox.com/en/coverage,
    // https://www.st.com/content/ccc/resource/technical/document/user_manual/group0/8d/9a/ea/d7/62/06/43/ce/DM00361540/files/DM00361540.pdf/jcr:content/translations/en.DM00361540.pdf
    export const RCZ_MASK = (3 << 14)
    export const RCZ1 = (0 << 14)
    export const RCZ2 = (1 << 14)
    export const RCZ3 = (2 << 14)
    export const RCZ4 = (3 << 14)
    export enum Country {  //  Bits 0-6: First letter. Bits 7-13: Second letter.
        COUNTRY_AR = RCZ4 + 'A'.charCodeAt(0) + ('R'.charCodeAt(0) << 7),  //  Argentina: RCZ4
        COUNTRY_AU = RCZ4 + 'A'.charCodeAt(0) + ('U'.charCodeAt(0) << 7),  //  Australia: RCZ4
        COUNTRY_BE = RCZ1 + 'B'.charCodeAt(0) + ('E'.charCodeAt(0) << 7),  //  Belgium: RCZ1
        COUNTRY_BR = RCZ2 + 'B'.charCodeAt(0) + ('R'.charCodeAt(0) << 7),  //  Brazil: RCZ2
        COUNTRY_CL = RCZ4 + 'C'.charCodeAt(0) + ('L'.charCodeAt(0) << 7),  //  Chile: RCZ4
        COUNTRY_CO = RCZ4 + 'C'.charCodeAt(0) + ('O'.charCodeAt(0) << 7),  //  Colombia: RCZ4
        COUNTRY_CR = RCZ4 + 'C'.charCodeAt(0) + ('R'.charCodeAt(0) << 7),  //  Costa Rica: RCZ4
        COUNTRY_HR = RCZ1 + 'H'.charCodeAt(0) + ('R'.charCodeAt(0) << 7),  //  Croatia: RCZ1
        COUNTRY_CZ = RCZ1 + 'C'.charCodeAt(0) + ('Z'.charCodeAt(0) << 7),  //  Czech Republic: RCZ1
        COUNTRY_DK = RCZ1 + 'D'.charCodeAt(0) + ('K'.charCodeAt(0) << 7),  //  Denmark: RCZ1
        COUNTRY_EC = RCZ4 + 'E'.charCodeAt(0) + ('C'.charCodeAt(0) << 7),  //  Ecuador: RCZ4
        COUNTRY_SV = RCZ4 + 'S'.charCodeAt(0) + ('V'.charCodeAt(0) << 7),  //  El Salvador: RCZ4
        COUNTRY_EE = RCZ1 + 'E'.charCodeAt(0) + ('E'.charCodeAt(0) << 7),  //  Estonia: RCZ1
        COUNTRY_FI = RCZ1 + 'F'.charCodeAt(0) + ('I'.charCodeAt(0) << 7),  //  Finland: RCZ1
        COUNTRY_FR = RCZ1 + 'F'.charCodeAt(0) + ('R'.charCodeAt(0) << 7),  //  France: RCZ1
        COUNTRY_GF = RCZ1 + 'G'.charCodeAt(0) + ('F'.charCodeAt(0) << 7),  //  French Guiana: RCZ1
        COUNTRY_PF = RCZ1 + 'P'.charCodeAt(0) + ('F'.charCodeAt(0) << 7),  //  French Polynesia: RCZ1
        COUNTRY_DE = RCZ1 + 'D'.charCodeAt(0) + ('E'.charCodeAt(0) << 7),  //  Germany: RCZ1
        COUNTRY_GP = RCZ1 + 'G'.charCodeAt(0) + ('P'.charCodeAt(0) << 7),  //  Guadeloupe: RCZ1
        COUNTRY_HK = RCZ4 + 'H'.charCodeAt(0) + ('K'.charCodeAt(0) << 7),  //  Hong Kong: RCZ4
        COUNTRY_HU = RCZ1 + 'H'.charCodeAt(0) + ('U'.charCodeAt(0) << 7),  //  Hungary: RCZ1
        COUNTRY_IR = RCZ1 + 'I'.charCodeAt(0) + ('R'.charCodeAt(0) << 7),  //  Iran: RCZ1
        COUNTRY_IE = RCZ1 + 'I'.charCodeAt(0) + ('E'.charCodeAt(0) << 7),  //  Ireland: RCZ1
        COUNTRY_IT = RCZ1 + 'I'.charCodeAt(0) + ('T'.charCodeAt(0) << 7),  //  Italy: RCZ1
        COUNTRY_JP = RCZ3 + 'J'.charCodeAt(0) + ('P'.charCodeAt(0) << 7),  //  Japan: RCZ3
        COUNTRY_LU = RCZ1 + 'L'.charCodeAt(0) + ('U'.charCodeAt(0) << 7),  //  Luxembourg: RCZ1
        COUNTRY_MY = RCZ4 + 'M'.charCodeAt(0) + ('Y'.charCodeAt(0) << 7),  //  Malaysia: RCZ4
        COUNTRY_MT = RCZ1 + 'M'.charCodeAt(0) + ('T'.charCodeAt(0) << 7),  //  Malta: RCZ1
        COUNTRY_MQ = RCZ1 + 'M'.charCodeAt(0) + ('Q'.charCodeAt(0) << 7),  //  Martinique: RCZ1
        COUNTRY_MX = RCZ2 + 'M'.charCodeAt(0) + ('X'.charCodeAt(0) << 7),  //  Mexico: RCZ2
        COUNTRY_NL = RCZ1 + 'N'.charCodeAt(0) + ('L'.charCodeAt(0) << 7),  //  Netherlands: RCZ1
        COUNTRY_NC = RCZ1 + 'N'.charCodeAt(0) + ('C'.charCodeAt(0) << 7),  //  New Caledonia: RCZ1
        COUNTRY_NZ = RCZ4 + 'N'.charCodeAt(0) + ('Z'.charCodeAt(0) << 7),  //  New Zealand: RCZ4
        COUNTRY_OM = RCZ1 + 'O'.charCodeAt(0) + ('M'.charCodeAt(0) << 7),  //  Oman: RCZ1
        COUNTRY_PA = RCZ4 + 'P'.charCodeAt(0) + ('A'.charCodeAt(0) << 7),  //  Panama: RCZ4
        COUNTRY_PT = RCZ1 + 'P'.charCodeAt(0) + ('T'.charCodeAt(0) << 7),  //  Portugal: RCZ1
        COUNTRY_RE = RCZ1 + 'R'.charCodeAt(0) + ('E'.charCodeAt(0) << 7),  //  Réunion: RCZ1
        COUNTRY_SG = RCZ4 + 'S'.charCodeAt(0) + ('G'.charCodeAt(0) << 7),  //  Singapore: RCZ4
        COUNTRY_SK = RCZ1 + 'S'.charCodeAt(0) + ('K'.charCodeAt(0) << 7),  //  Slovakia: RCZ1
        COUNTRY_ZA = RCZ1 + 'Z'.charCodeAt(0) + ('A'.charCodeAt(0) << 7),  //  South Africa: RCZ1
        COUNTRY_KR = RCZ3 + 'K'.charCodeAt(0) + ('R'.charCodeAt(0) << 7),  //  South Korea: RCZ3
        COUNTRY_ES = RCZ1 + 'E'.charCodeAt(0) + ('S'.charCodeAt(0) << 7),  //  Spain: RCZ1
        COUNTRY_SE = RCZ1 + 'S'.charCodeAt(0) + ('E'.charCodeAt(0) << 7),  //  Sweden: RCZ1
        COUNTRY_CH = RCZ1 + 'C'.charCodeAt(0) + ('H'.charCodeAt(0) << 7),  //  Switzerland: RCZ1
        COUNTRY_TW = RCZ4 + 'T'.charCodeAt(0) + ('W'.charCodeAt(0) << 7),  //  Taiwan: RCZ4
        COUNTRY_TH = RCZ4 + 'T'.charCodeAt(0) + ('H'.charCodeAt(0) << 7),  //  Thailand: RCZ4
        COUNTRY_TN = RCZ1 + 'T'.charCodeAt(0) + ('N'.charCodeAt(0) << 7),  //  Tunisia: RCZ1
        COUNTRY_GB = RCZ1 + 'G'.charCodeAt(0) + ('B'.charCodeAt(0) << 7),  //  United Kingdom: RCZ1
        COUNTRY_AE = RCZ1 + 'A'.charCodeAt(0) + ('E'.charCodeAt(0) << 7),  //  United Arab Emirates: RCZ1
        COUNTRY_US = RCZ2 + 'U'.charCodeAt(0) + ('S'.charCodeAt(0) << 7),  //  United States of America: RCZ2
    }    
}