serial.redirect(
    SerialPin.P0,
    SerialPin.P1,
    BaudRate.BaudRate9600
)
basic.forever(() => {
})

///////////////////////////////////////////////////////////////////////////
//  From sensor.h

//  Messages sent by Sensor Task containing sensor data will be in this format.
class SensorMsg {
    // Msg_t super; //  Required for all cocoOS messages.
    name: string;   //  3-character name of sensor e.g. tmp, hmd. Includes terminating null.
    data: Array<number>; //  Array of float sensor data values returned by the sensor.
    count: uint8;        //  Number of float sensor data values returned by the sensor.
};

///////////////////////////////////////////////////////////////////////////
//  From wisol.h

//  Defines a Wisol AT command string, to be sent via UART Task. Sequence is
//    sendData + payload + sendData2
class NetworkCmd {
    sendData: string;  //  Command string to be sent, in F() flash memory. 
    expectedMarkerCount: uint8;  //  Wait for this number of markers until timeout.
    payload: string;  //  Additional payload to be sent right after sendData. Note: This is a pointer, not a buffer.
    sendData2: string;  //  Second command string to be sent, in F() flash memory. 
    processFunc: (context: NetworkContext, response: string) => boolean;  //  Function to process the response, NULL if none.
};

//  Network Task maintains this context in the task data.
class NetworkContext {
    uartContext: UARTContext;  //  Context of the UART Task.
    uartTaskID: uint8;  //  Task ID of the UART Task.  Network Task transmits UART data by sending a message to this task.
    zone: number;  //  1 to 4 representing SIGFOX frequencies RCZ 1 to 4.
    country: Country;   //  Country to be set for SIGFOX transmission frequencies.
    useEmulator: boolean;  //  Set to true if using SNEK Emulator.
    stepBeginFunc: (  //  Begin Step: Return the Wisol AT Commands to be executed at startup.
        context: NetworkContext,
        list: Array<NetworkCmd>,
        listSize: number) => void;
    stepSendFunc: (  //  Send Step: Return the Wisol AT Commands to be executed when sending a payload.
        context: NetworkContext,
        list: Array<NetworkCmd>,
        listSize: number,
        payload: string,
        enableDownlink: boolean) => void;

    device: string;  //  Sigfox device ID read from device e.g. 002C2EA1
    pac: string;  //  Sigfox PAC code read from device e.g. 5BEB8CF64E869BD1
    status: boolean;  //  Return status.  True if command was successful.
    pendingResponse: boolean;  //  True if we are waiting for the send response to be processed.
    pendingProcessFunc: (context: NetworkContext, response: string) => boolean;  //  Function to process the pending response, NULL if none.
    lastSend: number;  //  Timestamp of last sent message in milliseconds.  Used for throttling.
    msg: SensorMsg;  //  Sensor data being sent. Set by network_task() upon receiving a message.
    downlinkData: string;  //  If downlink was requested, set the downlink hex string e.g. 0102030405060708.

    cmdList: Array<NetworkCmd>;  //  List of Wisol AT commands being sent.
    cmdIndex: number;  //  Index of cmdList being sent.
};

///////////////////////////////////////////////////////////////////////////
//  From uart.h

//  UART Task accepts messages of this format for sending data.
class UARTMsg {
    //  Msg_t super;  //  Required for all cocoOS messages.
    sendData: string;  //  Pointer to the string to be sent.
    timeout: number;  //  Send timeout in milliseconds.
    markerChar: uint8;  //  End-of-command marker character that we should count e.g. '\r'
    expectedMarkerCount: uint8;  //  Wait for this number of markers until timeout.
    successEvent: Evt_t;  //  Event to be triggered upon success.
    failureEvent: Evt_t;  //  Event to be triggered upon failure.
    responseMsg: SensorMsg;  //  If not NULL, then send this response message when the response is completed.
    responseTaskID: uint8;  //  Send to this task ID.
};

//  UART Task maintains this context in the task data.
class UARTContext {
    status: boolean;  //  Return status.  True if successfully sent.
    sendIndex: number;  //  Index of next char to be sent.
    sentTime: number;  //  Timestamp at which we completed sending.
    response: string;  //  Pointer to the buffer for writing received response.
    actualMarkerCount: uint8;  //  Actual number of markers received.
    testTimer: number;  //  For testing timer.
    msg: UARTMsg;  //  Message being sent. Set by uart_task() upon receiving a message.
};

///////////////////////////////////////////////////////////////////////////
//  From sigfox.h

//  Define the countries (ISO ALPHA-2 country code) and frequencies that are supported.
//  Based on https://www.sigfox.com/en/coverage, https://www.st.com/content/ccc/resource/technical/document/user_manual/group0/8d/9a/ea/d7/62/06/43/ce/DM00361540/files/DM00361540.pdf/jcr:content/translations/en.DM00361540.pdf
const RCZ_MASK = (3 << 14)  //  Bits 14-15: RCZ
const RCZ1 = (0 << 14)
const RCZ2 = (1 << 14)
const RCZ3 = (2 << 14)
const RCZ4 = (3 << 14)
enum Country {  //  Bits 0-6: First letter. Bits 7-13: Second letter.
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
};
