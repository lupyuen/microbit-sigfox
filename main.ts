serial.redirect(
    SerialPin.P0,
    SerialPin.P1,
    BaudRate.BaudRate9600
)
// /////////////////////////////////////////////////////////////////////////
// From sensor.h Messages sent by Sensor Task
// containing sensor data will be in this format.
interface SensorMsg {
    // Msg_t super; //  Required for all cocoOS messages.
    name: string;   //  3-character name of sensor e.g. tmp, hmd. Includes terminating null.
    data: Array<number>; //  Array of float sensor data values returned by the sensor.
    count: uint8;        //  Number of float sensor data values returned by the sensor.
}
// /////////////////////////////////////////////////////////////////////////
// From wisol.h Defines a Wisol AT command string, to
// be sent via UART Task. Sequence is sendData +
// payload + sendData2
interface NetworkCmd {
    sendData: string;  //  Command string to be sent, in F() flash memory. 
    expectedMarkerCount: uint8;  //  Wait for this number of markers until timeout.
    payload: string;  //  Additional payload to be sent right after sendData. Note: This is a pointer, not a buffer.
    sendData2: string;  //  Second command string to be sent, in F() flash memory. 
    processFunc: (context: NetworkContext, response: string) => boolean;  //  Function to process the response, NULL if none.
}
// Network Task maintains this context in the task
// data.
interface NetworkContext {
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
}
// /////////////////////////////////////////////////////////////////////////
// From uart.h TODO
interface Evt_t {
}
// UART Task accepts messages of this format for
// sending data.
interface UARTMsg {
    //  Msg_t super;  //  Required for all cocoOS messages.
    sendData: string;  //  Pointer to the string to be sent.
    timeout: number;  //  Send timeout in milliseconds.
    markerChar: uint8;  //  End-of-command marker character that we should count e.g. '\r'
    expectedMarkerCount: uint8;  //  Wait for this number of markers until timeout.
    successEvent: Evt_t;  //  Event to be triggered upon success.
    failureEvent: Evt_t;  //  Event to be triggered upon failure.
    responseMsg: SensorMsg;  //  If not NULL, then send this response message when the response is completed.
    responseTaskID: uint8;  //  Send to this task ID.
}
// UART Task maintains this context in the task data.
interface UARTContext {
    status: boolean;  //  Return status.  True if successfully sent.
    sendIndex: number;  //  Index of next char to be sent.
    sentTime: number;  //  Timestamp at which we completed sending.
    response: string;  //  Pointer to the buffer for writing received response.
    actualMarkerCount: uint8;  //  Actual number of markers received.
    testTimer: number;  //  For testing timer.
    msg: UARTMsg;  //  Message being sent. Set by uart_task() upon receiving a message.
}
// /////////////////////////////////////////////////////////////////////////
// From sigfox.h Define the countries (ISO ALPHA-2
// country code) and frequencies that are supported.
// Based on https://www.sigfox.com/en/coverage,
// https://www.st.com/content/ccc/resource/technical/document/user_manual/group0/8d/9a/ea/d7/62/06/43/ce/DM00361540/files/DM00361540.pdf/jcr:content/translations/en.DM00361540.pdf
const RCZ_MASK = (3 << 14)
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
}
basic.forever(() => {

})

function F(s: string) { return s; }


// /////////////////////////////////////////////////////////////////////////
// From wisol.cpp

///////////////////////////////////////////////////////////////////////////////
//  Define the Wisol AT Commands based on WISOLUserManual_EVBSFM10RxAT_Rev.9_180115.pdf

