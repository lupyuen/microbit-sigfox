//% color="purple" block="Sigfox"
namespace sigfox {
    // From downlink.cpp
    export function process_downlink_msg(
        context: NetworkContext,  //  Task context.
        status: boolean,          //  True if downlink was received.
        data: string): boolean {  //  Downlink data (up to 8 bytes in hex e.g. "0102030405060708") or error name.
        if (status) { debug(F(" - process_downlink_msg: "), data); }
        else { debug(F(" - process_downlink_msg (Failed): "), data); }

        //  TODO: Add your code here to process the downlink message.
        return true;  //  Means no error.
    }    
}