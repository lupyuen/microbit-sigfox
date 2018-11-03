namespace sigfox {
    // From wisol.h
    export const MAX_NETWORK_CMD_LIST_SIZE = 5

    // Defines a Wisol AT command string, to be sent via
    // UART Task. Sequence is sendData + payload +
    // sendData2
    export interface NetworkCmd {
        sendData: string;  //  Command string to be sent, in F() flash memory. 
        expectedMarkerCount: uint8;  //  Wait for this number of markers until timeout.
        payload: string;  //  Additional payload to be sent right after sendData. Note: This is a pointer, not a buffer.
        sendData2: string;  //  Second command string to be sent, in F() flash memory. 
        processFunc: (context: NetworkContext, response: string) => boolean;  //  Function to process the response, NULL if none.
    }

    // Network Task maintains this context in the task
    // data.
    export interface NetworkContext {
        uartContext: UARTContext;  //  Context of the UART Task.
        uartTaskID: uint8;  //  Task ID of the UART Task.  Network Task transmits UART data by sending a message to this task.
        zone: number;  //  1 to 4 representing SIGFOX frequencies RCZ 1 to 4.
        country: Country;   //  Country to be set for SIGFOX transmission frequencies.
        useEmulator: boolean;  //  Set to true if using SNEK Emulator.
        stepBeginFunc: (  //  Begin Step: Return the Wisol AT Commands to be executed at startup.
            context: NetworkContext,
            args: StepArgs) => void;
        stepSendFunc: (  //  Send Step: Return the Wisol AT Commands to be executed when sending a payload.
            context: NetworkContext,
            args: StepArgs) => void;

        device: string;  //  Sigfox device ID read from device e.g. 002C2EA1
        pac: string;  //  Sigfox PAC code read from device e.g. 5BEB8CF64E869BD1
        status: boolean;  //  Return status.  True if command was successful.
        pendingResponse: boolean;  //  True if we are waiting for the send response to be processed.
        pendingProcessFunc: (context: NetworkContext, response: string) => boolean;  //  Function to process the pending response, NULL if none.
        lastSend: number;  //  Timestamp of last sent message in milliseconds.  Used for throttling.
        msg: SensorMsg;  //  Sensor data being sent. Set by network_task() upon receiving a message.
        downlinkData: string;  //  If downlink was requested, set the downlink hex string e.g. 0102030405060708.

        cmdList: NetworkCmd[];  //  List of Wisol AT commands being sent.
        cmdIndex: number;  //  Index of cmdList being sent.
    }

    export interface StepArgs {
        list: NetworkCmd[];
        listSize: number;
        payload: string;
        enableDownlink: boolean;
    }

    // From wisol.cpp
    export const END_OF_RESPONSE = '\r'.charCodeAt(0)
    export const CMD_END = "\r"
    export const endOfList: NetworkCmd = {
        sendData: null,
        expectedMarkerCount: 0,
        processFunc: null,
        payload: null,
        sendData2: null
    };

    let successEvent: Evt_t = null
    let failureEvent: Evt_t = null
    let sendSemaphore: Sem_t = {}
    let cmdList: NetworkCmd[] = []
    let uartMsg: UARTMsg = null
    let responseMsg: Msg_t = null

    //% block
    export function network_task(task_id: number, task_context: Context_t): void {
        //  Loop to receive sensor data messages and send to UART Task to transmit to the network.
        if (!task_context || !task_context.networkContext) {
            debug("***** ERROR: network_task / missing context");
            return;
        }
        const os_get_running_tid = () => task_id;
        const ctx = () => task_context.networkContext;
        let cmd: NetworkCmd;
        let shouldSend: boolean;

        ////debug("network_task open"); ////
        task_open();  //  Start of the task. Must be matched with task_close().  
        if (!successEvent) { successEvent = event_create(); }  //  Create event for UART Task to indicate success.
        if (!failureEvent) { failureEvent = event_create(); }  //  Another event to indicate failure.
        if (!responseMsg) { responseMsg = createSensorMsg(RESPONSE_SENSOR_NAME); }  //  UART Task sends this message for a pending response received.

        for (; ;) {  //  Receive the next sensor data message.
            let msg_t = msg_receive(os_get_running_tid());
            if (!msg_t) { break; }  //  If no message received, exit and try again later.
            let msg = msg_t.sensorMsg;
            if (!msg) {
                debug("***** ERROR: network_task / msg is empty");
                break;
            }

            //  If this is a UART response message, process the pending response.
            if (msg.name === RESPONSE_SENSOR_NAME) {
                processPendingResponse(ctx());
                continue;
            }
            //  Aggregate the sensor data.  Determine whether we should send to network now.
            cmdList[0] = endOfList;  //  Empty the command list.
            shouldSend = aggregate_sensor_data(ctx(), msg, cmdList, MAX_NETWORK_CMD_LIST_SIZE);  //  Fetch the command list into cmdList.
            if (!shouldSend) { continue; }  //  If we should not send now: Loop and wait for next message.

            //  Use a semaphore to limit sending to only 1 message at a time, because our buffers are shared.
            debug(F("net >> Wait for net"));
            sem_wait(sendSemaphore);  //  Wait until no other message is being sent. Then lock the semaphore.
            debug(F("net >> Got net"));

            //  Init the context.
            ctx().status = true;            //  Assume no error.
            ctx().pendingResponse = false;  //  Assume no need to wait for response.
            ctx().msg = msg;               //  Remember the message until it's sent via UART.  
            ctx().downlinkData = null;      //  No downlink received yet.  
            ctx().cmdList = cmdList;        //  Run the command list.
            ctx().cmdIndex = 0;             //  Start at first command in command list.
            ctx().lastSend = millis() + MAX_TIMEOUT;  //  Set to a high timeout to prevent other requests from attempting to send.

            ///////////////////////////////////////////////////////////////////////////
            //  Wisol AT Command List Processing Loop
            for (; ;) {  //  Send each Wisol AT command in the list.
                ctx().lastSend = millis();  //  Update the last send time.

                if (ctx().cmdIndex >= MAX_NETWORK_CMD_LIST_SIZE) { break; }  //  Check that we don't exceed the array bounds.
                cmd = ctx().cmdList[ctx().cmdIndex];  //  Fetch the current command.        
                if (!cmd.sendData) { break; }     //  If no more commands to send, stop.

                //  Convert Wisol command to UART command.
                convertCmdToUART(cmd, ctx(), uartMsg, successEvent, failureEvent, responseMsg, os_get_running_tid());
                ctx().lastSend = millis() + uartMsg.timeout;  //  Estimate last send time for the next command.
                ctx().pendingProcessFunc = cmd.processFunc;   //  Call this function to process response later.

                //  Reset the event signals.
                event_reset(successEvent);
                event_reset(failureEvent);

                //  Must flush the debug output before sending, because UART Task will write to serial debug output directly.
                debug_flush();

                //  Transmit the UART command to the UART port by sending to the UART Task.
                uartMsg.debugMsg = false;
                const msg_t = <Msg_t>{ uartMsg: uartMsg };
                msg_post(ctx().uartTaskID, msg_t);  //  Send the message to the UART task for transmission.

                //  When sending the last step of Sigfox message payload: Break out of the loop and release the semaphore lock. 
                if (uartMsg.responseMsg) { //  This is the last command in the list and it will take some time.  Instead of waiting for
                    ctx().pendingResponse = true;   //  UART Task to signal us via an Event, we let UART Task signal us via a Message instead.
                    break;                          //  By releasing the semaphore we allow other tasks to run and improve the multitasking.
                }
                //  Wait for success or failure event then process the response.
                event_wait_multiple(0, successEvent, failureEvent);  //  0 means wait for any event.
                processResponse(ctx());  //  Process the response by calling the response function.
                if (!ctx().status) { break; }  //  Quit if the processing failed.

                //  Command was transmitted successfully. Move to next command.
                ctx().cmdIndex++;  //  Next Wisol command.
            }  //  Loop to next Wisol command.
            //  All Wisol AT commands sent for the step.

            ///////////////////////////////////////////////////////////////////////////
            //  Wisol AT Command List Completed Processing
            //  Clean up the context and release the semaphore.
            msg.name = null;       //  Erase the "begin" sensor name.
            ctx().msg = null;      //  Erase the message.
            ctx().cmdList = null;  //  Erase the command list.

            //  Release the semaphore and allow another payload to be sent after SEND_INTERVAL.
            debug(F("net >> Release net"));
            sem_signal(sendSemaphore);
        }  //  Loop to next incoming sensor data message.
        task_close();  //  End of the task.
        ////debug("network_task close"); ////
    }

    function processPendingResponse(context: NetworkContext): void {
        //  If there is a pending response, e.g. from send payload...
        debug(F("net >> Process pending response"));
        if (!context.pendingResponse) {
            debug(F("***** Error: No pending response"));
            return;
        }
        context.pendingResponse = false;
        processResponse(context);     //  Process the response by calling the response function.
        context.lastSend = millis();  //  Update the last send time.
        //  Process the downlink message, if any. This is located outside the semaphore lock for performance.
        if (context.downlinkData) {
            process_downlink_msg(context, context.status, context.downlinkData);
        }
    }

    function processResponse(context: NetworkContext): void {
        //  Process the response from the Wisol AT Command by calling the
        //  process response function.  Set the status to false if the processing failed.

        //  Get the response text.
        const response: string = (context && context.uartContext)
            ? context.uartContext.response
            : "";

        //  Process the response text, regardless of success/failure.
        //  Call the process response function if has been set.
        if (context.pendingProcessFunc) {
            const processStatus = (context.pendingProcessFunc)(context, response);
            //  If response processing failed, stop.
            if (!processStatus) {
                context.status = false;  //  Propagate status to Wisol context.
                debug(F("***** Error: network_task Result processing failed, response: "), response);
                return;  //  Quit processing.
            }
        }
        //  In case of failure, stop.
        if (!context.uartContext.status) {
            context.status = false;  //  Propagate status to Wisol context.
            debug(F("***** Error: network_task Failed, response: "), response);
            return;  //  Quit processing.
        }
    }

    // /////////////////////////////////////////////////////////////////////////////
    // Define the Wisol AT Commands based on
    // WISOLUserManual_EVBSFM10RxAT_Rev.9_180115.pdf
    const CMD_NONE = "AT"
    const CMD_OUTPUT_POWER_MAX = "ATS302=15"
    const CMD_GET_CHANNEL = "AT$GI?"
    const CMD_RESET_CHANNEL = "AT$RC"
    const CMD_SEND_MESSAGE = "AT$SF="
    const CMD_SEND_MESSAGE_RESPONSE = ",1"
    const CMD_GET_ID = "AT$I=10"
    const CMD_GET_PAC = "AT$I=11"
    const CMD_EMULATOR_DISABLE = "ATS410=0"
    const CMD_EMULATOR_ENABLE = "ATS410=1"

    // /////////////////////////////////////////////////////////////////////////////
    // Wisol Command Steps: A Command Step contains a list
    // of Wisol AT Commands to be sent for executing the
    // step.  We only implement 2 steps for the Wisol
    // module: Begin Step -> Send Step (1) Begin Step: On
    // startup, set the emulation mode and get the device
    // ID and PAC. (2) Send Step: Send the payload, after
    // setting the TX power and channel. Optional: Request
    // for downlink Each Wisol AT Command added through
    // addCmd() may include a Response Processing Function
    // e.g. getID(), getPAC().  The function is called
    // with the response text generated from the Wisol AT
    // Command.
    function getStepBegin(
        context: NetworkContext,
        args: StepArgs): void {
        //  Return the list of Wisol AT commands for the Begin Step, to start up the Wisol module.  //  debug(F(" - wisol.getStepBegin"));
        addCmd(args.list, args.listSize, {
            //  Set emulation mode.
            sendData: context.useEmulator  //  If emulator mode,
                ? F(CMD_EMULATOR_ENABLE)   //  Device will only talk to SNEK emulator.
                : F(CMD_EMULATOR_DISABLE), //  Else device will only talk to Sigfox network.
            expectedMarkerCount: 1,
            processFunc: null,
            payload: null, sendData2: null
        });
        //  Get Sigfox device ID and PAC.
        addCmd(args.list, args.listSize, {
            sendData: F(CMD_GET_ID),
            expectedMarkerCount: 1,
            processFunc: getID,
            payload: null, sendData2: null
        });
        addCmd(args.list, args.listSize, {
            sendData: F(CMD_GET_PAC),
            expectedMarkerCount: 1,
            processFunc: getPAC,
            payload: null, sendData2: null
        });
    }

    function getStepSend(
        context: NetworkContext,
        args: StepArgs): void {
        //  Return the list of Wisol AT commands for the Send Step, to send the payload.
        //  Payload contains a string of hex digits, up to 24 digits / 12 bytes.
        //  We prefix with AT$SF= and send to the transceiver.  If enableDownlink is true, we append the
        //  CMD_SEND_MESSAGE_RESPONSE command to indicate that we expect a downlink repsonse.
        //  The downlink response message from Sigfox will be returned in the response parameter.
        //  Warning: This may take up to 1 min to run.  //  debug(F(" - wisol.getStepSend"));
        //  Set the output power for the zone.
        getStepPowerChannel(context, args.list, args.listSize);

        //  Compose the payload sending command.
        let markers = 1;  //  Wait for 1 line of response.
        let processFunc: (context: NetworkContext, response: string) => boolean = null;  //  Function to process result.
        let sendData2: string = null;  //  Text to be appended to payload.

        // If no downlink: Send CMD_SEND_MESSAGE + payload
        if (args.enableDownlink) {
            //  For downlink mode: send CMD_SEND_MESSAGE + payload + CMD_SEND_MESSAGE_RESPONSE
            markers++;  //  Wait for one more response line.   
            processFunc = getDownlink;  //  Process the downlink message.
            sendData2 = F(CMD_SEND_MESSAGE_RESPONSE);  //  Append suffix to payload.
        }
        addCmd(args.list, args.listSize, {
            sendData: F(CMD_SEND_MESSAGE),
            expectedMarkerCount: markers,
            processFunc: processFunc,
            payload: args.payload,
            sendData2: sendData2
        });
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

    // /////////////////////////////////////////////////////////////////////////////
    // Wisol Response Processing Functions: Called to
    // process response when response is received from
    // Wisol AT Command.
    function getID(context: NetworkContext, response: string): boolean {
        //  Save the device ID to context.
        context.device = response;
        debug(F("<< wisol.getID "), context.device);
        return true;
    }

    function getPAC(context: NetworkContext, response: string): boolean {
        //  Save the PAC code to context.  Note that the PAC is only valid
        //  for the first registration in the Sigfox portal.  After
        //  registering the device, the PAC is changed in the Sigfox portal
        //  but not in the Wisol AT Command.  You must get the updated
        //  PAC from the Sigfox portal if you wish to transfer the device.
        context.pac = response;
        debug(F("<< wisol.getPAC "), context.pac);
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

    // Downlink Server Support:
    // https://backend.sigfox.com/apidocs/callback When a
    // message needs to be acknowledged, the callback
    // selected for the downlink data must send data in
    // the response. It must contain the 8 bytes data that
    // will be sent to the device asking for
    // acknowledgment. The data is json formatted, and
    // must be structured as the following :
    // {"YOUR_DEVICE_ID" : { "downlinkData" :
    // "deadbeefcafebabe"}} With YOUR_DEVICE_ID being
    // replaced by the corresponding device id, in
    // hexadecimal format, up to 8 digits. The downlink
    // data must be 8 bytes in hexadecimal format.  For
    // example: {"002C2EA1" : { "downlinkData" :
    // "0102030405060708"}}
    function getDownlink(context: NetworkContext, response0: string): boolean {
        //  Extract the downlink message and write into the context response.
        //  context response will be returned as an 8-byte hex string, e.g. "0123456789ABCDEF"
        //  or a timeout error after 1 min e.g. "ERR_SFX_ERR_SEND_FRAME_WAIT_TIMEOUT"

        //  Get a writeable response pointer in the uartContext.
        let response2 = context.uartContext.response;  // debug(F(" - wisol.getDownlink: "), response);

        //  Check the original response.
        //  If Successful response: OK\nRX=01 23 45 67 89 AB CD EF
        //  -> Change response to: 0123456789ABCDEF
        //  If Timeout response: ERR_SFX_ERR_SEND_FRAME_WAIT_TIMEOUT\n
        //  -> Remove newline: ERR_SFX_ERR_SEND_FRAME_WAIT_TIMEOUT

        //  Remove the prefix and spaces:
        //    replace "OK\nRX=" by "", replace " " by ""
        const downlinkPrefix = "OK\nRX=";
        let foundIndex = -1;
        //  Implements: const foundIndex = response.indexOf(downlinkPrefix);
        for (let k = 0; k + downlinkPrefix.length <= response2.length; k++) {
            if (response2.substr(k, downlinkPrefix.length) === downlinkPrefix) {
                foundIndex = k;
                break;
            }
        }
        if (foundIndex >= 0) {
            //  Found the delimiter. Transform <<BEFORE>>OK\nRX=<<AFTER>>
            //  To <<BEFORE>><<AFTER>>
            //  foundIndex points to "OK\nRX=".

            //  Shift <<AFTER>> next to <<BEFORE>>.
            const after = response2.substr(foundIndex + downlinkPrefix.length);
            response2 = response2.substr(0, foundIndex - 1) + after;
        } else {
            //  Return error e.g. ERR_SFX_ERR_SEND_FRAME_WAIT_TIMEOUT
            context.status = false;
        }
        //  Remove all spaces.
        let src = 0, dst = 0;
        let newResponse = "";
        for (; ;) {
            if (src >= MAX_UART_SEND_MSG_SIZE) break;
            //  Don't copy spaces and newlines in the source.
            if (response2[src] === ' ' || response2[src] === '\n') {
                src++;
                continue;
            }
            //  Copy the character.
            newResponse = newResponse + response2[src];
            //  If we have copied the terminating null, quit.
            ////if (dst >= response.length) { break; }
            dst++; src++;  //  Shift to next char.
        }
        response2 = newResponse;
        context.downlinkData = response2;
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
        responseMsg: Msg_t,
        responseTaskID: number): void {
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
            const cmdDataStr2 = cmdData;
            uartData = uartData + cmdDataStr2;
            uartMsg.timeout = DOWNLINK_TIMEOUT;  //  Increase timeout for downlink.
        }
        //  Terminate the command with "\r".
        uartData = uartData + CMD_END;
        //  Check total msg length.
        if (uartData.length >= MAX_UART_SEND_MSG_SIZE - 1) {
            debug_print(F("***** Error: uartData overflow - ")); debug_print(uartData.length + "");
            debug_print(" / "); debug_println(uartData); debug_flush();
        }
        uartMsg.markerChar = END_OF_RESPONSE;
        uartMsg.expectedMarkerCount = cmd.expectedMarkerCount;
        uartMsg.successEvent = successEvent0;
        uartMsg.failureEvent = failureEvent0;
        uartMsg.sendData = uartData;
    }

    export function setup_wisol(
        context: NetworkContext,
        uartContext: UARTContext,
        uartTaskID: number,
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

        //  Populate the command list.
        cmdList = [];
        for (let l = 0; l < MAX_NETWORK_CMD_LIST_SIZE; l++) {
            let cmd2: NetworkCmd = {
                sendData: null,
                expectedMarkerCount: 0,
                processFunc: null,
                payload: null,
                sendData2: null,
            };
            cmdList.push(cmd2);
        }

        //  Init the UART message.
        uartMsg = {
            debugMsg: false,
            sendData: null,
            timeout: 0,
            markerChar: 0,
            expectedMarkerCount: 0,
            successEvent: null,
            failureEvent: null,
            responseMsg: null,
            responseTaskID: 0,
        };
    }

    function addCmd(list: Array<NetworkCmd>, listSize: number, cmd: NetworkCmd): void {
        //  Append the UART message to the command list.
        //  Stop if we have overflowed the list.
        let m = getCmdIndex(list, listSize);
        list[m++] = cmd;
        list[m++] = endOfList;
    }

    function getCmdIndex(list: Array<NetworkCmd>, listSize: number): number {
        //  Given a list of commands, return the index of the next empty element.
        //  Check index against cmd size.  It must fit 2 more elements:
        //  The new cmd and the endOfList cmd.
        let n = 0;
        for (n = 0;  //  Search all elements in list.
            list[n].sendData &&   //  Skip no-empty elements.
            n < listSize - 1;  //  Don't exceed the list size.
            n++) { }
        if (n >= listSize - 1) {
            //  List is full.
            debug_print(F("***** Error: Cmd list overflow - ")); debug_println(n + ""); debug_flush();
            n = listSize - 2;
            if (n < 0) n = 0;
        }
        return n;
    }
}