const CMD_NONE = "AT"                     //  Empty placeholder command.
const CMD_OUTPUT_POWER_MAX = "ATS302=15"  //  For RCZ1: Set output power to maximum power level.
const CMD_GET_CHANNEL = "AT$GI?"          //  For RCZ2, 4: Get current and next TX macro channel usage.  Returns X,Y.
const CMD_RESET_CHANNEL = "AT$RC"         //  For RCZ2, 4: Reset default channel. Send this command if CMD_GET_CHANNEL returns X=0 or Y<3.
const CMD_SEND_MESSAGE = "AT$SF="         //  Prefix to send a message to Sigfox.
const CMD_SEND_MESSAGE_RESPONSE = ",1"    //  Append to payload if downlink response from Sigfox is needed.
const CMD_GET_ID = "AT$I=10"              //  Get Sigfox device ID.
const CMD_EMULATOR_DISABLE = "ATS410=0"   //  Device will only talk to Sigfox network.
const CMD_EMULATOR_ENABLE = "ATS410=1"    //  Device will only talk to SNEK emulator.

///////////////////////////////////////////////////////////////////////////////
//  Wisol Command Steps: A Command Step contains a list of Wisol AT Commands to
//  be sent for executing the step.  We only implement 2 steps for the Wisol module:
//  Begin Step -> Send Step
//  (1) Begin Step: On startup, set the emulation mode and get the device ID and PAC.
//  (2) Send Step: Send the payload, after setting the TX power and channel. Optional: Request for downlink

//  Each Wisol AT Command added through addCmd() may include a Response Processing
//  Function e.g. getID(), getPAC().  The function is called with the response text
//  generated from the Wisol AT Command.

function getStepBegin(
    context: NetworkContext,
    list: Array<NetworkCmd>,
    listSize: number): void {
    //  Return the list of Wisol AT commands for the Begin Step, to start up the Wisol module.  //  debug(F(" - wisol.getStepBegin"));
    addCmd(list, listSize, {
        //  Set emulation mode.
        sendData: context.useEmulator  //  If emulator mode,
            ? F(CMD_EMULATOR_ENABLE)   //  Device will only talk to SNEK emulator.
            : F(CMD_EMULATOR_DISABLE), //  Else device will only talk to Sigfox network.
        expectedMarkerCount: 1,
        processFunc: null,
        payload: null, sendData2: null
    });
    //  Get Sigfox device ID and PAC.
    addCmd(list, listSize, {
        sendData: F(CMD_GET_ID),
        expectedMarkerCount: 1,
        processFunc: getID,
        payload: null, sendData2: null
    });
    addCmd(list, listSize, {
        sendData: F(CMD_GET_PAC),
        expectedMarkerCount: 1,
        processFunc: getPAC,
        payload: null, sendData2: null
    });
}

function getStepSend(
    context: NetworkContext,
    list: Array<NetworkCmd>,
    listSize: number,
    payload: string,
    enableDownlink: boolean): void {
    //  Return the list of Wisol AT commands for the Send Step, to send the payload.
    //  Payload contains a string of hex digits, up to 24 digits / 12 bytes.
    //  We prefix with AT$SF= and send to the transceiver.  If enableDownlink is true, we append the
    //  CMD_SEND_MESSAGE_RESPONSE command to indicate that we expect a downlink repsonse.
    //  The downlink response message from Sigfox will be returned in the response parameter.
    //  Warning: This may take up to 1 min to run.  //  debug(F(" - wisol.getStepSend"));
    //  Set the output power for the zone.
    getStepPowerChannel(context, list, listSize);

    //  Compose the payload sending command.
    let markers: uint8 = 1;  //  Wait for 1 line of response.
    let processFunc: (context: NetworkContext, response: string) => boolean = null;  //  Function to process result.
    let sendData2: string = null;  //  Text to be appended to payload.

    // If no downlink: Send CMD_SEND_MESSAGE + payload
    if (enableDownlink) {
        //  For downlink mode: send CMD_SEND_MESSAGE + payload + CMD_SEND_MESSAGE_RESPONSE
        markers++;  //  Wait for one more response line.   
        processFunc = getDownlink;  //  Process the downlink message.
        sendData2 = F(CMD_SEND_MESSAGE_RESPONSE);  //  Append suffix to payload.
    }
    addCmd(list, listSize, { F(CMD_SEND_MESSAGE), markers, processFunc, payload, sendData2 });
}

function getStepPowerChannel(context: NetworkContext, list: Array<NetworkCmd>, listSize: number): void {
    //  Return the Wisol AT commands to set the transceiver output power and channel for the zone.
    //  See WISOLUserManual_EVBSFM10RxAT_Rev.9_180115.pdf, http://kochingchang.blogspot.com/2018/06/minisigfox.html  //  debug(F(" - wisol.getStepPowerChannel"));
    switch (context.zone) {
        case RCZ1:
        case RCZ3:
            //  Set the transceiver output power.
            addCmd(list, listSize, {
                sendData: F(CMD_OUTPUT_POWER_MAX),
                expectedMarkerCount: 1,
                processFunc: null,
                payload: null, sendData2: null
            });
            break;
        case RCZ2:
        case RCZ4: {
            //  Get the current and next macro channel usage. Returns X,Y:
            //  X: boolean value, indicating previous TX macro channel was in the Sigfox default channel
            //  Y: number of micro channel available for next TX request in current macro channel.
            //  Call checkChannel() to check the response.
            addCmd(list, listSize, {
                sendData: F(CMD_GET_CHANNEL),
                expectedMarkerCount: 1,
                processFunc: checkChannel,
                payload: null, sendData2: null
            });

            //  If X=0 or Y<3, send CMD_RESET_CHANNEL to reset the device on the default Sigfox macro channel.
            //  Note: Don't use with a duty cycle less than 20 seconds.
            //  Note: checkChannel() will change this command to CMD_NONE if not required.
            addCmd(list, listSize, {
                sendData: F(CMD_RESET_CHANNEL),
                expectedMarkerCount: 1,
                processFunc: null,
                payload: null, sendData2: null
            });
            break;
        }
    }
}

///////////////////////////////////////////////////////////////////////////////
//  Wisol Response Processing Functions: Called to process response when response 
//  is received from Wisol AT Command.

function getID(context: NetworkContext, response: string): boolean {
    //  Save the device ID to context.
    context.device = response;
    debug(F(" - wisol.getID: "), context.device);
    return true;
}

function getPAC(context: NetworkContext, response: string): boolean {
    //  Save the PAC code to context.  Note that the PAC is only valid
    //  for the first registration in the Sigfox portal.  After
    //  registering the device, the PAC is changed in the Sigfox portal
    //  but not in the Wisol AT Command.  You must get the updated
    //  PAC from the Sigfox portal if you wish to transfer the device.
    context.pac = response;
    debug(F(" - wisol.getPAC: "), context.pac);
    return true;
}

function checkChannel(context: NetworkContext, response: string): boolean {
    //  Parse the CMD_GET_CHANNEL response "X,Y" to determine if we need to send the CMD_RESET_CHANNEL command.
    //  If not needed, change the next command to CMD_NONE.

    //  CMD_GET_CHANNEL gets the current and next macro channel usage. Returns X,Y:
    //  X: boolean value, indicating previous TX macro channel was in the Sigfox default channel
    //  Y: number of micro channel available for next TX request in current macro channel.

    //  If X=0 or Y<3, send CMD_RESET_CHANNEL to reset the device on the default Sigfox macro channel.
    //  Note: Don't use with a duty cycle less than 20 seconds.  //  debug(F("checkChannel: "), response);
    if (response.length < 3) {  //  If too short, return error.
        debug(F("***** wisol.checkChannel Error: Unknown response "), response);
        return false;  //  Failure
    }
    //  Change chars to numbers.
    const x = response[0].charCodeAt(0) - '0'.charCodeAt(0);
    const y = response[2].charCodeAt(0) - '0'.charCodeAt(0);
    if (x != 0 && y >= 3) {
        //  No need to reset channel. We change CMD_RESET_CHANNEL to CMD_NONE.  //  debug(F(" - wisol.checkChannel: Continue channel"));
        let cmdIndex = context.cmdIndex;  //  Current index.
        cmdIndex++;  //  Next index, to be updated.
        if (cmdIndex >= MAX_NETWORK_CMD_LIST_SIZE) {
            debug(F("***** wisol.checkChannel Error: Cmd overflow"));  //  List is full.
            return false;  //  Failure
        }
        if (context.cmdList[cmdIndex].sendData === null) {
            debug(F("***** wisol.checkChannel Error: Empty cmd"));  //  Not supposed to be empty.
            return false;  //  Failure
        }
        context.cmdList[cmdIndex].sendData = F(CMD_NONE);
    } else {
        //  Continue to send CMD_RESET_CHANNEL  //  debug(F(" - wisol.checkChannel: Reset channel"));
    }
    return true;  //  Success
}

// Downlink Server Support: https://backend.sigfox.com/apidocs/callback
// When a message needs to be acknowledged, the callback selected for the downlink data must 
// send data in the response. It must contain the 8 bytes data that will be sent to the device 
// asking for acknowledgment. The data is json formatted, and must be structured as the following :
//   {"YOUR_DEVICE_ID" : { "downlinkData" : "deadbeefcafebabe"}}    
// With YOUR_DEVICE_ID being replaced by the corresponding device id, in hexadecimal format, up to 8 digits. 
// The downlink data must be 8 bytes in hexadecimal format.  For example:
//   {"002C2EA1" : { "downlinkData" : "0102030405060708"}}

function getDownlink(context: NetworkContext, response0: string): boolean {
    //  Extract the downlink message and write into the context response.
    //  context response will be returned as an 8-byte hex string, e.g. "0123456789ABCDEF"
    //  or a timeout error after 1 min e.g. "ERR_SFX_ERR_SEND_FRAME_WAIT_TIMEOUT"

    //  Get a writeable response pointer in the uartContext.
    let response = context.uartContext.response;  // debug(F(" - wisol.getDownlink: "), response);

    //  Check the original response.
    //  If Successful response: OK\nRX=01 23 45 67 89 AB CD EF
    //  -> Change response to: 0123456789ABCDEF
    //  If Timeout response: ERR_SFX_ERR_SEND_FRAME_WAIT_TIMEOUT\n
    //  -> Remove newline: ERR_SFX_ERR_SEND_FRAME_WAIT_TIMEOUT

    //  Remove the prefix and spaces:
    //    replace "OK\nRX=" by "", replace " " by ""
    const downlinkPrefix = "OK\nRX=";
    const foundIndex = response.indexOf(downlinkPrefix);
    if (foundIndex >= 0) {
        //  Found the delimiter. Transform <<BEFORE>>OK\nRX=<<AFTER>>
        //  To <<BEFORE>><<AFTER>>
        //  foundIndex points to "OK\nRX=".

        //  Shift <<AFTER>> next to <<BEFORE>>.
        const after = response.substr(foundIndex + downlinkPrefix.length);
        response = response.substr(0, foundIndex - 1) + after;
    } else {
        //  Return error e.g. ERR_SFX_ERR_SEND_FRAME_WAIT_TIMEOUT
        context.status = false;
    }
    //  Remove all spaces.
    let src = 0, dst = 0;
    for (; ;) {
        if (src >= MAX_UART_SEND_MSG_SIZE) break;
        //  Don't copy spaces and newlines in the source.
        if (response[src] === ' ' || response[src] === '\n') {
            src++;
            continue;
        }
        //  Copy only if the indexes are different.
        if (dst != src) { response[dst] = response[src]; }
        //  If we have copied the terminating null, quit.
        if (dst >= response.length) { break; }
        dst++; src++;  //  Shift to next char.
    }
    response = response.substr(0, dst);
    context.downlinkData = response;
    return true;
}

let uartData: string;
let cmdData: string;

function convertCmdToUART(
    cmd: NetworkCmd,
    context: NetworkContext,
    uartMsg: UARTMsg,
    successEvent0: Evt_t,
    failureEvent0: Evt_t,
    responseMsg: SensorMsg,
    responseTaskID: uint8): void {
    //  Convert the Wisol command into a UART message.
    uartData = "";  //  Clear the dest buffer.
    uartMsg.timeout = COMMAND_TIMEOUT;
    uartMsg.responseMsg = null;

    if (cmd.sendData) {
        //  Append sendData if it exists.
        cmdData = cmd.sendData;
        const cmdDataStr = cmdData;
        uartData = cmdDataStr;  //  Copy the command string.
    }
    if (cmd.payload) {
        //  Append payload if it exists.
        uartData = uartData + cmd.payload;
        uartMsg.timeout = UPLINK_TIMEOUT;  //  Increase timeout for uplink.
        //  If there is payload to send, send the response message when sending is completed.
        uartMsg.responseMsg = responseMsg;
        uartMsg.responseTaskID = responseTaskID;
    }
    if (cmd.sendData2) {
        //  Append sendData2 if it exists.  Need to use String class because sendData is in flash memory.
        cmdData = cmd.sendData2;
        const cmdDataStr = cmdData;
        uartData = uartData + cmdDataStr;
        uartMsg.timeout = DOWNLINK_TIMEOUT;  //  Increase timeout for downlink.
    }
    //  Terminate the command with "\r".
    uartData = uartData + CMD_END;
    //  Check total msg length.
    if (uartData.length >= MAX_UART_SEND_MSG_SIZE - 1) {
        debug_print(F("***** Error: uartData overflow - ")); debug_print(strlen(uartData));
        debug_print(" / "); debug_println(uartData); debug_flush();
    }
    uartMsg.markerChar = END_OF_RESPONSE;
    uartMsg.expectedMarkerCount = cmd.expectedMarkerCount;
    uartMsg.successEvent = successEvent0;
    uartMsg.failureEvent = failureEvent0;
    uartMsg.sendData = uartData;
}

function setup_wisol(
    context: NetworkContext,
    uartContext: UARTContext,
    uartTaskID: int8,
    country0: Country,
    useEmulator0: boolean): void {
    //  Init the Wisol context.
    /*
    const maxCount = 10;  //  Allow up to 10 tasks to queue for aggregating and sending sensor data.
    const initValue = 1;  //  Allow only 1 concurrent task for aggregating and sending sensor data.
    sendSemaphore = sem_counting_create(maxCount, initValue);
    */
    context.uartContext = uartContext;
    context.uartTaskID = uartTaskID;
    context.country = country0;
    context.useEmulator = useEmulator0;
    context.stepBeginFunc = getStepBegin;
    context.stepSendFunc = getStepSend;
    context.device = "";  //  Clear the device ID.
    context.pac = "";     //  Clear the PAC code.
    context.zone = context.country & RCZ_MASK;  //  Extract the zone from country node.
    context.lastSend = millis() + SEND_INTERVAL + SEND_INTERVAL;  //  Init the last send time to a high number so that sensor data will wait for Begin Step to complete.
    context.pendingResponse = false;
}

function addCmd(list: Array<NetworkCmd>, listSize: number, cmd: NetworkCmd): void {
    //  Append the UART message to the command list.
    //  Stop if we have overflowed the list.
    let i = getCmdIndex(list, listSize);
    list[i++] = cmd;
    list[i++] = endOfList;
}

function getCmdIndex(list: Array<NetworkCmd>, listSize: number): number {
    //  Given a list of commands, return the index of the next empty element.
    //  Check index against cmd size.  It must fit 2 more elements:
    //  The new cmd and the endOfList cmd.
    let i = 0;
    for (i = 0;  //  Search all elements in list.
        list[i].sendData &&   //  Skip no-empty elements.
        i < listSize - 1;  //  Don't exceed the list size.
        i++) { }
    if (i >= listSize - 1) {
        //  List is full.
        debug_print(F("***** Error: Cmd list overflow - ")); debug_println(i); debug_flush();
        i = listSize - 2;
        if (i < 0) i = 0;
    }
    return i;
}

function createSensorMsg(msg: SensorMsg, name: string): void {
    //  Populate the msg fields as an empty message.
    msg.count = 0;  //  No data.
    msg.name = name;
}
